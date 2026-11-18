import bcrypt from 'bcryptjs';
import { connect } from './db.js';
import { Admin } from './models/index.js';
import { assertSecrets } from './config.js';
import { seedIfEmpty } from './seed.js';
import app from './app.js';

assertSecrets(); // refuses to start in production with missing or default JWT secrets
const PORT = process.env.PORT || 4000;
await connect();
await seedIfEmpty();
const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (ADMIN_EMAIL && ADMIN_PASSWORD && !(await Admin.exists({ email: ADMIN_EMAIL.toLowerCase() }))) {
  await Admin.create({ email: ADMIN_EMAIL, passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10) });
  console.log('[auth] created admin', ADMIN_EMAIL);
}
app.listen(PORT, () => console.log(`RTF API on http://localhost:${PORT}`));
