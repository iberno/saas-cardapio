import { api } from '../lib/api-client'

export interface OrderItemAddon {
  id: string
  addonName: string
  addonPrice: number
  groupName: string
}

export interface OrderItem {
  id: string
  productId: string | null
  productName: string
  quantity: number
  price: number
  notes: string | null
  addons: OrderItemAddon[]
}

export interface OrderCustomer {
  id: string
  name: string | null
  phone: string
  address: string | null
  points: number
}

export interface Order {
  id: string
  tenantId: string
  customerId: string | null
  status: OrderStatus
  total: string
  customerName: string | null
  customerPhone: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  customer: OrderCustomer | null
}

export type OrderStatus = 'PENDING' | 'PREPARING' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED'

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendente',
  PREPARING: 'Preparando',
  DELIVERING: 'Saiu para entrega',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
}

export const STATUS_FLOW: OrderStatus[] = ['PENDING', 'PREPARING', 'DELIVERING', 'DELIVERED']

export async function listarOrders(tenantId: string, status?: string): Promise<Order[]> {
  const params = status ? `?status=${status}` : ''
  return api.get<Order[]>(`/tenants/${tenantId}/orders${params}`)
}

export async function getOrder(tenantId: string, id: string): Promise<Order> {
  return api.get<Order>(`/tenants/${tenantId}/orders/${id}`)
}

export async function createOrder(tenantId: string, data: {
  customerId?: string
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
  return api.post<Order>(`/tenants/${tenantId}/orders`, data)
}

export async function updateOrderStatus(tenantId: string, id: string, status: OrderStatus): Promise<Order> {
  return api.put<Order>(`/tenants/${tenantId}/orders/${id}/status`, { status })
}

export async function cancelOrder(tenantId: string, id: string): Promise<Order> {
  return api.put<Order>(`/tenants/${tenantId}/orders/${id}/cancel`)
}
