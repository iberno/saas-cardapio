import { describe, it, expect, beforeAll } from 'vitest';
import { request, obtainCsrf, extractSetCookie, cookieHeader } from './setup';

const TENANT_EMAIL = 'owner@acai.local';
const TENANT_PASSWORD = 'Admin123@senha';
const HOST = 'acai.saas-cardapio.local';

async function loginAsTenant(): Promise<{ session: string; tenantId: string }> {
  const { csrfToken, csrfCookie } = await obtainCsrf();
  const loginRes = await request.post('/api/tenant/auth/login')
    .set('Host', HOST)
    .set('X-CSRF-Token', csrfToken)
    .set('Cookie', csrfCookie)
    .send({ email: TENANT_EMAIL, password: TENANT_PASSWORD });
  expect(loginRes.status).toBe(200);
  const cookies = extractSetCookie(loginRes);
  const session = cookies.find((c) => c.startsWith('tu_session='))!.split(';')[0];

  const meRes = await request.get('/api/tenant/auth/me').set('Cookie', session);
  expect(meRes.status).toBe(200);
  return { session, tenantId: meRes.body.tenantId };
}

async function authHeaders(session: string) {
  const { csrfToken, csrfCookie } = await obtainCsrf();
  return { csrfToken, cookie: cookieHeader(csrfCookie, session) };
}

describe('Store content E2E', () => {
  let session: string;
  let tenantId: string;

  beforeAll(async () => {
    const r = await loginAsTenant();
    session = r.session;
    tenantId = r.tenantId;
  });

  describe('Categorias CRUD', () => {
    let id: string;

    it('POST /api/tenants/:tenantId/categorias — 201', async () => {
      const { csrfToken, cookie } = await authHeaders(session);
      const res = await request.post(`/api/tenants/${tenantId}/categorias`)
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', cookie)
        .send({ nome: 'E2E Categoria' });
      expect(res.status).toBe(201);
      expect(res.body.nome).toBe('E2E Categoria');
      id = res.body.id;
    });

    it('GET categorias — list includes new categoria', async () => {
      const res = await request.get(`/api/tenants/${tenantId}/categorias`)
        .set('Cookie', session);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((c: any) => c.id === id)).toBe(true);
    });

    it('PATCH categorias — rename', async () => {
      const { csrfToken, cookie } = await authHeaders(session);
      const res = await request.patch(`/api/tenants/${tenantId}/categorias/${id}`)
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', cookie)
        .send({ nome: 'E2E Renamed' });
      expect(res.status).toBe(200);
      expect(res.body.nome).toBe('E2E Renamed');
    });

    it('DELETE categorias — 200', async () => {
      const { csrfToken, cookie } = await authHeaders(session);
      const res = await request.delete(`/api/tenants/${tenantId}/categorias/${id}`)
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', cookie);
      expect(res.status).toBe(200);
    });

    it('GET categorias — deleted categoria is gone', async () => {
      const res = await request.get(`/api/tenants/${tenantId}/categorias`)
        .set('Cookie', session);
      expect(res.status).toBe(200);
      expect(res.body.some((c: any) => c.id === id)).toBe(false);
    });
  });

  describe('Variantes CRUD', () => {
    let produtoId: string;
    let varianteId: string;

    beforeAll(async () => {
      const { csrfToken, cookie } = await authHeaders(session);
      const res = await request.post(`/api/tenants/${tenantId}/produtos`)
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', cookie)
        .send({ nome: 'E2E Variante Prod', preco: 10, categoria: 'BEBIDAS' });
      expect(res.status).toBe(201);
      produtoId = res.body.id;
    });

    it('POST variante — 201', async () => {
      const { csrfToken, cookie } = await authHeaders(session);
      const res = await request.post(`/api/tenants/${tenantId}/produtos/${produtoId}/variantes`)
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', cookie)
        .send({ nome: 'Grande', preco: 15 });
      expect(res.status).toBe(201);
      expect(res.body.nome).toBe('Grande');
      varianteId = res.body.id;
    });

    it('GET variantes — array with new variante', async () => {
      const res = await request.get(`/api/tenants/${tenantId}/produtos/${produtoId}/variantes`)
        .set('Cookie', session);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((v: any) => v.id === varianteId)).toBe(true);
    });

    it('PATCH variante — update price', async () => {
      const { csrfToken, cookie } = await authHeaders(session);
      const res = await request.patch(`/api/tenants/${tenantId}/produtos/${produtoId}/variantes/${varianteId}`)
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', cookie)
        .send({ preco: 20 });
      expect(res.status).toBe(200);
      expect(Number(res.body.preco)).toBe(20);
    });

    it('DELETE variante — 200', async () => {
      const { csrfToken, cookie } = await authHeaders(session);
      const res = await request.delete(`/api/tenants/${tenantId}/produtos/${produtoId}/variantes/${varianteId}`)
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', cookie);
      expect(res.status).toBe(200);
    });
  });

  describe('Grupos + Itens CRUD', () => {
    let produtoId: string;
    let grupoId: string;
    let itemId: string;

    beforeAll(async () => {
      const { csrfToken, cookie } = await authHeaders(session);
      const res = await request.post(`/api/tenants/${tenantId}/produtos`)
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', cookie)
        .send({ nome: 'E2E Grupo Prod', preco: 10, categoria: 'BEBIDAS' });
      expect(res.status).toBe(201);
      produtoId = res.body.id;
    });

    it('POST grupo — 201', async () => {
      const { csrfToken, cookie } = await authHeaders(session);
      const res = await request.post(`/api/tenants/${tenantId}/produtos/${produtoId}/grupos`)
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', cookie)
        .send({ nome: 'Adicionais' });
      expect(res.status).toBe(201);
      expect(res.body.nome).toBe('Adicionais');
      grupoId = res.body.id;
    });

    it('POST item to grupo — 201', async () => {
      const { csrfToken, cookie } = await authHeaders(session);
      const res = await request.post(`/api/tenants/${tenantId}/grupos/${grupoId}/itens`)
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', cookie)
        .send({ nome: 'Borda', preco: 5 });
      expect(res.status).toBe(201);
      expect(res.body.nome).toBe('Borda');
      itemId = res.body.id;
    });

    it('GET grupos — includes items', async () => {
      const res = await request.get(`/api/tenants/${tenantId}/produtos/${produtoId}/grupos`)
        .set('Cookie', session);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const grupo = res.body.find((g: any) => g.id === grupoId);
      expect(grupo).toBeDefined();
      expect(Array.isArray(grupo.itens)).toBe(true);
      expect(grupo.itens.some((i: any) => i.id === itemId)).toBe(true);
    });

    it('DELETE item — 200', async () => {
      const { csrfToken, cookie } = await authHeaders(session);
      const res = await request.delete(`/api/tenants/${tenantId}/grupos/${grupoId}/itens/${itemId}`)
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', cookie);
      expect(res.status).toBe(200);
    });
  });

  describe('Banners CRUD', () => {
    let bannerId: string;

    it('POST banner — 201', async () => {
      const { csrfToken, cookie } = await authHeaders(session);
      const res = await request.post(`/api/tenants/${tenantId}/banners`)
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', cookie)
        .send({ imagemUrl: 'https://example.com/banner.jpg' });
      expect(res.status).toBe(201);
      bannerId = res.body.id;
    });

    it('GET banners — array', async () => {
      const res = await request.get(`/api/tenants/${tenantId}/banners`)
        .set('Cookie', session);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((b: any) => b.id === bannerId)).toBe(true);
    });

    it('DELETE banner — 200', async () => {
      const { csrfToken, cookie } = await authHeaders(session);
      const res = await request.delete(`/api/tenants/${tenantId}/banners/${bannerId}`)
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', cookie);
      expect(res.status).toBe(200);
    });
  });

  describe('Upload', () => {
    let filename: string;

    it('POST upload — 201, returns url and filename', async () => {
      const img = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
      const { csrfToken, cookie } = await authHeaders(session);
      const res = await request.post(`/api/tenants/${tenantId}/upload`)
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', cookie)
        .attach('file', img, 'test.jpg');
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('url');
      expect(res.body).toHaveProperty('filename');
      filename = res.body.filename;
    });

    it('DELETE upload — 200', async () => {
      const { csrfToken, cookie } = await authHeaders(session);
      const res = await request.delete(`/api/tenants/${tenantId}/uploads/${filename}`)
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', cookie);
      expect(res.status).toBe(200);
    });
  });

  describe('Public endpoints', () => {
    it('GET /api/public/acai/produtos — 200, array with expected fields', async () => {
      const res = await request.get('/api/public/acai/produtos');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      if (res.body.data.length > 0) {
        const p = res.body.data[0];
        expect(p).toHaveProperty('categoriaCardapio');
        expect(p).toHaveProperty('variantes');
        expect(p).toHaveProperty('grupos');
      }
    });

    it('GET /api/public/acai/banners — 200, array', async () => {
      const res = await request.get('/api/public/acai/banners');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
