export interface GrupoItem {
  id: string
  nome: string
  preco: number
}

export interface Grupo {
  id: string
  produtoId: string
  nome: string
  maxSelect: number
  ordem: number
  itens: GrupoItem[]
}

export interface CreateGrupoRequest {
  nome: string
  maxSelect?: number
}

export interface UpdateGrupoRequest {
  nome?: string
  maxSelect?: number
}

export interface CreateGrupoItemRequest {
  nome: string
  preco?: number
}

export interface UpdateGrupoItemRequest {
  nome?: string
  preco?: number
}
