const BASE_URL = '/api'

let csrfToken: string | null = null

async function obtainCsrf(): Promise<string> {
  if (csrfToken) return csrfToken
  const res = await fetch(`${BASE_URL}/auth/csrf`, { credentials: 'include' })
  const data = await res.json()
  csrfToken = data.csrfToken
  return csrfToken!
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (method !== 'GET' && method !== 'HEAD') {
    const token = await obtainCsrf()
    headers['X-CSRF-Token'] = token
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    if (res.status === 403 && method !== 'GET' && method !== 'HEAD') {
      csrfToken = null
      headers['X-CSRF-Token'] = await obtainCsrf()
      const retry = await fetch(`${BASE_URL}${path}`, {
        method, headers, credentials: 'include',
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
      if (retry.ok) {
        return retry.status === 204 ? undefined as T : retry.json()
      }
      const err2 = await retry.json().catch(() => ({ message: retry.statusText }))
      throw new ApiError(retry.status, err2.message || 'Request failed')
    }
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new ApiError(res.status, error.message || 'Request failed')
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
