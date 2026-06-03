import { api } from '../lib/api-client'

export interface StoreSettings {
  name: string
  contactPhone: string | null
  description: string
  address: string
  instagram: string
  hoursText: string
  paymentMethods: string
  pointsEnabled: boolean
  pointsPerReais: number
}

export async function getSettings(tenantId: string): Promise<StoreSettings> {
  const res = await api.get<StoreSettings>(`/tenants/${tenantId}/settings`)
  return res
}

export async function updateSettings(tenantId: string, data: Partial<StoreSettings>): Promise<StoreSettings> {
  const res = await api.put<StoreSettings>(`/tenants/${tenantId}/settings`, data)
  return res
}
