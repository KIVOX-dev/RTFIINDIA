import { describe, expect, it } from 'vitest';
import { assertSecrets, DEV_ADMIN_SECRET } from '../src/config.js';

const good = { NODE_ENV: 'production', JWT_SECRET: 'a'.repeat(32), USER_JWT_SECRET: 'b'.repeat(32) };

describe('assertSecrets', () => {
  it('accepts strong, distinct secrets in production', () => expect(() => assertSecrets(good)).not.toThrow());
  it('is relaxed outside production', () => expect(() => assertSecrets({ NODE_ENV: 'development' })).not.toThrow());
  it('refuses missing secrets', () => expect(() => assertSecrets({ ...good, JWT_SECRET: '' })).toThrow(/JWT_SECRET/));
  it('refuses the dev fallback', () => expect(() => assertSecrets({ ...good, JWT_SECRET: DEV_ADMIN_SECRET })).toThrow(/JWT_SECRET/));
  it('refuses the same secret for admins and members', () => expect(() => assertSecrets({ ...good, USER_JWT_SECRET: good.JWT_SECRET })).toThrow(/different/));
});
