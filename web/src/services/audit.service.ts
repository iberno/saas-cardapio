import { api } from '../lib/api-client'

export interface AuditLog {
  id: string
  tenantId: string | null
  actorType: 'PLATFORM_ADMIN' | 'TENANT_USER' | 'CUSTOMER'
  actorId: string
  action: string
  resourceType: string | null
  resourceId: string | null
  metadata: Record<string, unknown> | null
  ip: string | null
  createdAt: string
}

interface PaginatedResponse {
  data: AuditLog[]
  total: number
  page: number
  limit: number
}

export async function listarAuditLogs(
  tenantId: string,
  opts?: { page?: number; limit?: number; action?: string },
): Promise<PaginatedResponse> {
  const params = new URLSearchParams()
  if (opts?.page) params.set('page', String(opts.page))
  if (opts?.limit) params.set('limit', String(opts.limit))
  if (opts?.action) params.set('action', opts.action)
  const qs = params.toString()
  return api.get<PaginatedResponse>(`/tenants/${tenantId}/audit-logs${qs ? `?${qs}` : ''}`)
}
