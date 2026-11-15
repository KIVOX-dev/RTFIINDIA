import { useEffect, useState, useCallback, useRef } from 'react';

// ---- tiny progress store used by the top loader
let active = 0;
const subs = new Set();
export const progress = {
  inc() { active++; subs.forEach((f) => f(active)); },
  dec() { active = Math.max(0, active - 1); subs.forEach((f) => f(active)); },
  subscribe(f) { subs.add(f); return () => subs.delete(f); },
};

const TOKEN = 'rtf_admin_token';
export const auth = {
  get: () => { try { return localStorage.getItem(TOKEN); } catch { return null; } },
  set: (t) => { try { localStorage.setItem(TOKEN, t); } catch { /* storage blocked */ } },
  clear: () => { try { localStorage.removeItem(TOKEN); } catch { /* storage blocked */ } },
};

async function request(method, url, body, { admin = false, silent = false } = {}) {
  const headers = {};
  let payload;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) { headers['content-type'] = 'application/json'; payload = JSON.stringify(body); }
  if (admin && auth.get()) headers.authorization = `Bearer ${auth.get()}`;
  if (!silent) progress.inc();
  try {
    const res = await fetch(url, { method, headers, body: payload });
    const data = res.status === 204 ? null : await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401 && admin) { auth.clear(); window.dispatchEvent(new Event('rtf-auth-lost')); }
      const err = new Error(data?.error || `Request failed (${res.status})`);
      err.status = res.status; err.fields = data?.errors;
      throw err;
    }
    return data;
  } finally {
    if (!silent) progress.dec();
  }
}
export const api = {
  get: (u, o) => request('GET', `/api${u}`, undefined, o),
  post: (u, b, o) => request('POST', `/api${u}`, b, o),
};
export const adminApi = {
  get: (u, o) => request('GET', `/api/admin${u}`, undefined, { admin: true, ...o }),
  post: (u, b, o) => request('POST', `/api/admin${u}`, b, { admin: true, ...o }),
  put: (u, b, o) => request('PUT', `/api/admin${u}`, b, { admin: true, ...o }),
  del: (u, o) => request('DELETE', `/api/admin${u}`, undefined, { admin: true, ...o }),
  login: (email, password) => request('POST', '/api/auth/login', { email, password }),
  password: (current, next) => request('POST', '/api/auth/password', { current, next }, { admin: true }),
  upload: async (file) => { const f = new FormData(); f.append('file', file); return request('POST', '/api/admin/upload', f, { admin: true }); },
};

const cache = new Map();
/** GET with loading/error state. `key` null skips fetching. */
export function useFetch(path, { admin = false, silent = false, deps = [] } = {}) {
  const [state, setState] = useState(() => ({ data: cache.get(path) ?? null, error: null, loading: path != null && !cache.has(path) }));
  const tick = useRef(0);
  const load = useCallback(async (quiet) => {
    if (path == null) return;
    const id = ++tick.current;
    if (!quiet) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await (admin ? adminApi : api).get(path, { silent: silent || quiet });
      cache.set(path, data);
      if (id === tick.current) setState({ data, error: null, loading: false });
    } catch (error) {
      if (id === tick.current) setState((s) => ({ ...s, error, loading: false }));
    }
  }, [path, admin, silent]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(cache.has(path)); }, [load, ...deps]);
  return { ...state, reload: () => load(false) };
}
export const clearCache = () => cache.clear();
