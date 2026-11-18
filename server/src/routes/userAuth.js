import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { User } from '../models/index.js';
import { requireUser, signUser } from '../middleware/auth.js';
import { clean } from '../util.js';
import { sendMail, mailConfigured } from '../mail.js';

const r = Router();
const limiter = (windowMs, limit, error) => rateLimit({ windowMs, limit, standardHeaders: true, legacyHeaders: false, message: { error } });
const registerLimit = limiter(60 * 60 * 1000, 10, 'Too many sign-ups from this network. Please try again later.');
const loginLimit = limiter(15 * 60 * 1000, 20, 'Too many attempts. Try again in a few minutes.');
const resetLimit = limiter(60 * 60 * 1000, 10, 'Too many requests. Please try again later.');

export const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, phone: u.phone, millName: u.millName, city: u.city, status: u.status, createdAt: u.createdAt });
export const validPassword = (p) => typeof p === 'string' && p.length >= 8 && p.length <= 100;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+\d][\d\s-]{7,16}$/;
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10); // keeps login timing similar when the email is unknown
const siteUrl = () => (process.env.SITE_URL || process.env.CLIENT_ORIGIN?.split(',')[0] || 'http://localhost:5173').replace(/\/$/, '');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

r.post('/register', registerLimit, async (req, res) => {
  const b = req.body || {};
  const name = clean(b.name, 80), email = clean(b.email, 120).toLowerCase(), phone = clean(b.phone, 20);
  const millName = clean(b.millName, 100), city = clean(b.city, 60);
  const errors = {};
  if (name.length < 2) errors.name = 'Please enter your name';
  if (!EMAIL.test(email)) errors.email = 'Enter a valid email address';
  if (!PHONE.test(phone)) errors.phone = 'Enter a valid phone number';
  if (!validPassword(b.password)) errors.password = 'Use at least 8 characters';
  if (Object.keys(errors).length) return res.status(422).json({ error: 'Please check the form', errors });
  if (await User.exists({ email })) return res.status(409).json({ error: 'An account with this email already exists. Try signing in.', errors: { email: 'Already registered' } });
  await User.create({ name, email, phone, millName, city, passwordHash: await bcrypt.hash(b.password, 10) });
  sendMail({
    to: process.env.CONTACT_NOTIFY_EMAIL, subject: `New RTF member waiting for approval: ${name}`,
    text: `${name} (${email}, ${phone}) ${millName} ${city}\n\nApprove at ${siteUrl()}/admin/users`,
  });
  res.status(201).json({ ok: true, status: 'pending', message: 'Thanks for registering. The RTF office will approve your account shortly.' });
});

r.post('/login', loginLimit, async (req, res) => {
  const email = clean(req.body?.email, 120).toLowerCase();
  const u = await User.findOne({ email });
  const ok = await bcrypt.compare(String(req.body?.password || ''), u?.passwordHash || DUMMY_HASH);
  if (!u || !ok) return res.status(401).json({ error: 'Email or password is incorrect.' });
  if (u.status === 'pending') return res.status(403).json({ error: 'Your account is waiting for approval by the RTF office. You will be able to sign in once it is approved.', code: 'pending' });
  if (u.status === 'blocked') return res.status(403).json({ error: 'This account has been blocked. Please contact the RTF office.', code: 'blocked' });
  u.lastLoginAt = new Date();
  await u.save();
  res.json({ token: signUser(u), user: publicUser(u) });
});

r.get('/me', requireUser, (req, res) => res.json({ user: publicUser(req.user) }));

r.post('/forgot-password', resetLimit, async (req, res) => {
  const email = clean(req.body?.email, 120).toLowerCase();
  const u = email && (await User.findOne({ email }));
  if (u) {
    const token = crypto.randomBytes(32).toString('hex');
    u.resetTokenHash = sha(token);
    u.resetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await u.save();
    const link = `${siteUrl()}/reset-password/${token}`;
    const sent = mailConfigured() && (await sendMail({ to: u.email, subject: 'Reset your RTF password', text: `Open this link within one hour to choose a new password:\n${link}\n\nIf you did not ask for this, ignore this email.` }));
    if (!sent && process.env.NODE_ENV !== 'production') console.log(`[auth] password reset link for ${u.email}: ${link}`);
  }
  res.json({ ok: true, message: 'If that email is registered, a reset link has been sent.' }); // same answer either way
});

r.post('/reset-password', resetLimit, async (req, res) => {
  const { token, password } = req.body || {};
  if (!validPassword(password)) return res.status(422).json({ error: 'Use at least 8 characters.' });
  const u = typeof token === 'string' && token && (await User.findOne({ resetTokenHash: sha(token), resetExpires: { $gt: new Date() } }));
  if (!u) return res.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' });
  u.passwordHash = await bcrypt.hash(password, 10);
  u.resetTokenHash = undefined;
  u.resetExpires = undefined;
  await u.save();
  res.json({ ok: true });
});

export default r;
