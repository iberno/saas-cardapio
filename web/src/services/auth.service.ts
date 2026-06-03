import { api } from '../lib/api-client'

export async function loginPlatform(email: string, password: string): Promise<void> {
  await api.post('/platform/auth/login', { email, password })
}

export async function loginTenantUser(email: string, password: string): Promise<void> {
  await api.post('/tenant/auth/login', { email, password })
}

export async function logoutPlatform(): Promise<void> {
  await api.post('/platform/auth/logout')
}

export async function logoutTenantUser(): Promise<void> {
  await api.post('/tenant/auth/logout')
}

export async function setupTotp(type: 'platform' | 'tenant'): Promise<{ secret: string; url: string }> {
  const prefix = type === 'platform' ? 'platform' : 'tenant'
  return api.post(`/${prefix}/auth/totp/setup`)
}

export async function enableTotp(type: 'platform' | 'tenant', code: string): Promise<{ message: string }> {
  const prefix = type === 'platform' ? 'platform' : 'tenant'
  return api.post(`/${prefix}/auth/totp/enable`, { code })
}

export async function disableTotp(type: 'platform' | 'tenant'): Promise<{ message: string }> {
  const prefix = type === 'platform' ? 'platform' : 'tenant'
  return api.post(`/${prefix}/auth/totp/disable`)
}

export async function loginTotp(
  preAuthToken: string,
  code: string,
  type: 'platform' | 'tenant',
): Promise<void> {
  const prefix = type === 'platform' ? 'platform' : 'tenant'
  await api.post(`/${prefix}/auth/login/totp`, { preAuthToken, code })
}

export async function forgotPassword(email: string, type: 'platform' | 'tenant'): Promise<{ message: string; devToken?: string; devUrl?: string }> {
  const prefix = type === 'platform' ? 'platform' : 'tenant'
  return api.post(`/${prefix}/auth/forgot-password`, { email })
}

export async function resetPassword(token: string, newPassword: string, type: 'platform' | 'tenant'): Promise<{ message: string }> {
  const prefix = type === 'platform' ? 'platform' : 'tenant'
  return api.post(`/${prefix}/auth/reset-password`, { token, newPassword })
}
