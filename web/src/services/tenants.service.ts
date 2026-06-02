import { api } from '../lib/api-client'
import type {
  Tenant,
  CreateTenantRequest,
  UpdateTenantStatusRequest,
} from '../types'

export async function listarTenants(): Promise<Tenant[]> {
  return api.get<Tenant[]>('/platform/tenants')
}

export async function criarTenant(
  data: CreateTenantRequest,
): Promise<Tenant> {
  return api.post<Tenant>('/platform/tenants', data)
}

export async function atualizarStatusTenant(
  id: string,
  data: UpdateTenantStatusRequest,
): Promise<Tenant> {
  return api.post<Tenant>(`/platform/tenants/${id}/status`, data)
}
