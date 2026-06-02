export type Categoria = 'BEBIDAS' | 'ENTRADAS' | 'PRATOS' | 'SOBREMESAS'

export const CATEGORIAS: Categoria[] = [
  'BEBIDAS',
  'ENTRADAS',
  'PRATOS',
  'SOBREMESAS',
]

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  BEBIDAS: 'Bebidas',
  ENTRADAS: 'Entradas',
  PRATOS: 'Pratos',
  SOBREMESAS: 'Sobremesas',
}

export interface Produto {
  id: string
  nome: string
  descricao: string | null
  preco: number
  categoria: Categoria
  disponivel: boolean
  destaque: boolean
  imagemUrl: string | null
  tenantId: string
  createdAt: string
  updatedAt: string
}

export interface CreateProdutoRequest {
  nome: string
  descricao?: string
  preco: number
  categoria: Categoria
  disponivel?: boolean
  destaque?: boolean
  imagemUrl?: string
}

export interface UpdateProdutoRequest {
  nome?: string
  descricao?: string
  preco?: number
  categoria?: Categoria
  disponivel?: boolean
  destaque?: boolean
  imagemUrl?: string
}

export type Ordenacao = 'nome' | 'preco' | 'categoria' | 'criacao'

export interface PageResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
