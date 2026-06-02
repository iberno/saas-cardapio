import { api } from '../lib/api-client'
import type { Banner, CreateBannerRequest, UpdateBannerRequest } from '../types'

export async function listarBanners(tenantId: string): Promise<Banner[]> {
  return api.get<Banner[]>(`/tenants/${tenantId}/banners`)
}

export async function criarBanner(tenantId: string, data: CreateBannerRequest): Promise<Banner> {
  return api.post<Banner>(`/tenants/${tenantId}/banners`, data)
}

export async function atualizarBanner(tenantId: string, id: string, data: UpdateBannerRequest): Promise<Banner> {
  return api.patch<Banner>(`/tenants/${tenantId}/banners/${id}`, data)
}

export async function excluirBanner(tenantId: string, id: string): Promise<void> {
  return api.delete(`/tenants/${tenantId}/banners/${id}`)
}
