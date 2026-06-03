import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../lib/auth-context'
import { listarProdutos } from '../services/produtos.service'
import { listarCategorias } from '../services/categorias.service'
import { listarOrders, STATUS_LABELS, type Order, type OrderStatus } from '../services/orders.service'
import { listarStaff } from '../services/staff.service'
import { Package, ShoppingCart, FolderTree, Users, DollarSign, TrendingUp } from 'lucide-react'
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton'
import type { TenantUser } from '../types'

export const Route = createLazyFileRoute('/admin/loja/')({
  component: StoreDashboard,
})

function StoreDashboard() {
  const { user } = useAuth()
  const tenantId = user && 'tenantId' in user ? (user as TenantUser).tenantId : ''

  const [totalProdutos, setTotalProdutos] = useState(0)
  const [totalCategorias, setTotalCategorias] = useState(0)
  const [totalStaff, setTotalStaff] = useState(0)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const [prod, cat, staffRes, ords] = await Promise.all([
        listarProdutos(tenantId, { limit: 1 }),
        listarCategorias(tenantId),
        listarStaff(tenantId),
        listarOrders(tenantId),
      ])
      setTotalProdutos(prod.total)
      setTotalCategorias(cat.length)
      setTotalStaff(staffRes.length)
      setOrders(ords)
    } catch {} finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => { loadData() }, [loadData])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayOrders = orders.filter((o) => new Date(o.createdAt) >= today)
  const todayRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.total as string), 0)
  const recentOrders = orders.slice(0, 5)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <CardSkeleton count={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Minha Loja</h1>
        <p className="opacity-60">
          Bem-vindo, {user && 'name' in user ? (user as TenantUser).name : ''}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-base-300 p-4 bg-base-100">
          <div className="flex items-center gap-3">
            <ShoppingCart className="text-primary" size={20} />
            <div>
              <p className="text-xl font-bold">{orders.length}</p>
              <p className="text-xs opacity-60">Total Pedidos</p>
            </div>
          </div>
          <p className="text-xs text-accent mt-1">{todayOrders.length} hoje</p>
        </div>
        <div className="rounded-xl border border-base-300 p-4 bg-base-100">
          <div className="flex items-center gap-3">
            <DollarSign className="text-success" size={20} />
            <div>
              <p className="text-xl font-bold">R$ {todayRevenue.toFixed(2)}</p>
              <p className="text-xs opacity-60">Faturamento hoje</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-base-300 p-4 bg-base-100">
          <div className="flex items-center gap-3">
            <Package className="text-accent" size={20} />
            <div>
              <p className="text-xl font-bold">{totalProdutos}</p>
              <p className="text-xs opacity-60">Produtos</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-base-300 p-4 bg-base-100">
          <div className="flex items-center gap-3">
            <FolderTree className="text-info" size={20} />
            <div>
              <p className="text-xl font-bold">{totalCategorias}</p>
              <p className="text-xs opacity-60">Categorias</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-base-300 p-4 bg-base-100">
          <div className="flex items-center gap-3">
            <Users className="text-warning" size={20} />
            <div>
              <p className="text-xl font-bold">{totalStaff}</p>
              <p className="text-xs opacity-60">Equipe</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-base-300 p-4 bg-base-100">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-accent" />
            Pedidos Recentes
          </h2>
          {recentOrders.length === 0 ? (
            <p className="text-sm opacity-60 text-center py-4">Nenhum pedido ainda</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between text-sm py-1 border-b border-base-200 last:border-0">
                  <div>
                    <span className="font-medium">{order.customerName || 'Anônimo'}</span>
                    <span className="text-xs opacity-50 ml-2">{new Date(order.createdAt).toLocaleTimeString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-70">R$ {parseFloat(order.total as string).toFixed(2)}</span>
                    <span className={`badge badge-sm ${
                      order.status === 'CANCELLED' ? 'badge-error' :
                      order.status === 'DELIVERED' ? 'badge-success' :
                      order.status === 'PREPARING' ? 'badge-warning' :
                      order.status === 'DELIVERING' ? 'badge-info' :
                      'badge-ghost'
                    }`}>{STATUS_LABELS[order.status as OrderStatus]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-base-300 p-4 bg-base-100">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <ShoppingCart size={16} className="text-accent" />
            Pedidos por Status
          </h2>
          {orders.length === 0 ? (
            <p className="text-sm opacity-60 text-center py-4">Nenhum pedido ainda</p>
          ) : (
            <div className="space-y-2">
              {(['PENDING', 'PREPARING', 'DELIVERING', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map((status) => {
                const count = orders.filter((o) => o.status === status).length
                const pct = orders.length > 0 ? (count / orders.length) * 100 : 0
                return (
                  <div key={status} className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span>{STATUS_LABELS[status]}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="w-full bg-base-300 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          status === 'CANCELLED' ? 'bg-error' :
                          status === 'DELIVERED' ? 'bg-success' :
                          status === 'PREPARING' ? 'bg-warning' :
                          status === 'DELIVERING' ? 'bg-info' :
                          'bg-accent'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
