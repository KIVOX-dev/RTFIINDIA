import jwt from 'jsonwebtoken';
export const secret = () => process.env.JWT_SECRET || 'dev-only-secret-change-me';
export const sign = (admin) => jwt.sign({ id: admin._id, email: admin.email }, secret(), { expiresIn: '12h' });
export function requireAdmin(req, res, next) {
  const h = req.headers.authorization || '';
  try {
    req.admin = jwt.verify(h.startsWith('Bearer ') ? h.slice(7) : '', secret());
    next();
  } catch {
    res.status(401).json({ error: 'Please sign in again.' });
  }
}
