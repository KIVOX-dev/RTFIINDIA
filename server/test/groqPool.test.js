import { describe, expect, it, vi } from 'vitest';
import { AIUnavailableError, createPool, keysFromEnv, parseDuration } from '../src/ai/groqPool.js';

const ok = (text = 'hello') => ({ ok: true, status: 200, headers: new Headers(), json: async () => ({ choices: [{ message: { content: text } }] }) });
const fail = (status, headers = {}) => ({ ok: false, status, headers: new Headers(headers), json: async () => ({}) });
const quiet = { warn: vi.fn() };
const messages = [{ role: 'user', content: 'hi' }];
const keyOf = (call) => call[1].headers.authorization.replace('Bearer ', '');
const modelOf = (call) => JSON.parse(call[1].body).model;

describe('groq key pool', () => {
  it('reads GROQ_API_KEY_1..10 and GROQ_API_KEYS, skipping blanks and duplicates', () => {
    expect(keysFromEnv({ GROQ_API_KEY_1: 'a', GROQ_API_KEY_2: '', GROQ_API_KEY_3: 'b', GROQ_API_KEYS: 'b, c' })).toEqual(['a', 'b', 'c']);
  });

  it('parses retry and rate-limit reset durations', () => {
    expect(parseDuration('30')).toBe(30000);
    expect(parseDuration('1m26.4s')).toBe(86400);
    expect(parseDuration('250ms')).toBe(250);
    expect(parseDuration('soon')).toBeNull();
  });

  it('rotates the starting key round robin', async () => {
    const fetchImpl = vi.fn(async () => ok());
    const pool = createPool({ keys: ['k1', 'k2', 'k3'], models: ['m1'], fetchImpl, log: quiet });
    for (let i = 0; i < 4; i++) await pool.chat({ messages });
    expect(fetchImpl.mock.calls.map(keyOf)).toEqual(['k1', 'k2', 'k3', 'k1']);
  });

  it('on 429 cools the key down (using retry-after) and moves to the next key', async () => {
    let t = 1_000_000;
    const fetchImpl = vi.fn(async (_u, o) => (o.headers.authorization === 'Bearer k1' ? fail(429, { 'retry-after': '30' }) : ok('from k2')));
    const pool = createPool({ keys: ['k1', 'k2'], models: ['m1'], fetchImpl, now: () => t, log: quiet });

    expect((await pool.chat({ messages })).text).toBe('from k2');
    expect(pool.status().keys[0].cooldownUntil).toBe(new Date(t + 30_000).toISOString());

    // k1 is skipped while it cools down, even when round robin comes back to it
    fetchImpl.mockClear();
    await pool.chat({ messages });
    await pool.chat({ messages });
    expect(fetchImpl.mock.calls.map(keyOf)).toEqual(['k2', 'k2']);

    // once the cooldown has passed it is used again
    t += 31_000;
    fetchImpl.mockClear();
    await pool.chat({ messages });
    await pool.chat({ messages });
    expect(fetchImpl.mock.calls.map(keyOf)).toContain('k1');
  });

  it('on 401 disables the key for good and logs only the masked key', async () => {
    const warn = vi.fn();
    const fetchImpl = vi.fn(async (_u, o) => (o.headers.authorization === 'Bearer gsk_secret_ABCD' ? fail(401) : ok()));
    const pool = createPool({ keys: ['gsk_secret_ABCD', 'k2'], models: ['m1'], fetchImpl, log: { warn } });
    await pool.chat({ messages });
    await pool.chat({ messages });
    await pool.chat({ messages });
    expect(fetchImpl.mock.calls.filter((c) => keyOf(c) === 'gsk_secret_ABCD')).toHaveLength(1);
    const st = pool.status();
    expect(st.keys[0]).toMatchObject({ disabled: true, key: '****ABCD' });
    expect(JSON.stringify(st)).not.toContain('gsk_secret');
    expect(warn.mock.calls.join(' ')).not.toContain('gsk_secret');
    expect(warn.mock.calls.join(' ')).toContain('ABCD');
  });

  it('after two server errors falls back to the next model in the chain', async () => {
    const fetchImpl = vi.fn(async (_u, o) => (JSON.parse(o.body).model === 'big' ? fail(503) : ok('small answer')));
    const pool = createPool({ keys: ['k1', 'k2', 'k3'], models: ['big', 'small'], fetchImpl, log: quiet });
    const res = await pool.chat({ messages });
    expect(res).toMatchObject({ text: 'small answer', model: 'small' });
    expect(fetchImpl.mock.calls.map(modelOf)).toEqual(['big', 'big', 'small']);
  });

  it('treats a network timeout as a server error', async () => {
    const fetchImpl = vi.fn((_u, o) => new Promise((_, rej) => o.signal.addEventListener('abort', () => rej(Object.assign(new Error('aborted'), { name: 'AbortError' })))));
    const pool = createPool({ keys: ['k1'], models: ['m1'], fetchImpl, timeoutMs: 20, log: quiet });
    await expect(pool.chat({ messages })).rejects.toBeInstanceOf(AIUnavailableError);
    expect(pool.status().keys[0].lastError).toBe('timeout');
  });

  it('throws a friendly 503 error when every key and model fails', async () => {
    const pool = createPool({ keys: ['k1', 'k2'], models: ['a', 'b'], fetchImpl: async () => fail(429), log: quiet });
    const err = await pool.chat({ messages }).catch((e) => e);
    expect(err).toBeInstanceOf(AIUnavailableError);
    expect(err.status).toBe(503);
  });

  it('is unavailable (not crashing) when no keys are configured', async () => {
    await expect(createPool({ keys: [], models: ['m1'], log: quiet }).chat({ messages })).rejects.toBeInstanceOf(AIUnavailableError);
  });
});
