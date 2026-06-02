import { api } from '../lib/api-client'
import type { Tenant, CreateTenantRequest, UpdateTenantRequest, UpdateTenantStatusRequest } from '../types'

export async function listarTenants(): Promise<Tenant[]> {
  return api.get<Tenant[]>('/platform/tenants')
}

export async function buscarTenant(id: string): Promise<Tenant> {
  return api.get<Tenant>(`/platform/tenants/${id}`)
}

export async function criarTenant(data: CreateTenantRequest): Promise<Tenant> {
  return api.post<Tenant>('/platform/tenants', data)
}

export async function atualizarTenant(id: string, data: UpdateTenantRequest): Promise<Tenant> {
  return api.patch<Tenant>(`/platform/tenants/${id}`, data)
}

export async function excluirTenant(id: string): Promise<void> {
  return api.delete(`/platform/tenants/${id}`)
}

export async function atualizarStatusTenant(id: string, data: UpdateTenantStatusRequest): Promise<Tenant> {
  return api.post<Tenant>(`/platform/tenants/${id}/status`, data)
}
