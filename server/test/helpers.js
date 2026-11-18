import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-admin-secret-0123456789';
process.env.USER_JWT_SECRET = 'test-member-secret-0123456789';
process.env.SITE_URL = 'http://localhost:5173';

let mongod;
export async function startDb() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}
export async function stopDb() {
  await mongoose.disconnect();
  await mongod?.stop();
}
export async function clearDb() {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
}

export const member = { name: 'Test Spinner', email: 'Mill@Example.com', phone: '+91 98765 43210', millName: 'Test Mills', city: 'Coimbatore', password: 'secret-pass-1' };

export async function createAdminToken(request, app) {
  const { Admin } = await import('../src/models/index.js');
  await Admin.create({ email: 'admin@example.com', passwordHash: await bcrypt.hash('admin-pass-123', 10) });
  const res = await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'admin-pass-123' });
  return res.body.token;
}
export async function approvedMemberToken(request, app, overrides = {}) {
  const { User } = await import('../src/models/index.js');
  await request(app).post('/api/user-auth/register').send({ ...member, ...overrides });
  await User.updateOne({ email: (overrides.email || member.email).toLowerCase() }, { status: 'approved' });
  const res = await request(app).post('/api/user-auth/login').send({ email: overrides.email || member.email, password: member.password });
  return res.body.token;
}
