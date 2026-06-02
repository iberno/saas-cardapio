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
