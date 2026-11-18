// Central place for secrets and environment checks.
export const DEV_ADMIN_SECRET = 'dev-only-secret-change-me';
export const DEV_USER_SECRET = 'dev-only-user-secret-change-me';

export const isProd = () => process.env.NODE_ENV === 'production';
export const adminSecret = () => process.env.JWT_SECRET || DEV_ADMIN_SECRET;
export const userSecret = () => process.env.USER_JWT_SECRET || DEV_USER_SECRET;

/** In production, refuse to run with missing, default or shared signing secrets. */
export function assertSecrets(env = process.env) {
  if (env.NODE_ENV !== 'production') return;
  const bad = (v) => !v || v === DEV_ADMIN_SECRET || v === DEV_USER_SECRET || v.length < 16;
  const problems = [];
  if (bad(env.JWT_SECRET)) problems.push('JWT_SECRET is missing, too short (<16 chars) or the dev default');
  if (bad(env.USER_JWT_SECRET)) problems.push('USER_JWT_SECRET is missing, too short (<16 chars) or the dev default');
  if (env.JWT_SECRET && env.JWT_SECRET === env.USER_JWT_SECRET) problems.push('JWT_SECRET and USER_JWT_SECRET must be different');
  if (problems.length)
    throw new Error(`Refusing to start in production:\n - ${problems.join('\n - ')}\nGenerate one with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`);
}
