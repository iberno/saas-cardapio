import { api } from '../lib/api-client'
import type { ProdutoVariante, CreateVarianteRequest, UpdateVarianteRequest } from '../types'

export async function listarVariantes(tenantId: string, produtoId: string): Promise<ProdutoVariante[]> {
  return api.get<ProdutoVariante[]>(`/tenants/${tenantId}/produtos/${produtoId}/variantes`)
}

export async function criarVariante(tenantId: string, produtoId: string, data: CreateVarianteRequest): Promise<ProdutoVariante> {
  return api.post<ProdutoVariante>(`/tenants/${tenantId}/produtos/${produtoId}/variantes`, data)
}

export async function atualizarVariante(tenantId: string, produtoId: string, id: string, data: UpdateVarianteRequest): Promise<ProdutoVariante> {
  return api.patch<ProdutoVariante>(`/tenants/${tenantId}/produtos/${produtoId}/variantes/${id}`, data)
}

export async function excluirVariante(tenantId: string, produtoId: string, id: string): Promise<void> {
  return api.delete(`/tenants/${tenantId}/produtos/${produtoId}/variantes/${id}`)
}
