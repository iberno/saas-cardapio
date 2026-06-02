import { api } from '../lib/api-client'
import type {
  Produto,
  CreateProdutoRequest,
  UpdateProdutoRequest,
  PageResponse,
  Ordenacao,
} from '../types'

interface ListarParams {
  page?: number
  limit?: number
  ordenacao?: Ordenacao
}

export async function listarProdutos(
  tenantId: string,
  params?: ListarParams,
): Promise<PageResponse<Produto>> {
  const search = new URLSearchParams()
  if (params?.page) search.set('page', String(params.page))
  if (params?.limit) search.set('limit', String(params.limit))
  if (params?.categoria) search.set('categoria', params.categoria)
  if (params?.ordenacao) search.set('ordenacao', params.ordenacao)
  const qs = search.toString()
  return api.get(`/tenants/${tenantId}/produtos${qs ? `?${qs}` : ''}`)
}

export async function criarProduto(
  tenantId: string,
  data: CreateProdutoRequest,
): Promise<Produto> {
  return api.post<Produto>(`/tenants/${tenantId}/produtos`, data)
}

export async function atualizarProduto(
  tenantId: string,
  id: string,
  data: UpdateProdutoRequest,
): Promise<Produto> {
  return api.patch<Produto>(`/tenants/${tenantId}/produtos/${id}`, data)
}

export async function excluirProduto(
  tenantId: string,
  id: string,
): Promise<void> {
  return api.delete(`/tenants/${tenantId}/produtos/${id}`)
}
