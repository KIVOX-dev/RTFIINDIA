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

const USER_TOKEN = 'rtf_user_token';
export const userToken = {
  get: () => { try { return localStorage.getItem(USER_TOKEN); } catch { return null; } },
  set: (t) => { try { localStorage.setItem(USER_TOKEN, t); } catch { /* storage blocked */ } },
  clear: () => { try { localStorage.removeItem(USER_TOKEN); } catch { /* storage blocked */ } },
};

/** Public GET answers saved in /static-data. Used only when the API server cannot be reached (static hosting). */
async function snapshot(url) {
  try {
    const key = url.replace(/^\/api/, '').replace(/[^a-z0-9]+/gi, '_');
    const res = await fetch(`/static-data/${key}.json`);
    const type = res.headers.get('content-type') || '';
    return res.ok && type.includes('json') ? await res.json() : undefined;
  } catch { return undefined; }
}

async function request(method, url, body, { admin = false, member = false, silent = false } = {}) {
  const headers = {};
  let payload;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) { headers['content-type'] = 'application/json'; payload = JSON.stringify(body); }
  if (admin && auth.get()) headers.authorization = `Bearer ${auth.get()}`;
  if (member && userToken.get()) headers.authorization = `Bearer ${userToken.get()}`;
  if (!silent) progress.inc();
  try {
    const canFallback = method === 'GET' && !admin && !member;
    let res;
    try { res = await fetch(url, { method, headers, body: payload }); } catch (e) {
      const snap = canFallback ? await snapshot(url) : undefined;
      if (snap !== undefined) return snap;
      throw e;
    }
    if (canFallback && (!res.ok || !(res.headers.get('content-type') || '').includes('json'))) {
      const snap = await snapshot(url);
      if (snap !== undefined) return snap;
    }
    const data = res.status === 204 ? null : await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401 && admin) { auth.clear(); window.dispatchEvent(new Event('rtf-auth-lost')); }
      if (res.status === 401 && member) { userToken.clear(); window.dispatchEvent(new Event('rtf-user-auth-lost')); }
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

/** Member API: sends the member token. A 401 clears it and fires rtf-user-auth-lost (the app then redirects to /login). */
export const memberApi = {
  get: (u, o) => request('GET', `/api/member${u}`, undefined, { member: true, ...o }),
  post: (u, b, o) => request('POST', `/api/member${u}`, b, { member: true, ...o }),
  put: (u, b, o) => request('PUT', `/api/member${u}`, b, { member: true, ...o }),
};
/** Sign-in / sign-up calls (no token). */
export const userAuthApi = {
  login: (email, password) => request('POST', '/api/user-auth/login', { email, password }),
  register: (body) => request('POST', '/api/user-auth/register', body),
  me: () => request('GET', '/api/user-auth/me', undefined, { member: true, silent: true }),
  forgot: (email) => request('POST', '/api/user-auth/forgot-password', { email }),
  reset: (token, password) => request('POST', '/api/user-auth/reset-password', { token, password }),
};

const cache = new Map();
/** GET with loading/error state. `key` null skips fetching. */
export function useFetch(path, { admin = false, member = false, silent = false, deps = [] } = {}) {
  const ck = path == null ? null : `${admin ? 'a' : member ? 'm' : 'p'}:${path}`; // admin / member / public never share cache entries
  const [state, setState] = useState(() => ({ data: cache.get(ck) ?? null, error: null, loading: path != null && !cache.has(ck) }));
  const tick = useRef(0);
  const load = useCallback(async (quiet) => {
    if (path == null) return;
    const id = ++tick.current;
    if (!quiet) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await (admin ? adminApi : member ? memberApi : api).get(path, { silent: silent || quiet });
      cache.set(ck, data);
      if (id === tick.current) setState({ data, error: null, loading: false });
    } catch (error) {
      if (id === tick.current) setState((s) => ({ ...s, error, loading: false }));
    }
  }, [path, ck, admin, member, silent]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(cache.has(ck)); }, [load, ...deps]);
  return { ...state, reload: () => load(false) };
}
export const clearCache = () => cache.clear();
