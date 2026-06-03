import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { api } from '../lib/api-client'
import { listPublicOrders } from '../services/public-orders.service'
import { STATUS_LABELS, type Order } from '../services/orders.service'
import type { Customer, StoreTheme } from '../types'
import { ArrowLeft, ChefHat, Star, User } from 'lucide-react'

export const Route = createLazyFileRoute('/meus-pedidos')({
  component: MeusPedidosPage,
})

function MeusPedidosPage() {
  const [customer, setCustomer] = useState<Customer & { tenant?: { id: string; name: string; slug: string; theme: StoreTheme | null; contactPhone: string | null } } | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Customer & { tenant: any }>('/customer/auth/me')
      .then(async (data) => {
        setCustomer(data)
        if (data.tenant) {
          const phone = data.phone
          const ordersData = await listPublicOrders(data.tenant.slug, phone)
          setOrders(ordersData)
        }
      })
      .catch(() => setCustomer(null))
      .finally(() => setLoading(false))
  }, [])

  const t = customer?.tenant?.theme || {
    base100: '#282a36',
    base200: '#44475a',
    baseContent: '#f8f8f2',
    primary: '#bd93f9',
    primaryContent: '#282a36',
    accent: '#50fa7b',
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ backgroundColor: t.base100 }}>
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  if (!customer || !customer.tenant) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ backgroundColor: t.base100 }}>
        <div className="text-center space-y-4">
          <ChefHat size={48} className="mx-auto opacity-30" style={{ color: t.baseContent }} />
          <p style={{ color: t.baseContent }}>Faça login para ver seus pedidos</p>
          <Link to="/" className="btn btn-primary">Ir para o início</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh" style={{ backgroundColor: t.base100, color: t.baseContent }}>
      <header className="sticky top-0 z-30 shadow-sm" style={{ backgroundColor: t.base100, borderBottom: `1px solid ${t.base200}` }}>
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/loja/$slug" params={{ slug: customer.tenant.slug }} className="btn btn-ghost btn-sm gap-1">
            <ArrowLeft size={16} /> {customer.tenant.name}
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/minha-conta" className="btn btn-ghost btn-xs gap-1" title="Minha Conta">
              <User size={14} />
            </Link>
            <span className="text-sm opacity-80">{customer.name || customer.phone}</span>
            {customer.points > 0 && (
              <span className="flex items-center gap-1 text-sm" style={{ color: t.accent }}>
                <Star size={14} /> {customer.points}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-3">
        <h1 className="text-xl font-bold mb-4">Meus Pedidos</h1>

        {orders.length === 0 && (
          <div className="text-center py-16 opacity-50">
            <ChefHat size={48} className="mx-auto mb-3" />
            <p>Nenhum pedido ainda</p>
          </div>
        )}

        {orders.map((order) => (
          <div key={order.id} className="rounded-xl p-4 space-y-2" style={{ backgroundColor: t.base200 }}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className={`badge badge-sm ${
                  order.status === 'PENDING' ? 'badge-warning' :
                  order.status === 'PREPARING' ? 'badge-info' :
                  order.status === 'DELIVERING' ? 'badge-primary' :
                  order.status === 'DELIVERED' ? 'badge-success' :
                  'badge-ghost'
                }`}>
                  {STATUS_LABELS[order.status]}
                </span>
                <p className="text-xs opacity-50 mt-1">
                  {new Date(order.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">R$ {Number(order.total).toFixed(2)}</p>
                <p className="text-xs opacity-50">{order.items.reduce((s, i) => s + i.quantity, 0)} item(ns)</p>
              </div>
            </div>

            <div className="space-y-1 text-sm border-t pt-2" style={{ borderColor: t.base100 }}>
              {order.items.map((item) => (
                <div key={item.id}>
                  <div className="flex justify-between">
                    <span>{item.quantity}x {item.productName}</span>
                    <span className="opacity-60">R$ {(Number(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                  {item.addons.map((a) => (
                    <div key={a.id} className="flex justify-between text-xs opacity-40 pl-3">
                      <span>{a.addonName}</span>
                      {Number(a.addonPrice) > 0 && <span>+R$ {Number(a.addonPrice).toFixed(2)}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="border-t pt-2" style={{ borderColor: t.base100 }}>
              <div className="flex justify-between text-xs">
                <span className="opacity-50">Status</span>
                <span style={{ color: t.accent }}>{STATUS_LABELS[order.status]}</span>
              </div>
              {order.status === 'PENDING' && (
                <div className="w-full bg-base-300 rounded-full h-1.5 mt-1" style={{ backgroundColor: t.base100 }}>
                  <div className="bg-warning h-1.5 rounded-full" style={{ width: '10%' }} />
                </div>
              )}
              {order.status === 'PREPARING' && (
                <div className="w-full bg-base-300 rounded-full h-1.5 mt-1" style={{ backgroundColor: t.base100 }}>
                  <div className="bg-info h-1.5 rounded-full" style={{ width: '40%' }} />
                </div>
              )}
              {order.status === 'DELIVERING' && (
                <div className="w-full bg-base-300 rounded-full h-1.5 mt-1" style={{ backgroundColor: t.base100 }}>
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: '70%' }} />
                </div>
              )}
              {order.status === 'DELIVERED' && (
                <div className="w-full bg-base-300 rounded-full h-1.5 mt-1" style={{ backgroundColor: t.base100 }}>
                  <div className="bg-success h-1.5 rounded-full" style={{ width: '100%' }} />
                </div>
              )}
              {order.status === 'CANCELLED' && (
                <div className="w-full bg-base-300 rounded-full h-1.5 mt-1" style={{ backgroundColor: t.base100 }}>
                  <div className="bg-gray-500 h-1.5 rounded-full" style={{ width: '100%' }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
