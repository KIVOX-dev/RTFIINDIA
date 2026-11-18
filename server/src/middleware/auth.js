import jwt from 'jsonwebtoken';
import { adminSecret, userSecret } from '../config.js';
import { User } from '../models/index.js';

const bearer = (req) => {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : '';
};
// Admin and member tokens use different secrets AND carry a role claim, so one can never pass as the other.
export const sign = (admin) => jwt.sign({ id: admin._id, email: admin.email, role: 'admin' }, adminSecret(), { expiresIn: '12h' });
export const signUser = (user) => jwt.sign({ id: user._id, email: user.email, role: 'user' }, userSecret(), { expiresIn: '7d' });

export function requireAdmin(req, res, next) {
  try {
    const p = jwt.verify(bearer(req), adminSecret());
    if (p.role !== 'admin') throw new Error('wrong role');
    req.admin = p;
    next();
  } catch {
    res.status(401).json({ error: 'Please sign in again.' });
  }
}

/** Verifies the member token, then re-reads the user so approval/blocking takes effect on the very next request. */
export async function requireUser(req, res, next) {
  let p;
  try {
    p = jwt.verify(bearer(req), userSecret());
    if (p.role !== 'user') throw new Error('wrong role');
  } catch {
    return res.status(401).json({ error: 'Please sign in to continue.', code: 'auth' });
  }
  const user = await User.findById(p.id);
  if (!user) return res.status(401).json({ error: 'Please sign in to continue.', code: 'auth' });
  if (user.status !== 'approved')
    return res.status(401).json({ error: user.status === 'blocked' ? 'This account has been blocked.' : 'Your account is awaiting approval.', code: user.status });
  req.user = user;
  next();
}
