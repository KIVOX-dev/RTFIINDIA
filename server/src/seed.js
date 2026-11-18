// Seeds all known RTF content so nothing has to be retyped. Safe to re-run: `npm run seed` resets content,
// the server also calls seedIfEmpty() on startup. Drop exported Wix images into /seed-assets (see README).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Setting, Member, Post, Award, GalleryItem, PriceList, ReferenceChart, Admin } from './models/index.js';
import { slugify } from './util.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(here, '../../seed-assets');
const uploadsDir = path.resolve(here, '../uploads/seed');
const IMG = /\.(png|jpe?g|webp|gif|svg)$/i;

const office = [
  ['Mr. Jayabal', 'Founder and Chairman'], ['K.A. Seetharamaraja', 'General Secretary'], ['B. Manohar', 'Deputy Chairman'],
  ['S.P. Shivakumar', 'Vice President'], ['S. Sathiya Seelan', 'Vice Chairman'], ['J. Ramesh Kumar', 'Vice Chairman'],
  ['D. Ragu', 'Treasurer'], ['N R Gomathi Shankar', 'Joint Treasurer'], ['J Pradeep Kumar', 'CEO'],
];
const zonal = [
  ['D. Velusamy', 'Darsan Textiles'], ['M. Kesavaraj', 'Sri Swamy Yarns'], ['R. Ram Singh', 'Radha Spinners'],
  ['L. Thangavel', 'Sri Amman Tex'], ['S. Sundaresan', 'Sri Selvanayaki Amman Textiles'], ['P. Dinesh', ''],
];
const management = [
  ['A.P. Govindaraj', ''], ['R. Ramakrishnan', ''], ['S. Gowrishankar', 'SMBS Cotton Spinners'], ['P. Elangovan', ''],
  ['A. Manickavadivel', 'Aanandham Textiles'], ['M. Palanivel', ''], ['K. Devaraju', ''], ['K. Asokan', ''],
  ['K. Venugopal', 'Subam Textiles'], ['R. Parthasarathi', ''], ['Sivakumar P.S', 'Shri Saradha Spinners'],
];
const events = ['Bharat Tex', 'Man Made Fiber Conclave', 'Yarn Fabrics 2025', 'Textile Fairs India', 'Yarn Fabrics Accessories Show 2024'];

export const defaultSettings = {
  site: { name: 'Recycle Textile Federation', short: 'RTF', logoUrl: '', location: 'Coimbatore, Tamil Nadu' },
  hero: {
    tagline: 'Empowering Open End Spinning Mills Across the Globe',
    sub: 'Daily yarn and CAI spot rates, news and member updates for Open End spinning mills in Coimbatore, Tamil Nadu.',
    ctaLabel: 'Explore', ctaLink: '/about',
    points: ['Daily yarn rates', 'CAI spot rates', 'Member news', 'WhatsApp sharing'],
  },
  home: {
    promo: { title: "Today's rates, one tap away.", text: 'Open the yarn price list and CAI spot rate, then forward them to your WhatsApp group in a tap.', cta: 'View rates', link: '/prices/yarn' },
    promo2: { title: 'Daily news and notices, straight from the RTF office.', text: 'Short cards on market, cotton, meetings and events.', cta: 'Read updates', link: '/news' },
    platform: { before: 'The one platform', highlight: 'recycled yarn mills', after: "have been looking for" },
  },
  vision: {
    heading: 'Growth with Awareness',
    text: 'RTF brings textile recycling producers onto one platform for collaborative growth.',
  },
  stats: [
    { value: 400, suffix: '+', label: 'OE mills in Tamil Nadu' },
    { value: 260, suffix: '', label: 'Make grey yarn' },
    { value: 230, suffix: '', label: 'Make colour yarn' },
    { value: 12, suffix: ' lakh', label: 'Powerloom units supplied' },
    { value: 80, suffix: ' lakh', label: 'Handloom weavers supplied' },
  ],
  features: [
    { icon: 'price', title: 'Weekly pricing discipline', text: 'Yarn and CAI spot rates published on a fixed schedule, so every member trades from the same numbers.' },
    { icon: 'meet', title: 'Member meetings', text: 'Regular meetings of the executive, zonal and management committees keep the industry connected.' },
    { icon: 'free', title: 'Free exposure', text: 'Membership is free, and so are all member benefits, including exposure to buyers and fairs.' },
    { icon: 'award', title: 'RTF Awards', text: 'Annual awards recognise mills and people who move recycled textiles forward.' },
    { icon: 'news', title: 'News and notices', text: 'Daily market updates, cotton and raw material news, policy changes and event notices.' },
    { icon: 'community', title: 'Active community', text: 'Interested mills can join the active RTF WhatsApp group through the executive committee.' },
  ],
  about: {
    heading: 'Recycling textile waste into usable material',
    intro: [
      'Recycle Textile Federation (RTF) is an association of Open End spinning mills in Coimbatore, Tamil Nadu. It brings textile recycling producers onto one platform for collaborative growth.',
      'India produces large yearly volumes of textile waste, including cotton waste, cutting and garment waste and PET fibre. Much of it was long sent to landfill.',
      'Open-end (OE) spinning mills exist to recycle that waste into usable material.',
    ],
    facts: [
      'Over 400 OE mills in Tamil Nadu: 260 make grey yarn and 230 make colour yarn.',
      'These mills supply yarn to about 12 lakh powerloom units and 80 lakh handloom weavers across India.',
      'Products made from recycled yarn include bed sheets, made-ups, curtains, towels, school uniforms and other garments.',
      'RTF exists for collaborative growth, industry networking, and access to technical guidance and knowledge.',
      'The yarn price list and CAI spot rates are published on this website, so members can check them in one place and share them on WhatsApp.',
      'Membership is free and all member benefits are free. Interested mills can contact the executive committee to join the active RTF WhatsApp group.',
    ],
    products: ['Bed sheets', 'Made-ups', 'Curtains', 'Towels', 'School uniforms', 'Other garments'],
    purpose: ['Collaborative growth', 'Industry networking', 'Access to technical guidance and knowledge'],
    steps: [
      'Textile waste is generated | India produces large yearly volumes of textile waste: cotton waste, cutting and garment waste, and PET fibre.',
      'OE mills recycle it | Open-end (OE) spinning mills turn that waste into usable yarn instead of it going to landfill.',
      'Yarn reaches weavers | The yarn goes to powerloom units and handloom weavers, and becomes bed sheets, towels, curtains, uniforms and more.',
    ],
    who: [
      'OE spinning mills | Over 400 mills in Tamil Nadu: 260 make grey yarn and 230 make colour yarn.',
      'Powerloom units | About 12 lakh powerloom units across India buy yarn from these mills.',
      'Handloom weavers | About 80 lakh handloom weavers across India weave with recycled yarn.',
    ],
    faq: [
      'Is RTF membership free? | Yes. Membership is free and all member benefits are free.',
      'How do I join RTF? | Interested mills contact the executive committee to join the active RTF WhatsApp group. Use the Join RTF button or the Contact page.',
      'Where can I see yarn prices? | On the Yarn Price List page. It is updated by the RTF office, and you can share the rates on WhatsApp.',
      'What is made from recycled yarn? | Bed sheets, made-ups, curtains, towels, school uniforms and other garments.',
      'What is RTF for? | Collaborative growth, industry networking, and access to technical guidance and knowledge.',
    ],
    membership:
      'Membership is free and all benefits are free. Yarn prices are updated on the Yarn Price page. Interested mills can contact the executive committee to join the active WhatsApp group.',
    joinUrl: '',
  },
  contact: {
    address: '6/73, Vellanaipatti (PO), Saravanampatti,\nCoimbatore- 641048\nTamil Nadu, India.',
    email: 'recycletextilefederation@gmail.com', phone: '+91 98422 08382', whatsapp: '', mapUrl: '',
  },
  hours: [
    { label: 'Monday to Friday', days: [1, 2, 3, 4, 5], open: '10:00', close: '18:30' },
    { label: 'Saturday', days: [6], open: '11:00', close: '17:00' },
    { label: 'Sunday', days: [0], open: '', close: '' },
  ],
  social: { instagram: '', linkedin: '', youtube: '', facebook: '' },
  footer: { credit: 'Website by GrowaLabs', note: 'Recycle Textile Federation, Coimbatore' },
  categories: [
    { name: 'Market update', color: '#3395FF' }, { name: 'Cotton and raw material', color: '#12B76A' },
    { name: 'Meeting and notice', color: '#7A5AF8' }, { name: 'Event', color: '#F79009' }, { name: 'Policy', color: '#0E9384' },
    { name: 'Member news', color: '#EE46BC' }, { name: 'Price alert', color: '#F04438' },
  ],
  cai: { headerUrl: '' },
};

function stageFile(src, rel) {
  const dest = path.join(uploadsDir, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return `/uploads/seed/${rel.replace(/\\/g, '/')}`;
}
const list = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => IMG.test(f) || /\.pdf$/i.test(f)).sort() : []);

async function migrateAssets() {
  if (!fs.existsSync(assetsDir)) return 0;
  let n = 0;
  const logo = list(assetsDir).find((f) => /^logo\./i.test(f));
  if (logo) { await Setting.updateOne({ key: 'site' }, { $set: { 'value.logoUrl': stageFile(path.join(assetsDir, logo), logo) } }); n++; }
  const cotton = list(assetsDir).find((f) => /^cotton-header\./i.test(f));
  if (cotton) { await Setting.updateOne({ key: 'cai' }, { $set: { 'value.headerUrl': stageFile(path.join(assetsDir, cotton), cotton) } }); n++; }
  for (const group of ['office', 'zonal', 'management']) {
    const all = await Member.find({ group }).lean();
    for (const f of list(path.join(assetsDir, group))) {
      const slug = slugify(path.parse(f).name);
      const hit = all.find((x) => slugify(x.name) === slug) || all.find((x) => slugify(x.name).startsWith(slug.split('-')[0] + '-'));
      if (hit) { await Member.updateOne({ _id: hit._id }, { photoUrl: stageFile(path.join(assetsDir, group, f), `${group}/${f}`) }); n++; }
    }
  }
  const gal = async (folder, category) => {
    let i = 0;
    for (const f of list(path.join(assetsDir, folder))) {
      await GalleryItem.create({ imageUrl: stageFile(path.join(assetsDir, folder, f), `${folder}/${f}`), alt: path.parse(f).name.replace(/[-_]/g, ' '), category, order: i++ });
      n++;
    }
  };
  await gal('about', 'about'); await gal('grey-yarn', 'grey-yarn'); await gal('gallery', 'gallery');
  for (const f of list(path.join(assetsDir, 'events'))) {
    const key = slugify(path.parse(f).name);
    const posts = await Post.find({ kind: 'event' }).lean();
    const hit = posts.find((p) => key.includes(slugify(p.title)) || slugify(p.title).includes(key));
    if (hit) { await Post.updateOne({ _id: hit._id }, { imageUrl: stageFile(path.join(assetsDir, 'events', f), `events/${f}`), imageAlt: hit.title }); n++; }
  }
  for (const y of fs.existsSync(path.join(assetsDir, 'awards')) ? fs.readdirSync(path.join(assetsDir, 'awards')) : []) {
    let i = 0;
    for (const f of list(path.join(assetsDir, 'awards', y))) {
      await Award.create({ year: Number(y), title: `RTF Awards ${y}`, imageUrl: stageFile(path.join(assetsDir, 'awards', y, f), `awards/${y}/${f}`), alt: `RTF Awards ${y}`, order: i++ });
      n++;
    }
  }
  const catMap = { 'labour-cost': 'Labour cost', 'power-cost': 'Power cost', 'cotton-vs-comber-noils': 'Cotton vs comber noils' };
  for (const [folder, category] of Object.entries(catMap)) {
    for (const f of list(path.join(assetsDir, 'reference', folder))) {
      await ReferenceChart.create({
        title: path.parse(f).name.replace(/[-_]/g, ' '), category, isPdf: /\.pdf$/i.test(f), alt: `${category} chart (archive)`,
        fileUrl: stageFile(path.join(assetsDir, 'reference', folder, f), `reference/${folder}/${f}`), date: new Date().toISOString().slice(0, 10),
      });
      n++;
    }
  }
  return n;
}

// ---- optional demo data (clearly marked as sample so it is never mistaken for real rates)
const yarnSample = [['6s', 38], ['8s', 42], ['10s', 46], ['12s', 49], ['14s', 52], ['16s', 55], ['20s', 60], ['24s', 66]];
const caiSample = [['Shankar-6', 54000], ['DCH-32', 62000], ['MCU-5', 57000], ['Suvin', 98000], ['Cotton waste (grey)', 8800], ['Comber noils', 11200]];
function rng(seed) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }
async function seedDemo() {
  const rand = rng(42);
  const ist = (d) => new Date(d.getTime() + 5.5 * 3600e3).toISOString().slice(0, 10);
  for (const [type, base, unit] of [['yarn', yarnSample, '₹/kg'], ['cai', caiSample, '₹/candy']]) {
    let cur = base.map(([, r]) => r);
    for (let d = 30; d >= 0; d--) {
      const prev = cur.slice();
      cur = cur.map((r) => Math.max(1, Math.round((r * (1 + (rand() - 0.46) * 0.025)) * 2) / 2));
      await PriceList.create({
        type, date: ist(new Date(Date.now() - d * 864e5)),
        rows: base.map(([item], i) => ({ item, unit, rate: cur[i], prev: d === 30 ? null : prev[i], note: i === 0 ? 'Sample data' : '' })),
      });
    }
  }
  const cards = [
    ['Market update', 'Sample: Yarn demand steady this week', 'Sample card. Replace with the real market update from the RTF office.', true],
    ['Meeting and notice', 'Sample: Monthly member meeting notice', 'Sample card. Meeting notices, venue and time go here.', false],
    ['Cotton and raw material', 'Sample: Cotton arrivals update', 'Sample card showing a short daily update with a category pill.', false],
    ['Event', 'Sample: Textile fair registration open', 'Sample card for event notices.', false],
    ['Policy', 'Sample: Policy circular shared with members', 'Sample card for policy circulars.', false],
    ['Member news', 'Sample: New member mill joins RTF', 'Sample card. Delete or edit from the admin News tab.', false],
  ];
  let i = 0;
  for (const [category, title, summary, pinned] of cards) {
    await Post.create({ kind: 'news', title, slug: slugify(title), summary, category, pinned, publishAt: new Date(Date.now() - i++ * 3.7 * 3600e3) });
  }
}

export async function seedContent({ demo = false } = {}) {
  for (const [key, value] of Object.entries(defaultSettings)) await Setting.updateOne({ key }, { $setOnInsert: { value } }, { upsert: true });
  await Member.deleteMany({});
  let o = 0;
  await Member.insertMany([
    ...office.map(([name, role], i) => ({ group: 'office', name, role, order: i })),
    ...zonal.map(([name, firm], i) => ({ group: 'zonal', name, role: 'Zonal Secretary', firm, order: i })),
    ...management.map(([name, firm], i) => ({ group: 'management', name, role: 'Management Committee', firm, order: i })),
  ]);
  void o;
  for (const [i, title] of events.entries()) {
    if (!(await Post.exists({ slug: slugify(title) })))
      await Post.create({ kind: 'event', title, slug: slugify(title), summary: '', category: 'Event', publishAt: new Date(Date.now() - i * 864e5) });
  }
  for (const y of [2025, 2024, 2022]) if (!(await Award.exists({ year: y }))) await Award.create({ year: y, title: `RTF Awards ${y}`, order: 0 });
  if (demo) await seedDemo();
  const assets = await migrateAssets();
  console.log(`[seed] content ready${demo ? ' + demo data' : ''}; ${assets} asset(s) migrated from seed-assets/`);
}

export async function seedIfEmpty() {
  if (!(await Setting.exists({ key: 'site' }))) await seedContent({ demo: process.env.SEED_DEMO === 'true' });
}

// CLI: node src/seed.js [--demo]   (resets members/events/awards and refreshes assets; keeps edited settings)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { connect } = await import('./db.js');
  await connect();
  await Promise.all([GalleryItem.deleteMany({}), Award.deleteMany({}), ReferenceChart.deleteMany({})]);
  if (process.argv.includes('--demo')) await Promise.all([PriceList.deleteMany({}), Post.deleteMany({ kind: 'news' })]);
  await seedContent({ demo: process.argv.includes('--demo') });
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && !(await Admin.exists({ email: process.env.ADMIN_EMAIL.toLowerCase() })))
    await Admin.create({ email: process.env.ADMIN_EMAIL, passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10) });
  await mongoose.disconnect();
  process.exit(0);
}
