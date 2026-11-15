import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const SettingsCtx = createContext({ s: {}, ready: false, reload: () => {} });
export function SettingsProvider({ children }) {
  const [s, setS] = useState({});
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState(false);
  const load = () => api.get('/settings', { silent: false }).then((d) => { setS(d); setReady(true); setErr(false); }).catch(() => { setErr(true); setReady(true); });
  useEffect(() => { load(); }, []);
  return <SettingsCtx.Provider value={{ s, ready, err, reload: load }}>{children}</SettingsCtx.Provider>;
}
export const useSettings = () => useContext(SettingsCtx);

export function useSeo(title, description, image) {
  const { s } = useSettings();
  const brand = s.site?.name || 'Recycle Textile Federation';
  useEffect(() => {
    const full = title ? `${title} | ${brand}` : brand;
    document.title = full;
    const set = (sel, attr, val) => {
      let el = document.head.querySelector(sel);
      if (!el) { el = document.createElement('meta'); const [k, v] = attr; el.setAttribute(k, v); document.head.appendChild(el); }
      el.setAttribute('content', val || '');
    };
    const desc = description || s.hero?.tagline || '';
    set('meta[name="description"]', ['name', 'description'], desc);
    set('meta[property="og:title"]', ['property', 'og:title'], full);
    set('meta[property="og:description"]', ['property', 'og:description'], desc);
    set('meta[property="og:type"]', ['property', 'og:type'], 'website');
    set('meta[property="og:url"]', ['property', 'og:url'], window.location.href);
    const img = image || s.site?.logoUrl;
    if (img) set('meta[property="og:image"]', ['property', 'og:image'], img.startsWith('http') ? img : window.location.origin + img);
  }, [title, description, image, brand, s.hero?.tagline, s.site?.logoUrl]);
}

export function useMedia(q) {
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => { const mq = window.matchMedia(q); const f = () => setM(mq.matches); mq.addEventListener('change', f); return () => mq.removeEventListener('change', f); }, [q]);
  return m;
}

export function useDebounced(v, ms = 300) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

export function catColor(settings, name) {
  return settings.categories?.find((c) => c.name === name)?.color || '#3395FF';
}
