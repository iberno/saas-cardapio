import { describe, it, expect, beforeAll } from 'vitest';
import { request, obtainCsrf, extractSetCookie, cookieHeader } from './setup';

const TENANT_EMAIL = 'owner@acai.local';
const TENANT_PASSWORD = 'Admin123@senha';
const HOST = 'acai.saas-cardapio.local';

async function loginAsTenant(): Promise<{ session: string; tenantId: string }> {
  const { csrfToken, csrfCookie } = await obtainCsrf();
  const res = await request.post('/api/tenant/auth/login')
    .set('Host', HOST)
    .set('X-CSRF-Token', csrfToken)
    .set('Cookie', csrfCookie)
    .send({ email: TENANT_EMAIL, password: TENANT_PASSWORD });
  expect(res.status).toBe(200);
  const session = extractSetCookie(res).find((c) => c.startsWith('tu_session='))!.split(';')[0];

  const me = await request.get('/api/tenant/auth/me').set('Cookie', session);
  return { session, tenantId: me.body.tenantId };
}

async function authHeaders(session: string) {
  const { csrfToken, csrfCookie } = await obtainCsrf();
  return { csrfToken, cookie: cookieHeader(csrfCookie, session) };
}

describe('Staff Management E2E', () => {
  let session: string;
  let tenantId: string;
  let staffId: string;

  beforeAll(async () => {
    const r = await loginAsTenant();
    session = r.session;
    tenantId = r.tenantId;
  });

  it('GET staff — returns array', async () => {
    const res = await request.get(`/api/tenants/${tenantId}/staff`)
      .set('Cookie', session);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST staff — creates new staff member', async () => {
    const { csrfToken, cookie } = await authHeaders(session);
    const res = await request.post(`/api/tenants/${tenantId}/staff`)
      .set('X-CSRF-Token', csrfToken)
      .set('Cookie', cookie)
      .send({ email: 'staff-e2e@test.local', password: 'Test123456', name: 'E2E Staff', role: 'STAFF' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('E2E Staff');
    expect(res.body.role).toBe('STAFF');
    expect(res.body.email).toBe('staff-e2e@test.local');
    staffId = res.body.id;
  });

  it('POST staff — 409 on duplicate email', async () => {
    const { csrfToken, cookie } = await authHeaders(session);
    const res = await request.post(`/api/tenants/${tenantId}/staff`)
      .set('X-CSRF-Token', csrfToken)
      .set('Cookie', cookie)
      .send({ email: 'staff-e2e@test.local', password: 'Test123456', name: 'Duplicate', role: 'STAFF' });
    expect(res.status).toBe(409);
  });

  it('PATCH staff — updates name and role', async () => {
    const { csrfToken, cookie } = await authHeaders(session);
    const res = await request.patch(`/api/tenants/${tenantId}/staff/${staffId}`)
      .set('X-CSRF-Token', csrfToken)
      .set('Cookie', cookie)
      .send({ name: 'E2E Staff Updated' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('E2E Staff Updated');
  });

  it('GET staff — list includes updated name', async () => {
    const res = await request.get(`/api/tenants/${tenantId}/staff`)
      .set('Cookie', session);
    expect(res.status).toBe(200);
    expect(res.body.some((s: any) => s.id === staffId && s.name === 'E2E Staff Updated')).toBe(true);
  });

  it('DELETE staff — removes staff member', async () => {
    const { csrfToken, cookie } = await authHeaders(session);
    const res = await request.delete(`/api/tenants/${tenantId}/staff/${staffId}`)
      .set('X-CSRF-Token', csrfToken)
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
  });

  it('GET staff — deleted staff is gone', async () => {
    const res = await request.get(`/api/tenants/${tenantId}/staff`)
      .set('Cookie', session);
    expect(res.status).toBe(200);
    expect(res.body.some((s: any) => s.id === staffId)).toBe(false);
  });

  it('POST staff — 401 without auth', async () => {
    const { csrfToken } = await obtainCsrf();
    const res = await request.post(`/api/tenants/${tenantId}/staff`)
      .set('X-CSRF-Token', csrfToken)
      .send({ email: 'noauth@test.local', password: 'Test123456', name: 'No Auth', role: 'STAFF' });
    expect(res.status).toBe(403);
  });
});
