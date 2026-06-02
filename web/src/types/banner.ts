export interface Banner {
  id: string
  imagemUrl: string
  titulo: string | null
  linkUrl: string | null
  ordem: number
  ativo: boolean
}

export interface CreateBannerRequest {
  imagemUrl: string
  titulo?: string
  linkUrl?: string
}

export interface UpdateBannerRequest {
  imagemUrl?: string
  titulo?: string
  linkUrl?: string
  ativo?: boolean
}
