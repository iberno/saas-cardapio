const BASE_URL = '/api'

let csrfToken: string | null = null

async function obtainCsrf(): Promise<string> {
  if (csrfToken) return csrfToken
  const res = await fetch(`${BASE_URL}/auth/csrf`, { credentials: 'include' })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new ApiError(res.status, `CSRF failed: ${text || res.statusText}`)
  }
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

async function safeParseError(res: Response): Promise<{ message: string }> {
  try {
    const text = await res.text()
    if (!text) return { message: res.statusText }
    return JSON.parse(text)
  } catch {
    return { message: res.statusText }
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
        if (retry.status === 204) return undefined as T
        const body = await retry.text()
        return body ? JSON.parse(body) : undefined as T
      }
      const err2 = await safeParseError(retry)
      throw new ApiError(retry.status, err2.message || 'Request failed')
    }
    const err = await safeParseError(res)
    throw new ApiError(res.status, err.message || 'Request failed')
  }

  if (res.status === 204) return undefined as T
  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text)
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
