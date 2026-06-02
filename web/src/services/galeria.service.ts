import { api } from '../lib/api-client'

export interface GaleriaImage {
  filename: string
  url: string
  size: number
  lastModified: string
}

export async function listarGaleria(tenantId: string): Promise<GaleriaImage[]> {
  return api.get(`/tenants/${tenantId}/galeria`)
}

export async function excluirImagemGaleria(tenantId: string, filename: string): Promise<void> {
  return api.delete(`/tenants/${tenantId}/uploads/${filename}`)
}
