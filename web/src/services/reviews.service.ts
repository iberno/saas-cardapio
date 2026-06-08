import { api } from '../lib/api-client'

export interface Review {
  id: string
  productId: string
  customerId: string
  orderId: string | null
  rating: number
  comment: string | null
  createdAt: string
  customer: { name: string | null }
}

export interface ReviewStats {
  average: number
  total: number
  distribution: Record<number, number>
}

export interface ReviewResponse {
  reviews: Review[]
  stats: ReviewStats
}

export async function getProductReviews(slug: string, productId: string): Promise<ReviewResponse> {
  return api.get<ReviewResponse>(`/public/${slug}/produtos/${productId}/reviews`)
}

export async function createReview(data: {
  productId: string
  rating: number
  comment?: string
  orderId?: string
}): Promise<Review> {
  return api.post<Review>('/customer/reviews', data)
}

export async function getMyReviews(): Promise<Review[]> {
  return api.get<Review[]>('/customer/reviews')
}
