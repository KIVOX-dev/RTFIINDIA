import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { PriceList, Post, GalleryItem, Award, Member, Setting, ReferenceChart, Message } from '../models/index.js';
import { todayIST, clean, cleanLong, isDate } from '../util.js';
import { sendMail } from '../mail.js';

const r = Router();
const PT = ['yarn', 'cai'];
const liveFilter = () => ({ hidden: false, publishAt: { $lte: new Date() } });
const rx = (s) => new RegExp(String(s).slice(0, 60).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

export async function allSettings() {
  const docs = await Setting.find().lean();
  return Object.fromEntries(docs.map((d) => [d.key, d.value]));
}
r.get('/settings', async (_q, res) => res.json(await allSettings()));
r.get('/stats', async (_q, res) => {
  const s = await Setting.findOne({ key: 'stats' }).lean();
  res.json(s?.value || []);
});

// ---- prices are members-only (see routes/member.js). The public site only learns *that* a list exists.
const labels = { yarn: 'Yarn Price List', cai: 'CAI Spot Rate' };
r.get('/price-meta', async (_q, res) => {
  const out = {};
  for (const type of PT) {
    const d = await PriceList.findOne({ type, date: { $lte: todayIST() } }).sort({ date: -1 }).select('date updatedAt rows.item').lean();
    out[type] = { label: labels[type], date: d?.date || null, updatedAt: d?.updatedAt || null, isToday: d?.date === todayIST(), items: (d?.rows || []).map((x) => x.item) };
  }
  res.json(out);
});
r.use('/prices', (_q, res) => res.status(403).json({ error: 'Price lists are for registered members. Please sign in.', code: 'members_only' }));

// ---- posts
function pubPost(p) {
  const words = (p.body || '').trim().split(/\s+/).filter(Boolean).length;
  return {
    id: p._id, kind: p.kind, title: p.title, slug: p.slug, summary: p.summary, hasBody: !!p.body,
    category: p.category, pinned: p.pinned, imageUrl: p.imageUrl, imageAlt: p.imageAlt, linkUrl: p.linkUrl,
    attachmentUrl: p.attachmentUrl, publishAt: p.publishAt, eventDate: p.eventDate, readMins: Math.max(1, Math.round(words / 200)),
  };
}
r.get('/posts/new-count', async (req, res) => {
  const since = new Date(String(req.query.since || ''));
  if (isNaN(since)) return res.json({ count: 0 });
  res.json({
    count: await Post.countDocuments({ hidden: false, kind: String(req.query.kind || 'news'), publishAt: { $gt: since, $lte: new Date() } }),
  });
});
r.get('/posts', async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
  const base = liveFilter();
  if (req.query.kind) base.kind = String(req.query.kind);
  if (req.query.category) base.category = String(req.query.category);
  if (req.query.date && isDate(String(req.query.date))) {
    const start = new Date(`${req.query.date}T00:00:00+05:30`);
    base.publishAt = { $gte: start, $lt: new Date(start.getTime() + 864e5), $lte: new Date() };
  }
  if (req.query.q) base.$or = [{ title: rx(req.query.q) }, { summary: rx(req.query.q) }];
  const before = req.query.before ? new Date(String(req.query.before)) : null;
  const hasBefore = before && !isNaN(before);
  let items = [];
  if (!hasBefore) items = await Post.find({ ...base, pinned: true }).sort({ publishAt: -1 }).limit(20).lean();
  const rest = { ...base, pinned: false };
  if (hasBefore) rest.publishAt = { ...(base.publishAt || {}), $lt: before };
  const more = await Post.find(rest).sort({ publishAt: -1 }).limit(limit + 1).lean();
  const hasMore = more.length > limit;
  const page = more.slice(0, limit);
  items = items.concat(page);
  res.json({ items: items.map(pubPost), nextBefore: hasMore ? page[page.length - 1].publishAt : null });
});
r.get('/posts/:slug', async (req, res) => {
  const p = await Post.findOne({ slug: req.params.slug, ...liveFilter() }).lean();
  if (!p) return res.status(404).json({ error: 'Not found' });
  Post.updateOne({ _id: p._id }, { $inc: { views: 1 } }).catch(() => {});
  const related = await Post.find({ ...liveFilter(), kind: p.kind, _id: { $ne: p._id } }).sort({ publishAt: -1 }).limit(3).lean();
  res.json({ ...pubPost(p), body: p.body, related: related.map(pubPost) });
});

// ---- content
const byOrder = { order: 1, createdAt: 1 };
r.get('/gallery', async (req, res) => {
  const q = req.query.category ? { category: String(req.query.category) } : {};
  res.json(await GalleryItem.find(q).sort({ order: 1, createdAt: -1 }).lean());
});
r.get('/awards', async (_q, res) => res.json(await Award.find().sort({ year: -1, ...byOrder }).lean()));
r.get('/members', async (_q, res) => res.json(await Member.find().sort(byOrder).lean()));
r.get('/reference', async (_q, res) => {
  const all = await ReferenceChart.find().sort({ date: -1, createdAt: -1 }).lean();
  const cats = {};
  all.forEach((c) => {
    (cats[c.category] ||= { latest: c, history: [] }).history.push(c);
  });
  res.json(cats);
});

// ---- contact
const contactLimit = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 6, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many messages. Please try again later.' },
});
r.post('/contact', contactLimit, async (req, res) => {
  const b = req.body || {};
  const name = clean(b.name, 80), phone = clean(b.phone, 20), mill = clean(b.mill, 100), message = cleanLong(b.message, 1500);
  const errors = {};
  if (name.length < 2) errors.name = 'Please enter your name';
  if (!/^[+\d][\d\s-]{7,16}$/.test(phone)) errors.phone = 'Enter a valid phone number';
  if (message.length < 5) errors.message = 'Please write a short message';
  if (Object.keys(errors).length) return res.status(422).json({ error: 'Please check the form', errors });
  await Message.create({ name, phone, mill, message, ip: req.ip });
  sendMail({ to: process.env.CONTACT_NOTIFY_EMAIL, subject: `New RTF enquiry from ${name}`, text: `${name} (${phone}) ${mill}

${message}` });
  res.status(201).json({ ok: true });
});

export default r;
