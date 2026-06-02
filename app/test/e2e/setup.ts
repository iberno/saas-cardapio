import supertest from 'supertest';

const PORT = parseInt(process.env.PORT || '3001', 10);
export const BASE = `http://127.0.0.1:${PORT}`;

export const request = supertest(BASE);

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

export function extractSetCookie(res: any): string[] {
  const val = res.headers['set-cookie'];
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [val];
}

export async function obtainCsrf(): Promise<{
  csrfToken: string;
  csrfCookie: string;
}> {
  const res = await request.get('/api/auth/csrf');
  const csrfToken: string = res.body.csrfToken;
  const setCookie = extractSetCookie(res);
  const raw = setCookie.find((c) => c.startsWith('_csrf='));
  const csrfCookie = raw ? raw.split(';')[0] : '';
  return { csrfToken, csrfCookie };
}

export function cookieHeader(csrfCookie: string, ...appCookies: string[]): string {
  return [csrfCookie, ...appCookies].filter(Boolean).join('; ');
}
