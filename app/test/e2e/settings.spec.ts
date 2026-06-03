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

describe('Settings E2E', () => {
  let session: string;
  let tenantId: string;

  beforeAll(async () => {
    const r = await loginAsTenant();
    session = r.session;
    tenantId = r.tenantId;
  });

  it('GET settings — returns settings object', async () => {
    const res = await request.get(`/api/tenants/${tenantId}/settings`)
      .set('Cookie', session);
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('PUT settings — updates settings', async () => {
    const { csrfToken, cookie } = await authHeaders(session);
    const res = await request.put(`/api/tenants/${tenantId}/settings`)
      .set('X-CSRF-Token', csrfToken)
      .set('Cookie', cookie)
      .send({ description: 'E2E Test Description', contactPhone: '11999999999' });
    expect(res.status).toBe(200);
    expect(res.body.description).toBe('E2E Test Description');
    expect(res.body.contactPhone).toBe('11999999999');
  });

  it('GET settings — reflects update', async () => {
    const res = await request.get(`/api/tenants/${tenantId}/settings`)
      .set('Cookie', session);
    expect(res.status).toBe(200);
    expect(res.body.description).toBe('E2E Test Description');
  });
});
