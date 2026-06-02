import { api } from '../lib/api-client'
import type {
  Tenant,
  CreateTenantRequest,
  UpdateTenantStatusRequest,
  PageResponse,
} from '../types'

export async function listarTenants(
  params?: { page?: number; limit?: number },
): Promise<PageResponse<Tenant>> {
  const search = new URLSearchParams()
  if (params?.page) search.set('page', String(params.page))
  if (params?.limit) search.set('limit', String(params.limit))
  const qs = search.toString()
  return api.get(`/platform/tenants${qs ? `?${qs}` : ''}`)
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
  return api.patch<Tenant>(`/platform/tenants/${id}/status`, data)
}
