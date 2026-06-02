export interface Categoria {
  id: string
  nome: string
  ordem: number
}

export interface CreateCategoriaRequest {
  nome: string
}

export interface UpdateCategoriaRequest {
  nome?: string
}
