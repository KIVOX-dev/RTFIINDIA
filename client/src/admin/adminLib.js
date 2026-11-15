import { adminApi } from '../lib/api.js';

/** Resize to max 1600px wide and convert to WebP before upload (saves mobile data, keeps the site fast). */
export async function compressImage(file, maxW = 1600) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return { file, w: 0, h: 0 };
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxW / bmp.width);
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise((r) => c.toBlob(r, 'image/webp', 0.82));
    if (!blob || blob.size >= file.size * 1.1) return { file, w, h };
    return { file: new File([blob], file.name.replace(/\.\w+$/, '') + '.webp', { type: 'image/webp' }), w, h };
  } catch { return { file, w: 0, h: 0 }; }
}
export async function uploadImage(file) {
  const { file: f, w, h } = await compressImage(file);
  const r = await adminApi.upload(f);
  return { ...r, w, h };
}
export const toLocalInput = (d) => {
  const x = new Date(d);
  const p = (n) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`;
};
