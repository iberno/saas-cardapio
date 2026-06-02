import { describe, it, expect } from 'vitest';
import { request, obtainCsrf, extractSetCookie } from './setup';

describe('Security — CSRF, validation, error handling', () => {
  // -----------------------------------------------------------------------
  // CSRF
  // -----------------------------------------------------------------------
  describe('CSRF', () => {
    it('GET /api/auth/csrf returns token + sets cookie', async () => {
      const res = await request.get('/api/auth/csrf');
      expect(res.status).toBe(200);
      expect(typeof res.body.csrfToken).toBe('string');
      const cookies = extractSetCookie(res);
      expect(cookies.some((c) => c.startsWith('_csrf='))).toBe(true);
    });

    it('POST without X-CSRF-Token returns 403', async () => {
      const res = await request.post('/api/platform/auth/login')
        .send({ email: 'admin@saas-cardapio.local', password: 'Admin123@senha' });
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('csrf');
    });

    it('POST with wrong X-CSRF-Token returns 403', async () => {
      const csrf = await obtainCsrf();
      const res = await request.post('/api/platform/auth/login')
        .set('X-CSRF-Token', 'fake-token')
        .set('Cookie', csrf.csrfCookie)
        .send({ email: 'admin@saas-cardapio.local', password: 'Admin123@senha' });
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('csrf');
    });

    it('GET works without CSRF (GET is ignored by CSRF)', async () => {
      const csrf = await obtainCsrf();
      const loginRes = await request.post('/api/platform/auth/login')
        .set('Host', 'acai.saas-cardapio.local')
        .set('X-CSRF-Token', csrf.csrfToken)
        .set('Cookie', csrf.csrfCookie)
        .send({ email: 'admin@saas-cardapio.local', password: 'Admin123@senha' });
      const cookies = extractSetCookie(loginRes);
      const session = cookies.find((c) => c.startsWith('pa_session='))!.split(';')[0];
      const me = await request.get('/api/platform/auth/me')
        .set('Cookie', session);
      expect(me.status).toBe(200);
    });
  });

  // -----------------------------------------------------------------------
  // Input validation
  // -----------------------------------------------------------------------
  describe('Input validation', () => {
    it('extra payload field returns 400', async () => {
      const csrf = await obtainCsrf();
      const res = await request.post('/api/platform/auth/login')
        .set('Host', 'acai.saas-cardapio.local')
        .set('X-CSRF-Token', csrf.csrfToken)
        .set('Cookie', csrf.csrfCookie)
        .send({
          email: 'admin@saas-cardapio.local',
          password: 'Admin123@senha',
          extraField: 'should-not-be-allowed',
        });
      expect(res.status).toBe(400);
    });

    it('missing email returns 400', async () => {
      const csrf = await obtainCsrf();
      const res = await request.post('/api/platform/auth/login')
        .set('Host', 'acai.saas-cardapio.local')
        .set('X-CSRF-Token', csrf.csrfToken)
        .set('Cookie', csrf.csrfCookie)
        .send({ password: 'Admin123@senha' });
      expect(res.status).toBe(400);
    });

    it('invalid email format returns 400', async () => {
      const csrf = await obtainCsrf();
      const res = await request.post('/api/platform/auth/login')
        .set('Host', 'acai.saas-cardapio.local')
        .set('X-CSRF-Token', csrf.csrfToken)
        .set('Cookie', csrf.csrfCookie)
        .send({ email: 'not-an-email', password: 'Admin123@senha' });
      expect(res.status).toBe(400);
    });

    it('customer auth without phone returns 400', async () => {
      const csrf = await obtainCsrf();
      const res = await request.post('/api/customer/auth/login')
        .set('Host', 'acai.saas-cardapio.local')
        .set('X-CSRF-Token', csrf.csrfToken)
        .set('Cookie', csrf.csrfCookie)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // -----------------------------------------------------------------------
  // Error responses
  // -----------------------------------------------------------------------
  describe('Error responses', () => {
    it('401 does not leak stack trace', async () => {
      const csrf = await obtainCsrf();
      const res = await request.post('/api/platform/auth/login')
        .set('Host', 'acai.saas-cardapio.local')
        .set('X-CSRF-Token', csrf.csrfToken)
        .set('Cookie', csrf.csrfCookie)
        .send({ email: 'admin@saas-cardapio.local', password: 'wrong' });
      expect(res.status).toBe(401);
      expect(res.body).not.toHaveProperty('stack');
    });

    it('400 response includes traceId', async () => {
      const csrf = await obtainCsrf();
      const res = await request.post('/api/platform/auth/login')
        .set('Host', 'acai.saas-cardapio.local')
        .set('X-CSRF-Token', csrf.csrfToken)
        .set('Cookie', csrf.csrfCookie)
        .send({ email: 'not-an-email', password: 'Admin123@senha' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('traceId');
      expect(typeof res.body.traceId).toBe('string');
    });
  });
});
