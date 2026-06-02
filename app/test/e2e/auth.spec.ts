import { describe, it, expect } from 'vitest';
import { request, obtainCsrf, cookieHeader, extractSetCookie } from './setup';

const PLATFORM_EMAIL = 'admin@saas-cardapio.local';
const PLATFORM_PASSWORD = 'Admin123@senha';
const TENANT_EMAIL = 'owner@acai.local';
const TENANT_PASSWORD = 'Admin123@senha';
const CUSTOMER_PHONE = '+5511999999999';
const WRONG_PASSWORD = 'WrongPass1@';

describe('Auth — all three domains', () => {
  // -----------------------------------------------------------------------
  // Platform auth
  // -----------------------------------------------------------------------
  describe('Platform', () => {
    let sessionCookie: string;
    let refreshCookie: string;

    it('POST /api/platform/auth/login — 200 on valid credentials', async () => {
      const csrf = await obtainCsrf();
      const res = await request.post('/api/platform/auth/login')
        .set('Host', 'acai.saas-cardapio.local')
        .set('X-CSRF-Token', csrf.csrfToken)
        .set('Cookie', csrf.csrfCookie)
        .send({ email: PLATFORM_EMAIL, password: PLATFORM_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Authenticated' });
      const cookies = extractSetCookie(res);
      sessionCookie = cookies.find((c) => c.startsWith('pa_session='))!.split(';')[0];
      refreshCookie = cookies.find((c) => c.startsWith('pa_session_refresh='))!.split(';')[0];
      expect(sessionCookie).toBeTruthy();
    });

    it('POST /api/platform/auth/login — 401 on wrong password', async () => {
      const csrf = await obtainCsrf();
      const res = await request.post('/api/platform/auth/login')
        .set('Host', 'acai.saas-cardapio.local')
        .set('X-CSRF-Token', csrf.csrfToken)
        .set('Cookie', csrf.csrfCookie)
        .send({ email: PLATFORM_EMAIL, password: WRONG_PASSWORD });
      expect(res.status).toBe(401);
    });

    it('POST /api/platform/auth/refresh — 200', async () => {
      const csrf = await obtainCsrf();
      const res = await request.post('/api/platform/auth/refresh')
        .set('X-CSRF-Token', csrf.csrfToken)
        .set('Cookie', cookieHeader(csrf.csrfCookie, refreshCookie));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Refreshed' });
      const cookies = extractSetCookie(res);
      sessionCookie = cookies.find((c) => c.startsWith('pa_session='))!.split(';')[0];
      refreshCookie = cookies.find((c) => c.startsWith('pa_session_refresh='))!.split(';')[0];
    });

    it('GET /api/platform/auth/me — 200 with valid cookie', async () => {
      const res = await request.get('/api/platform/auth/me')
        .set('Cookie', sessionCookie);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(PLATFORM_EMAIL);
    });

    it('GET /api/platform/auth/me — 401 without cookie', async () => {
      const res = await request.get('/api/platform/auth/me');
      expect(res.status).toBe(401);
    });

    it('POST /api/platform/auth/logout — 200 and clears cookies', async () => {
      const csrf = await obtainCsrf();
      const res = await request.post('/api/platform/auth/logout')
        .set('X-CSRF-Token', csrf.csrfToken)
        .set('Cookie', cookieHeader(csrf.csrfCookie, sessionCookie));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Logged out' });
      const cookies = extractSetCookie(res);
      expect(cookies.length).toBeGreaterThan(0);
      expect(cookies.some((c) => c.startsWith('pa_session='))).toBe(true);
      expect(cookies.some((c) => c.startsWith('pa_session_refresh='))).toBe(true);
    });

    it('GET /api/platform/auth/me — 401 after logout', async () => {
      const res = await request.get('/api/platform/auth/me');
      expect(res.status).toBe(401);
    });
  });

  // -----------------------------------------------------------------------
  // Tenant-User auth (requires Host header for TenantMiddleware)
  // -----------------------------------------------------------------------
  describe('Tenant-User', () => {
    let sessionCookie: string;
    let refreshCookie: string;
    const host = 'acai.saas-cardapio.local';

    it('POST /api/tenant/auth/login — 200 on valid credentials', async () => {
      const csrf = await obtainCsrf();
      const res = await request.post('/api/tenant/auth/login')
        .set('Host', host)
        .set('X-CSRF-Token', csrf.csrfToken)
        .set('Cookie', csrf.csrfCookie)
        .send({ email: TENANT_EMAIL, password: TENANT_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Authenticated' });
      const cookies = extractSetCookie(res);
      sessionCookie = cookies.find((c) => c.startsWith('tu_session='))!.split(';')[0];
      refreshCookie = cookies.find((c) => c.startsWith('tu_session_refresh='))!.split(';')[0];
    });

    it('POST /api/tenant/auth/login — 401 on wrong password', async () => {
      const csrf = await obtainCsrf();
      const res = await request.post('/api/tenant/auth/login')
        .set('Host', host)
        .set('X-CSRF-Token', csrf.csrfToken)
        .set('Cookie', csrf.csrfCookie)
        .send({ email: TENANT_EMAIL, password: WRONG_PASSWORD });
      expect(res.status).toBe(401);
    });

    it('POST /api/tenant/auth/refresh — 200', async () => {
      const csrf = await obtainCsrf();
      const res = await request.post('/api/tenant/auth/refresh')
        .set('Host', host)
        .set('X-CSRF-Token', csrf.csrfToken)
        .set('Cookie', cookieHeader(csrf.csrfCookie, refreshCookie));
      expect(res.status).toBe(200);
      const cookies = extractSetCookie(res);
      sessionCookie = cookies.find((c) => c.startsWith('tu_session='))!.split(';')[0];
      refreshCookie = cookies.find((c) => c.startsWith('tu_session_refresh='))!.split(';')[0];
    });

    it('GET /api/tenant/auth/me — 200 with valid cookie', async () => {
      const res = await request.get('/api/tenant/auth/me')
        .set('Cookie', sessionCookie);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(TENANT_EMAIL);
    });

    it('GET /api/tenant/auth/me — 401 without cookie', async () => {
      const res = await request.get('/api/tenant/auth/me');
      expect(res.status).toBe(401);
    });

    it('POST /api/tenant/auth/logout — 200', async () => {
      const csrf = await obtainCsrf();
      const res = await request.post('/api/tenant/auth/logout')
        .set('Host', host)
        .set('X-CSRF-Token', csrf.csrfToken)
        .set('Cookie', cookieHeader(csrf.csrfCookie, sessionCookie));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Logged out' });
      const cookies = extractSetCookie(res);
      expect(cookies.length).toBeGreaterThan(0);
      expect(cookies.some((c) => c.startsWith('tu_session='))).toBe(true);
      expect(cookies.some((c) => c.startsWith('tu_session_refresh='))).toBe(true);
    });

    it('GET /api/tenant/auth/me — 401 after logout', async () => {
      const res = await request.get('/api/tenant/auth/me');
      expect(res.status).toBe(401);
    });
  });

  // -----------------------------------------------------------------------
  // Customer auth (phone-only upsert)
  // -----------------------------------------------------------------------
  describe('Customer', () => {
    let sessionCookie: string;
    const host = 'acai.saas-cardapio.local';

    it('POST /api/customer/auth/login — 200 (upsert)', async () => {
      const csrf = await obtainCsrf();
      const res = await request.post('/api/customer/auth/login')
        .set('Host', host)
        .set('X-CSRF-Token', csrf.csrfToken)
        .set('Cookie', csrf.csrfCookie)
        .send({ phone: CUSTOMER_PHONE });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Authenticated' });
      const cookies = extractSetCookie(res);
      sessionCookie = cookies.find((c) => c.startsWith('cu_session='))!.split(';')[0];
    });

    it('GET /api/customer/auth/me — 200 with valid cookie', async () => {
      const res = await request.get('/api/customer/auth/me')
        .set('Cookie', sessionCookie);
      expect(res.status).toBe(200);
      expect(res.body.phone).toBe(CUSTOMER_PHONE);
    });

    it('GET /api/customer/auth/me — 401 without cookie', async () => {
      const res = await request.get('/api/customer/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
