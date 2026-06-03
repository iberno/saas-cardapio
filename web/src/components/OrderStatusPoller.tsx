import { useEffect, useRef } from 'react'
import { listPublicOrders } from '../services/public-orders.service'
import type { OrderStatus } from '../services/orders.service'

interface StatusPollerProps {
  slug: string
  phone: string
  onStatusChange?: (orderId: string, oldStatus: OrderStatus, newStatus: OrderStatus) => void
}

export function OrderStatusPoller({ slug, phone, onStatusChange }: StatusPollerProps) {
  const prevStatusMap = useRef<Record<string, OrderStatus>>({})

  useEffect(() => {
    if (!slug || !phone) return
    const interval = setInterval(async () => {
      try {
        const orders = await listPublicOrders(slug, phone)
        for (const order of orders) {
          const prev = prevStatusMap.current[order.id]
          if (prev && prev !== order.status) {
            onStatusChange?.(order.id, prev, order.status)
          }
          prevStatusMap.current[order.id] = order.status
        }
      } catch {}
    }, 10000)
    return () => clearInterval(interval)
  }, [slug, phone, onStatusChange])

  return null
}
