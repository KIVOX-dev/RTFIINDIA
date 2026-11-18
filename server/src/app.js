import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { Post } from './models/index.js';
import publicRoutes, { allSettings } from './routes/public.js';
import adminRoutes, { authRouter, uploadDir } from './routes/admin.js';
import { redirects } from './redirects.js';
import userAuthRoutes from './routes/userAuth.js';
import memberRoutes from './routes/member.js';

const app = express();
const SITE = (process.env.SITE_URL || `http://localhost:${process.env.PORT || 4000}`).replace(/\/$/, '');
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') || true }));
app.use(express.json({ limit: '1mb' }));

for (const [from, to] of Object.entries(redirects)) app.get(from, (_q, res) => res.redirect(301, to));
app.use('/uploads', express.static(uploadDir, { maxAge: '30d', immutable: true }));
app.get('/api/health', (_q, res) => {
  const db = mongoose.connection.readyState === 1;
  res.status(db ? 200 : 503).json({ status: db ? 'ok' : 'degraded', db: db ? 'up' : 'down', uptime: Math.round(process.uptime()) });
});
app.use('/api/auth', authRouter);
app.use('/api/user-auth', userAuthRoutes);
app.use('/api/member', memberRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);
app.use('/api', (_q, res) => res.status(404).json({ error: 'Not found' }));

const kindPath = { news: 'news', blog: 'blog', event: 'events' };
app.get('/sitemap.xml', async (_q, res) => {
  const stat = ['/', '/about', '/news', '/blog', '/events', '/awards', '/gallery', '/contact', '/reference', '/members/grey-yarn'];
  const posts = await Post.find({ hidden: false, publishAt: { $lte: new Date() } }).select('kind slug updatedAt').lean();
  const url = (p, d) => `<url><loc>${SITE}${p}</loc>${d ? `<lastmod>${new Date(d).toISOString()}</lastmod>` : ''}</url>`;
  res
    .type('application/xml')
    .send(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${stat.map((p) => url(p)).join('')}${posts
        .map((p) => url(`/${kindPath[p.kind]}/${p.slug}`, p.updatedAt))
        .join('')}</urlset>`,
    );
});
app.get('/robots.txt', (_q, res) => res.type('text/plain').send(`User-agent: *\nDisallow: /admin\nDisallow: /dashboard\nSitemap: ${SITE}/sitemap.xml\n`));

// Production: serve the built client, injecting per-page Open Graph tags (WhatsApp / Google previews)
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (fs.existsSync(dist)) {
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  app.use(express.static(dist, { index: false, maxAge: '7d' }));
  app.get('/{*splat}', async (req, res) => {
    const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
    const s = await allSettings();
    let title = s.site?.name || 'RTF', desc = s.hero?.tagline || '', img = s.site?.logoUrl || '';
    let robots = '';
    // Rates are members-only: price and dashboard pages get a generic title and description, never any figures.
    if (/^\/(prices|dashboard)(\/|$)/.test(req.path)) {
      title = `Member prices | ${s.site?.name || 'RTF'}`;
      desc = 'Daily Open End yarn and CAI spot rates for RTF members. Sign in to view.';
      if (req.path.startsWith('/dashboard')) robots = '<meta name="robots" content="noindex">';
    }
    const m = req.path.match(/^\/(news|blog|events)\/([\w-]+)$/);
    if (m) {
      const p = await Post.findOne({ slug: m[2], hidden: false, publishAt: { $lte: new Date() } }).lean();
      if (p) {
        title = `${p.title} | ${title}`;
        desc = p.summary || desc;
        img = p.imageUrl || img;
      }
    }
    const tags = `${robots}<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="website"><meta property="og:url" content="${esc(SITE + req.path)}">${img ? `<meta property="og:image" content="${esc(img.startsWith('http') ? img : SITE + img)}">` : ''}`;
    res.send(html.replace(/<title>.*?<\/title>/, '').replace('<!--seo-->', tags));
  });
}

app.use((err, _q, res, _n) => {
  if (err.name === 'ValidationError') return res.status(422).json({ error: err.message });
  if (err.name === 'MulterError' || err.status) return res.status(err.status || 400).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

export default app;
