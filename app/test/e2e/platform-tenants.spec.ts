import { describe, it, expect } from 'vitest';
import { request, obtainCsrf, cookieHeader, extractSetCookie } from './setup';

const PLATFORM_EMAIL = 'admin@saas-cardapio.local';
const PLATFORM_PASSWORD = 'Admin123@senha';

async function loginAsPlatformAdmin(): Promise<{ sessionCookie: string }> {
  const csrf = await obtainCsrf();
  const res = await request.post('/api/platform/auth/login')
    .set('X-CSRF-Token', csrf.csrfToken)
    .set('Cookie', csrf.csrfCookie)
    .send({ email: PLATFORM_EMAIL, password: PLATFORM_PASSWORD });
  expect(res.status).toBe(200);
  const cookies = extractSetCookie(res);
  const sessionCookie = cookies.find((c) => c.startsWith('pa_session='))!.split(';')[0];
  return { sessionCookie };
}

async function withCsrf(sessionCookie: string) {
  const { csrfToken, csrfCookie } = await obtainCsrf();
  return { csrfToken, cookie: cookieHeader(csrfCookie, sessionCookie) };
}

describe('Platform Admin — Tenant creation with owner', () => {
  let sessionCookie: string;

  it('creates tenant without owner — works', async () => {
    const s = await loginAsPlatformAdmin();
    sessionCookie = s.sessionCookie;

    const { csrfToken, cookie } = await withCsrf(sessionCookie);
    const slug = `e2e-no-owner-${Date.now()}`;
    const res = await request.post('/api/platform/tenants')
      .set('X-CSRF-Token', csrfToken)
      .set('Cookie', cookie)
      .send({ slug, name: 'E2E No Owner', contactEmail: 'no-owner@test.com' });
    expect(res.status).toBe(201);
    expect(res.body.ownerEmail).toBeUndefined();
    expect(res.body.id).toBeDefined();
    expect(res.body.slug).toBe(slug);
  });

  it('creates tenant with owner — returns ownerEmail', async () => {
    const { csrfToken, cookie } = await withCsrf(sessionCookie);
    const slug = `e2e-with-owner-${Date.now()}`;
    const ownerEmail = `owner-${Date.now()}@test.com`;
    const ownerPassword = 'TestPwd123@';
    const res = await request.post('/api/platform/tenants')
      .set('X-CSRF-Token', csrfToken)
      .set('Cookie', cookie)
      .send({ slug, name: 'E2E With Owner', contactEmail: 'with-owner@test.com', ownerEmail, ownerPassword });
    expect(res.status).toBe(201);
    expect(res.body.ownerEmail).toBe(ownerEmail);
    expect(res.body.slug).toBe(slug);

    // Now login as the new owner
    const loginCsrf = await obtainCsrf();
    const loginRes = await request.post('/api/tenant/auth/login')
      .set('Host', '127.0.0.1:3001')
      .set('X-CSRF-Token', loginCsrf.csrfToken)
      .set('Cookie', loginCsrf.csrfCookie)
      .send({ email: ownerEmail, password: ownerPassword, slug });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toEqual({ message: 'Authenticated' });
    const loginCookies = extractSetCookie(loginRes);
    const tuSession = loginCookies.find((c) => c.startsWith('tu_session='));
    expect(tuSession).toBeTruthy();
  });

  it('creates tenant with owner — login fails with wrong password', async () => {
    const { csrfToken, cookie } = await withCsrf(sessionCookie);
    const slug = `e2e-wrong-pwd-${Date.now()}`;
    const ownerEmail = `wrong-pwd-${Date.now()}@test.com`;
    const res = await request.post('/api/platform/tenants')
      .set('X-CSRF-Token', csrfToken)
      .set('Cookie', cookie)
      .send({ slug, name: 'E2E Wrong Pwd', contactEmail: 'wrong-pwd@test.com', ownerEmail, ownerPassword: 'CorrectPwd1@' });
    expect(res.status).toBe(201);
    expect(res.body.ownerEmail).toBe(ownerEmail);

    const loginCsrf = await obtainCsrf();
    const loginRes = await request.post('/api/tenant/auth/login')
      .set('Host', '127.0.0.1:3001')
      .set('X-CSRF-Token', loginCsrf.csrfToken)
      .set('Cookie', loginCsrf.csrfCookie)
      .send({ email: ownerEmail, password: 'WrongPwd1@', slug });
    expect(loginRes.status).toBe(401);
  });
});
