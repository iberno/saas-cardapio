import { api } from '../lib/api-client'
import type { AuthResponse, PlatformUser, TenantUser } from '../types'

export async function loginPlatform(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return api.post<AuthResponse>('/auth/platform/login', { email, password })
}

export async function loginTenantUser(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return api.post<AuthResponse>('/auth/tenant-user/login', { email, password })
}

export async function getPlatformMe(): Promise<PlatformUser> {
  return api.get<PlatformUser>('/auth/platform/me')
}

export async function getTenantUserMe(): Promise<TenantUser> {
  return api.get<TenantUser>('/auth/tenant-user/me')
}
