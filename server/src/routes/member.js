// Everything members-only lives under /api/member (requireUser on every route).
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { PriceList } from '../models/index.js';
import { requireUser } from '../middleware/auth.js';
import { todayIST, clean, isDate } from '../util.js';
import { askRTF, MAX_INPUT } from '../ai/features.js';
import { AIUnavailableError } from '../ai/groqPool.js';
import { publicUser, validPassword } from './userAuth.js';

const r = Router();
r.use(requireUser);
const PT = ['yarn', 'cai'];
const badType = (req, res) => !PT.includes(req.params.type) && (res.status(404).json({ error: 'Unknown list' }), true);

const shape = (d) =>
  d && { type: d.type, date: d.date, rows: d.rows, poster: d.poster, posterName: d.posterName, aiSummary: d.aiSummary || '', updatedAt: d.updatedAt, isToday: d.date === todayIST() };

r.get('/prices/:type/dates', async (req, res) => {
  if (badType(req, res)) return;
  const docs = await PriceList.find({ type: req.params.type, date: { $lte: todayIST() } }).sort({ date: -1 }).limit(120).select('date').lean();
  res.json(docs.map((d) => d.date));
});
r.get('/prices/:type/series', async (req, res) => {
  if (badType(req, res)) return;
  const days = Math.min(Math.max(Number(req.query.days) || 30, 2), 90);
  const docs = (await PriceList.find({ type: req.params.type, date: { $lte: todayIST() } }).sort({ date: -1 }).limit(days).lean()).reverse();
  const series = {};
  docs.forEach((d, i) => d.rows.forEach((row) => { (series[row.item] ||= Array(docs.length).fill(null))[i] = row.rate; }));
  res.json({ dates: docs.map((d) => d.date), series });
});
r.get('/prices/:type', async (req, res) => {
  const { type } = req.params;
  if (badType(req, res)) return;
  const q = { type, date: { $lte: todayIST() } };
  if (req.query.date) {
    if (!isDate(String(req.query.date))) return res.status(400).json({ error: 'Bad date' });
    q.date = String(req.query.date);
  }
  const doc = await PriceList.findOne(q).sort({ date: -1 }).lean();
  res.json(shape(doc) || { type, empty: true });
});

// ---- profile
r.put('/profile', async (req, res) => {
  const b = req.body || {};
  const name = clean(b.name, 80), phone = clean(b.phone, 20);
  if (name.length < 2) return res.status(422).json({ error: 'Please enter your name' });
  if (!/^[+\d][\d\s-]{7,16}$/.test(phone)) return res.status(422).json({ error: 'Enter a valid phone number' });
  Object.assign(req.user, { name, phone, millName: clean(b.millName, 100), city: clean(b.city, 60) });
  await req.user.save();
  res.json({ user: publicUser(req.user) });
});
r.post('/password', async (req, res) => {
  const { current, next } = req.body || {};
  if (!(await bcrypt.compare(String(current || ''), req.user.passwordHash))) return res.status(400).json({ error: 'Current password is incorrect.' });
  if (!validPassword(next)) return res.status(422).json({ error: 'New password must be at least 8 characters.' });
  req.user.passwordHash = await bcrypt.hash(next, 10);
  await req.user.save();
  res.json({ ok: true });
});

// ---- Ask RTF (AI). Limited per member, not per IP, so a shared mill network is not locked out together.
const chatLimit = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
  keyGenerator: (req) => String(req.user._id),
  message: { error: 'You have reached the hourly question limit (30). Please try again later.' },
});
r.post('/ai/chat', chatLimit, async (req, res) => {
  const message = String(req.body?.message ?? '').trim();
  if (!message) return res.status(422).json({ error: 'Please type a question.' });
  if (message.length > MAX_INPUT) return res.status(422).json({ error: `Please keep questions under ${MAX_INPUT} characters.` });
  try {
    res.json({ reply: await askRTF(message, req.body?.history) });
  } catch (e) {
    if (!(e instanceof AIUnavailableError)) console.error('[ai] chat failed', e);
    res.status(503).json({ error: e instanceof AIUnavailableError ? e.message : 'The assistant could not answer right now. Please try again shortly.' });
  }
});

export default r;
