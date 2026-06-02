import { api } from '../lib/api-client'
import type { Grupo, CreateGrupoRequest, UpdateGrupoRequest, CreateGrupoItemRequest, UpdateGrupoItemRequest } from '../types'

export async function listarGrupos(tenantId: string, produtoId: string): Promise<Grupo[]> {
  return api.get<Grupo[]>(`/tenants/${tenantId}/produtos/${produtoId}/grupos`)
}

export async function criarGrupo(tenantId: string, produtoId: string, data: CreateGrupoRequest): Promise<Grupo> {
  return api.post<Grupo>(`/tenants/${tenantId}/produtos/${produtoId}/grupos`, data)
}

export async function atualizarGrupo(tenantId: string, produtoId: string, id: string, data: UpdateGrupoRequest): Promise<Grupo> {
  return api.patch<Grupo>(`/tenants/${tenantId}/produtos/${produtoId}/grupos/${id}`, data)
}

export async function excluirGrupo(tenantId: string, produtoId: string, id: string): Promise<void> {
  return api.delete(`/tenants/${tenantId}/produtos/${produtoId}/grupos/${id}`)
}

export async function criarGrupoItem(tenantId: string, grupoId: string, data: CreateGrupoItemRequest): Promise<any> {
  return api.post(`/tenants/${tenantId}/grupos/${grupoId}/itens`, data)
}

export async function atualizarGrupoItem(tenantId: string, grupoId: string, id: string, data: UpdateGrupoItemRequest): Promise<any> {
  return api.patch(`/tenants/${tenantId}/grupos/${grupoId}/itens/${id}`, data)
}

export async function excluirGrupoItem(tenantId: string, grupoId: string, id: string): Promise<void> {
  return api.delete(`/tenants/${tenantId}/grupos/${grupoId}/itens/${id}`)
}
