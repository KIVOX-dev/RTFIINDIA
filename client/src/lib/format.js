const IST = 'Asia/Kolkata';
export const todayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: IST });
export const fmtDate = (d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T12:00:00+05:30` : d).toLocaleDateString('en-IN', { timeZone: IST, ...opts });
export const fmtTime = (d) => new Date(d).toLocaleTimeString('en-IN', { timeZone: IST, hour: 'numeric', minute: '2-digit', hour12: true });
export const fmtDateTime = (d) => `${fmtDate(d, { day: 'numeric', month: 'short' })}, ${fmtTime(d)}`;
export const istDay = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: IST });
export function dayLabel(d) {
  const day = istDay(d), t = todayIST();
  if (day === t) return 'Today';
  if (day === istDay(Date.now() - 864e5)) return 'Yesterday';
  return fmtDate(d, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}
export function relTime(d) {
  const s = Math.round((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) { const h = Math.floor(s / 3600); return `${h} hour${h > 1 ? 's' : ''} ago`; }
  if (s < 172800) return 'yesterday';
  return fmtDate(d, { day: 'numeric', month: 'short' });
}
export const isNew = (d) => Date.now() - new Date(d) < 864e5 && istDay(d) === todayIST();
export const money = (n, unit = '') => (n == null ? '–' : `${unit.includes('₹') ? '₹' : ''}${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
export const num = (n) => (n == null ? '–' : Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }));
export const delta = (r) => (r.rate != null && r.prev != null ? Math.round((r.rate - r.prev) * 100) / 100 : null);
export const trend = (r) => { const d = delta(r); return d == null ? 'flat' : d > 0 ? 'up' : d < 0 ? 'down' : 'flat'; };
export const waLink = (text, phone = '') => `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
export const site = () => window.location.origin;

/** Is the office open right now (IST)? */
export function openNow(hours = []) {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: IST }));
  const mins = now.getHours() * 60 + now.getMinutes();
  const hm = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const slot = hours.find((h) => h.days?.includes(now.getDay()));
  return !!slot && !!slot.open && mins >= hm(slot.open) && mins < hm(slot.close);
}
export const to12h = (s) => { if (!s) return ''; const [h, m] = s.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`; };
export const initials = (n = '') => n.replace(/^(mr|mrs|ms|dr)\.?\s+/i, '').split(/[\s.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
export const readMins = (text = '') => Math.max(1, Math.round(text.trim().split(/\s+/).length / 200));
