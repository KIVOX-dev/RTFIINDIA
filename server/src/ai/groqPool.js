// Groq (OpenAI-compatible) client with a pool of API keys and a model fallback chain.
// Plain fetch, no SDK. Keys never leave the server and are only ever logged masked.
const URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
const DEFAULT_COOLDOWN_MS = 60_000;
const MAX_COOLDOWN_MS = 15 * 60_000;

export class AIUnavailableError extends Error {
  constructor(message = 'The AI assistant is busy right now. Please try again in a minute.') {
    super(message);
    this.name = 'AIUnavailableError';
    this.status = 503;
  }
}

export const maskKey = (k) => `****${String(k).slice(-4)}`;

/** Collect keys from GROQ_API_KEY_1..10 and/or comma separated GROQ_API_KEYS (deduplicated, blanks skipped). */
export function keysFromEnv(env = process.env) {
  const list = [];
  for (let i = 1; i <= 10; i++) list.push(env[`GROQ_API_KEY_${i}`]);
  list.push(...String(env.GROQ_API_KEYS || '').split(','));
  return [...new Set(list.map((k) => String(k || '').trim()).filter(Boolean))].slice(0, 10);
}
export const modelsFromEnv = (env = process.env) => {
  const m = String(env.GROQ_MODELS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return m.length ? m : DEFAULT_MODELS;
};

/** "1m26.4s", "7.66s", "250ms", "30" -> milliseconds (null when unparseable). */
export function parseDuration(v) {
  if (v == null || v === '') return null;
  const s = String(v).trim();
  if (/^\d+(\.\d+)?$/.test(s)) return Math.round(parseFloat(s) * 1000);
  let ms = 0, hit = false;
  for (const [, n, u] of s.matchAll(/(\d+(?:\.\d+)?)(ms|h|m|s)/g)) {
    hit = true;
    ms += parseFloat(n) * { ms: 1, s: 1000, m: 60_000, h: 3_600_000 }[u];
  }
  return hit ? Math.round(ms) : null;
}
export function cooldownFrom(headers, fallback = DEFAULT_COOLDOWN_MS) {
  const get = (k) => headers?.get?.(k);
  const ms = parseDuration(get('retry-after')) ?? parseDuration(get('x-ratelimit-reset-requests')) ?? parseDuration(get('x-ratelimit-reset-tokens'));
  return Math.min(Math.max(ms ?? fallback, 1000), MAX_COOLDOWN_MS);
}

export function createPool({ keys = keysFromEnv(), models = modelsFromEnv(), fetchImpl = (...a) => fetch(...a), now = () => Date.now(), timeoutMs = 15_000, log = console } = {}) {
  const state = keys.map((key) => ({ key, requests: 0, failures: 0, ok: 0, disabled: false, cooldowns: {}, lastError: '' }));
  let cursor = 0;

  const coolUntil = (st, model) => st.cooldowns[model] || 0;
  const usable = (st, model) => !st.disabled && coolUntil(st, model) <= now();

  async function call(st, model, body) {
    st.requests++;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      return await fetchImpl(URL, {
        method: 'POST', signal: ctl.signal,
        headers: { authorization: `Bearer ${st.key}`, 'content-type': 'application/json' },
        body: JSON.stringify({ ...body, model }),
      });
    } finally {
      clearTimeout(timer);
    }
  }

  /** messages: [{role, content}]. Returns { text, model, key } or throws AIUnavailableError. */
  async function chat({ messages, maxTokens = 500, temperature = 0.3 }) {
    if (!state.length) throw new AIUnavailableError('The AI assistant is not configured yet.');
    const start = cursor++ % state.length; // round robin: each request starts on the next key
    const body = { messages, max_tokens: Math.min(Math.max(1, maxTokens), 1200), temperature, stream: false };
    for (const model of models) {
      let serverErrors = 0;
      for (let k = 0; k < state.length; k++) {
        const st = state[(start + k) % state.length];
        if (!usable(st, model)) continue;
        let res;
        try {
          res = await call(st, model, body);
        } catch (e) {
          st.failures++;
          st.lastError = e.name === 'AbortError' ? 'timeout' : e.message;
          if (++serverErrors >= 2) break; // already retried one more key: move on to the next model
          continue;
        }
        if (res.ok) {
          const data = await res.json().catch(() => null);
          const text = data?.choices?.[0]?.message?.content?.trim();
          if (text) { st.ok++; st.lastError = ''; return { text, model, key: maskKey(st.key) }; }
          st.failures++; st.lastError = 'empty response';
          continue;
        }
        st.failures++;
        st.lastError = `HTTP ${res.status}`;
        if (res.status === 429) { st.cooldowns[model] = now() + cooldownFrom(res.headers); continue; }
        if (res.status === 401 || res.status === 403) {
          st.disabled = true;
          log.warn(`[ai] Groq key ${maskKey(st.key)} rejected (HTTP ${res.status}); disabled until restart`);
          continue;
        }
        if (res.status >= 500) { if (++serverErrors >= 2) break; continue; }
        break; // other 4xx (bad request, unknown or retired model): another key will not help, try the next model
      }
    }
    throw new AIUnavailableError();
  }

  const status = () => ({
    configured: state.length > 0, models,
    keys: state.map((st, i) => {
      const until = Math.max(0, ...Object.values(st.cooldowns));
      return {
        slot: i + 1, key: maskKey(st.key), disabled: st.disabled, cooldownUntil: until > now() ? new Date(until).toISOString() : null,
        requests: st.requests, ok: st.ok, failures: st.failures, lastError: st.lastError || null,
      };
    }),
  });
  return { chat, status };
}

let shared;
export const getPool = () => (shared ||= createPool());
export const setPool = (pool) => { shared = pool; };
