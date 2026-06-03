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

describe('Orders E2E', () => {
  let session: string;
  let tenantId: string;
  let orderId: string;
  let produtoId: string;

  beforeAll(async () => {
    const r = await loginAsTenant();
    session = r.session;
    tenantId = r.tenantId;

    // ensure at least one product exists for order items
    const { csrfToken, cookie } = await authHeaders(session);
    const catRes = await request.post(`/api/tenants/${tenantId}/categorias`)
      .set('X-CSRF-Token', csrfToken).set('Cookie', cookie)
      .send({ nome: 'E2E Test Cat' });
    const catId = catRes.status === 201 ? catRes.body.id : null;

    const prodRes = await request.post(`/api/tenants/${tenantId}/produtos`)
      .set('X-CSRF-Token', csrfToken).set('Cookie', cookie)
      .send({ nome: 'E2E Order Prod', preco: 15, categoriaId: catId });
    produtoId = prodRes.body.id;
  });

  it('POST order — 201 with items', async () => {
    const { csrfToken, cookie } = await authHeaders(session);
    const res = await request.post(`/api/tenants/${tenantId}/orders`)
      .set('X-CSRF-Token', csrfToken)
      .set('Cookie', cookie)
      .send({
        customerName: 'E2E Customer',
        customerPhone: '11999999999',
        items: [
          { productId: produtoId, productName: 'E2E Order Prod', quantity: 2, price: 15 },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.total).toBeDefined();
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBe(1);
    orderId = res.body.id;
  });

  it('GET orders — list includes new order', async () => {
    const res = await request.get(`/api/tenants/${tenantId}/orders`)
      .set('Cookie', session);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((o: any) => o.id === orderId)).toBe(true);
  });

  it('GET order by id — returns full order', async () => {
    const res = await request.get(`/api/tenants/${tenantId}/orders/${orderId}`)
      .set('Cookie', session);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(orderId);
    expect(res.body.customerName).toBe('E2E Customer');
  });

  it('PUT order status — updates status', async () => {
    const { csrfToken, cookie } = await authHeaders(session);
    const res = await request.put(`/api/tenants/${tenantId}/orders/${orderId}/status`)
      .set('X-CSRF-Token', csrfToken)
      .set('Cookie', cookie)
      .send({ status: 'PREPARING' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PREPARING');
  });

  it('PUT order status — progresses to DELIVERED', async () => {
    const { csrfToken, cookie } = await authHeaders(session);
    const res = await request.put(`/api/tenants/${tenantId}/orders/${orderId}/status`)
      .set('X-CSRF-Token', csrfToken)
      .set('Cookie', cookie)
      .send({ status: 'DELIVERED' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('DELIVERED');
  });

  it('PUT cancel order — 200', async () => {
    // create a fresh order to cancel
    const { csrfToken, cookie } = await authHeaders(session);
    const createRes = await request.post(`/api/tenants/${tenantId}/orders`)
      .set('X-CSRF-Token', csrfToken).set('Cookie', cookie)
      .send({ customerName: 'Cancel Test', customerPhone: '11988888888', items: [{ productId: produtoId, productName: 'E2E Order Prod', quantity: 1, price: 15 }] });
    const cancelOrderId = createRes.body.id;

    const cancelRes = await request.put(`/api/tenants/${tenantId}/orders/${cancelOrderId}/cancel`)
      .set('X-CSRF-Token', csrfToken).set('Cookie', cookie);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.status).toBe('CANCELLED');
  });

  it('GET orders filtered by status', async () => {
    const res = await request.get(`/api/tenants/${tenantId}/orders?status=PENDING`)
      .set('Cookie', session);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST order — 401 without auth', async () => {
    const { csrfToken } = await obtainCsrf();
    const res = await request.post(`/api/tenants/${tenantId}/orders`)
      .set('X-CSRF-Token', csrfToken)
      .send({ customerName: 'NoAuth', customerPhone: '11977777777', items: [] });
    expect(res.status).toBe(403);
  });
});
