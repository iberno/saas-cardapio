export interface ProdutoVariante {
  id: string
  produtoId: string
  nome: string
  preco: number
}

export interface CreateVarianteRequest {
  nome: string
  preco: number
}

export interface UpdateVarianteRequest {
  nome?: string
  preco?: number
}
