import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as XLSX from 'xlsx';
import { Admin, User, PriceList, Post, GalleryItem, Award, Member, Setting, ReferenceChart, Message } from '../models/index.js';
import { requireAdmin, sign } from '../middleware/auth.js';
import { sendMail } from '../mail.js';
import { getPool, AIUnavailableError } from '../ai/groqPool.js';
import { summarizePrices, draftPost } from '../ai/features.js';
import { todayIST, clean, cleanLong, cleanDeep, safeUrl, slugify, isDate } from '../util.js';

export const uploadDir = path.resolve('uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const okType = /^(image\/(jpeg|png|webp|gif|svg\+xml)|application\/pdf)$/;
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_q, f, cb) =>
      cb(null, `${Date.now()}-${crypto.randomBytes(3).toString('hex')}${path.extname(f.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '')}`),
  }),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_q, f, cb) => (okType.test(f.mimetype) ? cb(null, true) : cb(new Error('Only images and PDF files are allowed'))),
});
const memUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const rxs = (s) => new RegExp(String(s).slice(0, 60).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

// ---------- auth
export const authRouter = Router();
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, message: { error: 'Too many attempts. Try again in a few minutes.' } });
authRouter.post('/login', loginLimit, async (req, res) => {
  const email = clean(req.body?.email, 120).toLowerCase();
  const a = await Admin.findOne({ email });
  if (!a || !(await bcrypt.compare(String(req.body?.password || ''), a.passwordHash)))
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  res.json({ token: sign(a), email: a.email });
});
authRouter.post('/password', requireAdmin, async (req, res) => {
  const { current, next } = req.body || {};
  const a = await Admin.findById(req.admin.id);
  if (!a || !(await bcrypt.compare(String(current || ''), a.passwordHash))) return res.status(400).json({ error: 'Current password is incorrect.' });
  if (String(next || '').length < 8) return res.status(422).json({ error: 'New password must be at least 8 characters.' });
  a.passwordHash = await bcrypt.hash(String(next), 10);
  await a.save();
  res.json({ ok: true });
});

// ---------- admin router
const r = Router();
r.use(requireAdmin);

r.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.status(201).json({ url: `/uploads/${req.file.filename}`, name: req.file.originalname, isPdf: req.file.mimetype === 'application/pdf' });
});

r.get('/summary', async (_q, res) => {
  const today = todayIST();
  const info = async (type) => {
    const d = await PriceList.findOne({ type }).sort({ date: -1 }).select('date updatedAt').lean();
    return { latestDate: d?.date || null, publishedToday: d?.date === today, updatedAt: d?.updatedAt || null };
  };
  res.json({
    today, yarn: await info('yarn'), cai: await info('cai'),
    posts: await Post.countDocuments({ kind: 'news' }), unread: await Message.countDocuments({ read: false }),
    scheduled: await Post.countDocuments({ publishAt: { $gt: new Date() } }), pendingUsers: await User.countDocuments({ status: 'pending' }),
  });
});

// ---------- prices
function cleanRows(rows) {
  if (!Array.isArray(rows)) return [];
  const num = (v) => (v === '' || v == null || isNaN(Number(v)) ? null : Number(v));
  return rows
    .slice(0, 300)
    .map((x) => ({ item: clean(x.item, 120), unit: clean(x.unit, 30), note: clean(x.note, 200), rate: num(x.rate), prev: num(x.prev) }))
    .filter((x) => x.item);
}
/** Fire-and-forget: a failing AI never blocks or fails a price save. Only writes if the list was not edited meanwhile. */
function summarizeInBackground(doc) {
  summarizePrices(doc.type, doc.date, doc.rows.map((x) => x.toObject?.() ?? x))
    .then((text) => text && PriceList.updateOne({ _id: doc._id, updatedAt: doc.updatedAt }, { $set: { aiSummary: text } }, { timestamps: false }))
    .catch((e) => console.warn('[ai] price summary skipped:', e.message));
}
r.get('/prices/:type', async (req, res) => {
  const docs = await PriceList.find({ type: req.params.type }).sort({ date: -1 }).limit(60).select('date updatedAt rows').lean();
  res.json(docs.map((d) => ({ date: d.date, updatedAt: d.updatedAt, count: d.rows.length })));
});
// Parse an Excel/CSV sheet into rows (nothing is saved until the editor saves)
r.post('/prices-import', memUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
    const head = (sheet[0] || []).map((h) => String(h).toLowerCase());
    const col = (names, fb) => {
      const i = head.findIndex((h) => names.some((n) => h.includes(n)));
      return i >= 0 ? i : fb;
    };
    const ci = col(['item', 'count', 'variety', 'name'], 0), cu = col(['unit'], 1), cr = col(['rate', 'price'], 2), cn = col(['note', 'remark'], 3);
    const rows = sheet
      .slice(1)
      .map((l) => ({
        item: clean(l[ci], 120), unit: clean(l[cu], 30), note: clean(l[cn], 200),
        rate: l[cr] === '' ? null : Number(String(l[cr]).replace(/,/g, '')),
      }))
      .filter((x) => x.item)
      .map((x) => ({ ...x, rate: Number.isFinite(x.rate) ? x.rate : null }));
    res.json({ rows });
  } catch {
    res.status(422).json({ error: 'Could not read that file. Use .xlsx or .csv with columns: Item, Unit, Rate, Note.' });
  }
});
r.get('/prices/:type/:date', async (req, res) => {
  const { type, date } = req.params;
  if (!['yarn', 'cai'].includes(type) || !isDate(date)) return res.status(400).json({ error: 'Bad request' });
  const doc = await PriceList.findOne({ type, date }).lean();
  const base = await PriceList.findOne({ type, date: { $lt: date } }).sort({ date: -1 }).lean();
  res.json({ doc: doc || null, base: base || null });
});
r.put('/prices/:type/:date', async (req, res) => {
  const { type, date } = req.params;
  if (!['yarn', 'cai'].includes(type) || !isDate(date)) return res.status(400).json({ error: 'Bad request' });
  const rows = cleanRows(req.body?.rows);
  if (!rows.length) return res.status(422).json({ error: 'Add at least one row.' });
  const prevDoc = await PriceList.findOne({ type, date: { $lt: date } }).sort({ date: -1 }).lean();
  const prevMap = new Map((prevDoc?.rows || []).map((x) => [x.item, x.rate]));
  rows.forEach((x) => {
    if (x.prev == null && prevMap.has(x.item)) x.prev = prevMap.get(x.item);
  });
  const update = { rows };
  if (req.body.poster !== undefined) {
    update.poster = safeUrl(req.body.poster);
    update.posterName = clean(req.body.posterName, 120);
  }
  // Rates changed, so any earlier AI summary is stale. A fresh one is generated in the background below.
  const doc = await PriceList.findOneAndUpdate({ type, date }, { $set: update, $unset: { aiSummary: 1 } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  summarizeInBackground(doc);
  // Rates are members-only, so the public news card never contains figures: its text is fixed on the server.
  let alertPost = null;
  if (req.body.alert?.create) {
    const nm = type === 'yarn' ? 'Yarn' : 'CAI';
    alertPost = await createPost({
      kind: 'news', title: `${nm} prices updated for ${new Date(`${date}T12:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}`,
      summary: `Today's ${type === 'yarn' ? 'yarn' : 'CAI'} prices are published. Sign in to view.`, category: 'Price alert', linkUrl: '/dashboard',
    });
  }
  res.json({ doc, alertPost });
});
r.delete('/prices/:type/:date', async (req, res) => {
  await PriceList.deleteOne({ type: req.params.type, date: req.params.date });
  res.json({ ok: true });
});

// ---------- posts
function postFields(b) {
  const f = {};
  if (b.kind !== undefined && ['news', 'blog', 'event'].includes(b.kind)) f.kind = b.kind;
  if (b.title !== undefined) f.title = clean(b.title, 90);
  if (b.summary !== undefined) f.summary = clean(b.summary, 280);
  if (b.body !== undefined) f.body = cleanLong(b.body, 30000);
  if (b.category !== undefined) f.category = clean(b.category, 40);
  if (b.pinned !== undefined) f.pinned = !!b.pinned;
  if (b.hidden !== undefined) f.hidden = !!b.hidden;
  if (b.imageUrl !== undefined) f.imageUrl = safeUrl(b.imageUrl);
  if (b.imageAlt !== undefined) f.imageAlt = clean(b.imageAlt, 160);
  if (b.linkUrl !== undefined) f.linkUrl = safeUrl(b.linkUrl);
  if (b.attachmentUrl !== undefined) f.attachmentUrl = safeUrl(b.attachmentUrl);
  if (b.eventDate !== undefined) f.eventDate = clean(b.eventDate, 40);
  if (b.publishAt) {
    const d = new Date(b.publishAt);
    if (!isNaN(d)) f.publishAt = d;
  }
  return f;
}
async function uniqueSlug(title) {
  const base = slugify(title);
  let s = base;
  while (await Post.exists({ slug: s })) s = `${base}-${crypto.randomBytes(2).toString('hex')}`;
  return s;
}
async function createPost(b) {
  const f = postFields(b);
  if (!f.title) throw Object.assign(new Error('Headline is required'), { status: 422 });
  return Post.create({ ...f, slug: await uniqueSlug(f.title) });
}
const adminPost = (p) => ({ ...p, status: p.hidden ? 'hidden' : new Date(p.publishAt) > new Date() ? 'scheduled' : 'live' });
r.get('/posts', async (req, res) => {
  const q = {};
  if (req.query.kind) q.kind = String(req.query.kind);
  if (req.query.category) q.category = String(req.query.category);
  if (req.query.date && isDate(String(req.query.date))) {
    const s = new Date(`${req.query.date}T00:00:00+05:30`);
    q.publishAt = { $gte: s, $lt: new Date(s.getTime() + 864e5) };
  }
  if (req.query.q) q.title = rxs(req.query.q);
  const docs = await Post.find(q).sort({ pinned: -1, publishAt: -1 }).limit(200).lean();
  res.json(docs.map(adminPost));
});
r.get('/posts/:id', async (req, res) => res.json(await Post.findById(req.params.id).lean()));
r.post('/posts', async (req, res) => res.status(201).json(await createPost(req.body || {})));
r.put('/posts/:id', async (req, res) => {
  const f = postFields(req.body || {});
  if ('title' in f && !f.title) return res.status(422).json({ error: 'Headline is required' });
  res.json(await Post.findByIdAndUpdate(req.params.id, { $set: f }, { new: true }));
});
r.post('/posts/:id/pin', async (req, res) => {
  const p = await Post.findById(req.params.id);
  p.pinned = !p.pinned;
  await p.save();
  res.json(p);
});
r.post('/posts/:id/duplicate', async (req, res) => {
  const p = (await Post.findById(req.params.id)).toObject();
  res.status(201).json(await createPost({ ...p, pinned: false, hidden: true, publishAt: new Date() }));
});
r.delete('/posts/:id', async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// ---------- generic CRUD for simple collections
function crud(name, Model, spec, sort = { order: 1, createdAt: 1 }) {
  const pick = (b) => {
    const o = {};
    for (const [k, t] of Object.entries(spec)) {
      if (b[k] === undefined) continue;
      if (t === 'num') o[k] = Number(b[k]) || 0;
      else if (t === 'bool') o[k] = !!b[k];
      else if (t === 'url') o[k] = safeUrl(b[k]);
      else if (t === 'table')
        o[k] = Array.isArray(b[k]) ? b[k].slice(0, 80).map((row) => (Array.isArray(row) ? row.slice(0, 12).map((c) => clean(c, 80)) : [])) : undefined;
      else o[k] = clean(b[k], 300);
    }
    return o;
  };
  r.get(`/${name}`, async (_q, res) => res.json(await Model.find().sort(sort).lean()));
  r.post(`/${name}`, async (req, res) => res.status(201).json(await Model.create(pick(req.body || {}))));
  r.put(`/${name}/:id`, async (req, res) =>
    res.json(await Model.findByIdAndUpdate(req.params.id, { $set: pick(req.body || {}) }, { new: true, runValidators: true })));
  r.delete(`/${name}/:id`, async (req, res) => {
    await Model.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  });
}
crud('members', Member, { group: 'str', name: 'str', role: 'str', firm: 'str', photoUrl: 'url', linkedin: 'url', order: 'num' });
crud('gallery', GalleryItem, { imageUrl: 'url', alt: 'str', caption: 'str', category: 'str', order: 'num', w: 'num', h: 'num' }, { order: 1, createdAt: -1 });
crud('awards', Award, { year: 'num', title: 'str', imageUrl: 'url', alt: 'str', order: 'num' }, { year: -1, order: 1 });
crud('reference', ReferenceChart, { title: 'str', category: 'str', fileUrl: 'url', isPdf: 'bool', alt: 'str', date: 'str', table: 'table' }, { date: -1 });

// ---------- member accounts
const userRow = (u) => ({ id: u._id, name: u.name, email: u.email, phone: u.phone, millName: u.millName, city: u.city, status: u.status, lastLoginAt: u.lastLoginAt, createdAt: u.createdAt });
r.get('/users', async (req, res) => {
  const q = {};
  if (['pending', 'approved', 'blocked'].includes(req.query.status)) q.status = req.query.status;
  if (req.query.q) { const x = rxs(req.query.q); q.$or = [{ name: x }, { email: x }, { millName: x }, { phone: x }]; }
  const [users, counts] = await Promise.all([
    User.find(q).sort({ createdAt: -1 }).limit(300).lean(),
    User.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);
  res.json({ users: users.map(userRow), counts: Object.fromEntries(counts.map((c) => [c._id, c.n])) });
});
const setStatus = (status, notify) => async (req, res) => {
  const u = await User.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });
  if (!u) return res.status(404).json({ error: 'Member not found' });
  if (notify && status === 'approved') sendMail({ to: u.email, subject: 'Your RTF account is approved', text: `Hello ${u.name},

Your RTF member account is approved. You can now sign in to view daily yarn and CAI rates.` });
  res.json(userRow(u));
};
r.put('/users/:id/approve', setStatus('approved', true));
r.put('/users/:id/block', setStatus('blocked'));
r.delete('/users/:id', async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});
// Sets a random temporary password and shows it once, so the office can pass it on (for example over WhatsApp).
r.post('/users/:id/reset-password', async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u) return res.status(404).json({ error: 'Member not found' });
  const temp = crypto.randomBytes(6).toString('base64url');
  u.passwordHash = await bcrypt.hash(temp, 10);
  u.resetTokenHash = undefined;
  u.resetExpires = undefined;
  await u.save();
  res.json({ password: temp });
});

// ---------- AI
r.get('/ai/status', (_q, res) => res.json(getPool().status()));
r.post('/ai/draft', async (req, res) => {
  const b = req.body || {};
  const title = clean(b.title, 200), notes = cleanLong(b.notes, 2000);
  if (!title && !notes) return res.status(422).json({ error: 'Add a headline or a few notes first.' });
  try {
    res.json(await draftPost({ kind: ['news', 'blog', 'event'].includes(b.kind) ? b.kind : 'news', title, notes }));
  } catch (e) {
    if (!(e instanceof AIUnavailableError)) console.error('[ai] draft failed', e);
    res.status(503).json({ error: e instanceof AIUnavailableError ? e.message : 'Could not draft right now.' });
  }
});

// ---------- settings & inbox
r.put('/settings/:key', async (req, res) => {
  if (!/^[a-zA-Z][\w.-]{0,40}$/.test(req.params.key)) return res.status(400).json({ error: 'Bad key' });
  const doc = await Setting.findOneAndUpdate({ key: req.params.key }, { $set: { value: cleanDeep(req.body?.value) } }, { upsert: true, new: true });
  res.json(doc);
});
r.get('/messages', async (_q, res) => res.json(await Message.find().sort({ createdAt: -1 }).limit(200).lean()));
r.put('/messages/:id/read', async (req, res) =>
  res.json(await Message.findByIdAndUpdate(req.params.id, { read: req.body?.read !== false }, { new: true })));
r.delete('/messages/:id', async (req, res) => {
  await Message.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default r;
