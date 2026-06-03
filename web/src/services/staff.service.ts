import { api } from '../lib/api-client'
import type { TenantUser } from '../types'

export interface CreateStaffRequest {
  email: string
  password: string
  name: string
  role?: 'OWNER' | 'STAFF'
}

export interface UpdateStaffRequest {
  email?: string
  password?: string
  name?: string
  role?: 'OWNER' | 'STAFF'
}

export async function listarStaff(tenantId: string): Promise<TenantUser[]> {
  return api.get<TenantUser[]>(`/tenants/${tenantId}/staff`)
}

export async function criarStaff(tenantId: string, data: CreateStaffRequest): Promise<TenantUser> {
  return api.post<TenantUser>(`/tenants/${tenantId}/staff`, data)
}

export async function atualizarStaff(tenantId: string, id: string, data: UpdateStaffRequest): Promise<TenantUser> {
  return api.patch<TenantUser>(`/tenants/${tenantId}/staff/${id}`, data)
}

export async function excluirStaff(tenantId: string, id: string): Promise<void> {
  return api.delete(`/tenants/${tenantId}/staff/${id}`)
}
