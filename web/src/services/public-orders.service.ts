import { api } from '../lib/api-client'
import type { Order } from './orders.service'

export async function createPublicOrder(slug: string, data: {
  customerName?: string
  customerPhone?: string
  notes?: string
  items: {
    productId?: string
    productName: string
    quantity: number
    price: number
    notes?: string
    addons?: { addonName: string; addonPrice: number; groupName: string }[]
  }[]
}): Promise<Order> {
  return api.post<Order>(`/public/${slug}/orders`, data)
}

export async function listPublicOrders(slug: string, phone: string): Promise<Order[]> {
  return api.get<Order[]>(`/public/${slug}/orders?phone=${encodeURIComponent(phone)}`)
}

export async function getPublicOrder(slug: string, id: string): Promise<Order> {
  return api.get<Order>(`/public/${slug}/orders/${id}`)
}
