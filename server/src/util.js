export const todayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
export const stripHtml = (s) => String(s ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
export const clean = (s, max = 500) => stripHtml(s).slice(0, max);
// Multi-line safe: strips tags, keeps line breaks.
export const cleanLong = (s, max = 20000) =>
  String(s ?? '').replace(/<[^>]*>/g, '').replace(/\r/g, '').trim().slice(0, max);
export const safeUrl = (s) => {
  const v = String(s ?? '').trim();
  if (!v) return '';
  if (/^(https?:|mailto:|tel:)/i.test(v) || v.startsWith('/')) return v.slice(0, 1000);
  return '';
};
export function cleanDeep(v, depth = 0) {
  if (depth > 6) return null;
  if (typeof v === 'string') return v.startsWith('/uploads/') || /^https?:/i.test(v) ? v.slice(0, 2000) : cleanLong(v, 5000);
  if (Array.isArray(v)) return v.slice(0, 200).map((x) => cleanDeep(x, depth + 1));
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, val] of Object.entries(v)) if (/^[\w.-]{1,40}$/.test(k)) o[k] = cleanDeep(val, depth + 1);
    return o;
  }
  return v;
}
export const slugify = (s) =>
  String(s).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'item';
export const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
