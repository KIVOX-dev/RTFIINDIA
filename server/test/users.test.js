import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { clearDb, createAdminToken, member, startDb, stopDb } from './helpers.js';

let app;
beforeAll(async () => {
  await startDb();
  app = (await import('../src/app.js')).default;
});
afterAll(stopDb);
beforeEach(clearDb);

describe('member registration and login', () => {
  it('registers a pending account and blocks login until approved', async () => {
    const reg = await request(app).post('/api/user-auth/register').send(member);
    expect(reg.status).toBe(201);
    expect(reg.body.status).toBe('pending');

    const login = await request(app).post('/api/user-auth/login').send({ email: member.email, password: member.password });
    expect(login.status).toBe(403);
    expect(login.body.code).toBe('pending');
    expect(login.body.token).toBeUndefined();
  });

  it('validates input and rejects duplicate emails', async () => {
    const bad = await request(app).post('/api/user-auth/register').send({ ...member, password: 'short', phone: 'abc' });
    expect(bad.status).toBe(422);
    expect(bad.body.errors).toHaveProperty('password');
    expect(bad.body.errors).toHaveProperty('phone');

    await request(app).post('/api/user-auth/register').send(member);
    const dup = await request(app).post('/api/user-auth/register').send(member);
    expect(dup.status).toBe(409);
  });

  it('rejects a wrong password with the same message as an unknown email', async () => {
    await request(app).post('/api/user-auth/register').send(member);
    const wrong = await request(app).post('/api/user-auth/login').send({ email: member.email, password: 'nope-nope-1' });
    const unknown = await request(app).post('/api/user-auth/login').send({ email: 'who@example.com', password: 'nope-nope-1' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error).toBe(unknown.body.error);
  });

  it('lets an approved member in, and blocking takes effect on the next request', async () => {
    const admin = await createAdminToken(request, app);
    await request(app).post('/api/user-auth/register').send(member);
    const list = await request(app).get('/api/admin/users?status=pending').set('Authorization', `Bearer ${admin}`);
    expect(list.body.users).toHaveLength(1);
    const id = list.body.users[0].id;

    expect((await request(app).put(`/api/admin/users/${id}/approve`).set('Authorization', `Bearer ${admin}`)).status).toBe(200);
    const login = await request(app).post('/api/user-auth/login').send({ email: member.email, password: member.password });
    expect(login.status).toBe(200);
    const token = login.body.token;
    expect((await request(app).get('/api/user-auth/me').set('Authorization', `Bearer ${token}`)).status).toBe(200);

    await request(app).put(`/api/admin/users/${id}/block`).set('Authorization', `Bearer ${admin}`);
    const after = await request(app).get('/api/user-auth/me').set('Authorization', `Bearer ${token}`);
    expect(after.status).toBe(401);
    const relogin = await request(app).post('/api/user-auth/login').send({ email: member.email, password: member.password });
    expect(relogin.status).toBe(403);
    expect(relogin.body.code).toBe('blocked');
  });

  it('resets a password with a one-time token that is stored hashed', async () => {
    const { User } = await import('../src/models/index.js');
    await request(app).post('/api/user-auth/register').send(member);
    await User.updateOne({ email: member.email.toLowerCase() }, { status: 'approved' });
    const logs = [];
    const orig = console.log;
    console.log = (...a) => logs.push(a.join(' '));
    const res = await request(app).post('/api/user-auth/forgot-password').send({ email: member.email });
    console.log = orig;
    expect(res.status).toBe(200);
    const token = logs.join('\n').match(/reset-password\/([a-f0-9]{64})/)?.[1];
    expect(token).toBeTruthy();
    const stored = await User.findOne({ email: member.email.toLowerCase() });
    expect(stored.resetTokenHash).toBeTruthy();
    expect(stored.resetTokenHash).not.toContain(token);

    const reset = await request(app).post('/api/user-auth/reset-password').send({ token, password: 'brand-new-pass-9' });
    expect(reset.status).toBe(200);
    expect((await request(app).post('/api/user-auth/reset-password').send({ token, password: 'another-pass-99' })).status).toBe(400);
    expect((await request(app).post('/api/user-auth/login').send({ email: member.email, password: 'brand-new-pass-9' })).status).toBe(200);
  });
});
