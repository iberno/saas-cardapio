import { describe, it, expect } from 'vitest';
import { request, obtainCsrf, extractSetCookie } from './setup';

describe('Multi-tenancy isolation', () => {
  it('platform routes work without tenant host header (SKIP_PATHS)', async () => {
    const csrf = await obtainCsrf();
    const res = await request.post('/api/platform/auth/login')
      .set('X-CSRF-Token', csrf.csrfToken)
      .set('Cookie', csrf.csrfCookie)
      .send({ email: 'admin@saas-cardapio.local', password: 'Admin123@senha' });
    expect(res.status).toBe(200);
  });

  it('tenant-user auth fails without tenant host header', async () => {
    const csrf = await obtainCsrf();
    const res = await request.post('/api/tenant/auth/login')
      .set('X-CSRF-Token', csrf.csrfToken)
      .set('Cookie', csrf.csrfCookie)
      .send({ email: 'owner@acai.local', password: 'Admin123@senha' });
    expect(res.status).toBe(500);
  });

  it('customer auth fails without tenant host header', async () => {
    const csrf = await obtainCsrf();
    const res = await request.post('/api/customer/auth/login')
      .set('X-CSRF-Token', csrf.csrfToken)
      .set('Cookie', csrf.csrfCookie)
      .send({ phone: '+5511999999999' });
    expect(res.status).toBe(500);
  });

  it('tenant-user auth succeeds with valid tenant host', async () => {
    const csrf = await obtainCsrf();
    const res = await request.post('/api/tenant/auth/login')
      .set('Host', 'acai.saas-cardapio.local')
      .set('X-CSRF-Token', csrf.csrfToken)
      .set('Cookie', csrf.csrfCookie)
      .send({ email: 'owner@acai.local', password: 'Admin123@senha' });
    expect(res.status).toBe(200);
  });

  it('customer auth succeeds with valid tenant host', async () => {
    const csrf = await obtainCsrf();
    const res = await request.post('/api/customer/auth/login')
      .set('Host', 'acai.saas-cardapio.local')
      .set('X-CSRF-Token', csrf.csrfToken)
      .set('Cookie', csrf.csrfCookie)
      .send({ phone: '+5511999999999' });
    expect(res.status).toBe(200);
  });

  it('tenant-user auth returns 500 for unknown tenant', async () => {
    const csrf = await obtainCsrf();
    const res = await request.post('/api/tenant/auth/login')
      .set('Host', 'nonexistent.saas-cardapio.local')
      .set('X-CSRF-Token', csrf.csrfToken)
      .set('Cookie', csrf.csrfCookie)
      .send({ email: 'owner@acai.local', password: 'Admin123@senha' });
    expect(res.status).toBe(500);
  });
});
