// Saves a copy of the public API answers into public/static-data so the site still shows its content
// when it is hosted without the Node server (for example on Vercel). Run with the API up:
//   node scripts-snapshot.mjs http://localhost:5173
import { mkdirSync, writeFileSync } from 'node:fs';
const base = process.argv[2] || 'http://localhost:5173';
const paths = ['/settings', '/members', '/awards', '/reference', '/price-meta', '/gallery?category=gallery', '/gallery?category=about',
  '/posts?kind=news&limit=3', '/posts?kind=news&limit=6', '/posts?kind=news&limit=50', '/posts?kind=blog&limit=50', '/posts?kind=event&limit=50'];
mkdirSync('public/static-data', { recursive: true });
for (const p of paths) {
  const res = await fetch(`${base}/api${p}`);
  if (!res.ok) { console.log('skip', p, res.status); continue; }
  writeFileSync(`public/static-data/${p.replace(/[^a-z0-9]+/gi, '_')}.json`, JSON.stringify(await res.json()));
  console.log('saved', p);
}
