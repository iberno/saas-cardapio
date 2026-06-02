import { api } from '../lib/api-client'
import type { Categoria, CreateCategoriaRequest, UpdateCategoriaRequest } from '../types'

export async function listarCategorias(tenantId: string): Promise<Categoria[]> {
  return api.get<Categoria[]>(`/tenants/${tenantId}/categorias`)
}

export async function criarCategoria(tenantId: string, data: CreateCategoriaRequest): Promise<Categoria> {
  return api.post<Categoria>(`/tenants/${tenantId}/categorias`, data)
}

export async function atualizarCategoria(tenantId: string, id: string, data: UpdateCategoriaRequest): Promise<Categoria> {
  return api.patch<Categoria>(`/tenants/${tenantId}/categorias/${id}`, data)
}

export async function excluirCategoria(tenantId: string, id: string): Promise<void> {
  return api.delete(`/tenants/${tenantId}/categorias/${id}`)
}

export async function reordenarCategorias(tenantId: string, ordem: string[]): Promise<void> {
  return api.put(`/tenants/${tenantId}/categorias/reorder`, { ordem })
}
