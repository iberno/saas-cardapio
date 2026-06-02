import { api } from '../lib/api-client'
import type { StoreTheme } from '../types'

export async function getTheme(tenantId: string): Promise<StoreTheme> {
  return api.get<StoreTheme>(`/tenants/${tenantId}/theme`)
}

export async function updateTheme(tenantId: string, theme: StoreTheme): Promise<{ theme: StoreTheme }> {
  return api.put<{ theme: StoreTheme }>(`/tenants/${tenantId}/theme`, theme)
}
