import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { approvedMemberToken, clearDb, createAdminToken, startDb, stopDb } from './helpers.js';
import { todayIST } from '../src/util.js';

let app, PriceList, Post;
beforeAll(async () => {
  await startDb();
  app = (await import('../src/app.js')).default;
  ({ PriceList, Post } = await import('../src/models/index.js'));
});
afterAll(stopDb);
beforeEach(async () => {
  await clearDb();
  await PriceList.create({ type: 'yarn', date: todayIST(), rows: [{ item: '20s', unit: 'Rs/kg', rate: 187, prev: 185 }] });
});

describe('member-only prices', () => {
  it('returns 401 without a token and 200 for an approved member', async () => {
    expect((await request(app).get('/api/member/prices/yarn')).status).toBe(401);
    const token = await approvedMemberToken(request, app);
    const res = await request(app).get('/api/member/prices/yarn').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.rows[0]).toMatchObject({ item: '20s', rate: 187 });
    expect((await request(app).get('/api/member/prices/yarn/series?days=30').set('Authorization', `Bearer ${token}`)).body.series['20s']).toEqual([187]);
  });

  it('rejects an admin token on member routes', async () => {
    const admin = await createAdminToken(request, app);
    expect((await request(app).get('/api/member/prices/yarn').set('Authorization', `Bearer ${admin}`)).status).toBe(401);
    expect((await request(app).get('/api/user-auth/me').set('Authorization', `Bearer ${admin}`)).status).toBe(401);
  });

  it('rejects a member token on admin routes', async () => {
    const token = await approvedMemberToken(request, app);
    expect((await request(app).get('/api/admin/summary').set('Authorization', `Bearer ${token}`)).status).toBe(401);
    expect((await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`)).status).toBe(401);
  });

  it('no longer exposes rates on public endpoints', async () => {
    const old = await request(app).get('/api/prices/yarn');
    expect(old.status).toBe(403);
    expect(JSON.stringify(old.body)).not.toContain('187');
    const meta = await request(app).get('/api/price-meta');
    expect(meta.status).toBe(200);
    expect(meta.body.yarn.items).toEqual(['20s']);
    expect(JSON.stringify(meta.body)).not.toContain('187');
  });

  it('keeps prices out of the sitemap and disallows /dashboard in robots.txt', async () => {
    expect((await request(app).get('/sitemap.xml')).text).not.toContain('/prices');
    expect((await request(app).get('/robots.txt')).text).toContain('Disallow: /dashboard');
  });

  it('publishes a price alert post that contains no rates', async () => {
    const admin = await createAdminToken(request, app);
    const res = await request(app).put('/api/admin/prices/yarn/2026-01-02').set('Authorization', `Bearer ${admin}`)
      .send({ rows: [{ item: '30s', unit: 'Rs/kg', rate: 241 }], alert: { create: true, headline: 'Yarn 30s up to 241', text: '30s is 241 today' } });
    expect(res.status).toBe(200);
    const post = await Post.findOne({ category: 'Price alert' }).lean();
    expect(post.title + post.summary).not.toMatch(/241|30s/);
    expect(post.linkUrl).toBe('/dashboard');
    expect(post.summary).toMatch(/Sign in to view/);
  });

  it('exposes a health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', db: 'up' });
  });
});
