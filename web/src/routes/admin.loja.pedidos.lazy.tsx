import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../lib/auth-context'
import { listarOrders, updateOrderStatus, cancelOrder, getOrder, type Order, type OrderStatus, STATUS_LABELS, STATUS_FLOW } from '../services/orders.service'
import { getSettings, type StoreSettings } from '../services/settings.service'
import { playNewOrderSound } from '../lib/sound'
import { printReceipt } from '../lib/print-receipt'
import { ChefHat, Printer, XCircle, RefreshCw } from 'lucide-react'

export const Route = createLazyFileRoute('/admin/loja/pedidos')({
  component: PedidosPage,
})

function PedidosPage() {
  const { user } = useAuth()
  const tenantId = user && 'tenantId' in user ? user.tenantId : null

  const [orders, setOrders] = useState<Order[]>([])
  const [store, setStore] = useState<StoreSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const prevCount = useRef(0)

  const load = useCallback(() => {
    if (!tenantId) return
    listarOrders(tenantId, statusFilter || undefined).then((data) => {
      if (data.length > prevCount.current && prevCount.current > 0) {
        playNewOrderSound()
      }
      prevCount.current = data.length
      setOrders(data)
    }).finally(() => setLoading(false))
  }, [tenantId, statusFilter])

  useEffect(() => {
    load()
    const interval = setInterval(load, 8000)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    if (!tenantId) return
    getSettings(tenantId).then(setStore).catch(() => {})
  }, [tenantId])

  const handleStatus = async (order: Order, newStatus: OrderStatus) => {
    if (!tenantId) return
    try {
      await updateOrderStatus(tenantId, order.id, newStatus)
      load()
    } catch {}
  }

  const handleCancel = async (order: Order) => {
    if (!tenantId) return
    try {
      await cancelOrder(tenantId, order.id)
      load()
    } catch {}
  }

  const handlePrint = async (order: Order) => {
    const full = selectedOrder?.id === order.id ? selectedOrder : await getOrder(tenantId!, order.id)
    setSelectedOrder(full)
    printReceipt({
      id: full.id,
      total: full.total,
      created_at: full.createdAt,
      user_name: full.customer?.name || full.customerName,
      user_phone: full.customer?.phone || full.customerPhone,
      user_address: full.customer?.address || null,
      items: full.items.map((i) => ({
        product_name: i.productName,
        quantity: i.quantity,
        price: Number(i.price),
        addons: i.addons.map((a) => ({
          addon_name: a.addonName,
          addon_price: Number(a.addonPrice),
          group_name: a.groupName,
        })),
        notes: i.notes,
      })),
    }, {
      name: store?.name,
      phone: store?.contactPhone,
      address: store?.address,
    })
  }

  const nextStatus = (current: OrderStatus): OrderStatus | null => {
    if (current === 'CANCELLED' || current === 'DELIVERED') return null
    const idx = STATUS_FLOW.indexOf(current)
    return idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null
  }

  if (loading) {
    return <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg text-primary" /></div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <button onClick={load} className="btn btn-ghost btn-sm gap-1">
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setStatusFilter('')} className={`btn btn-sm ${!statusFilter ? 'btn-primary' : 'btn-ghost'}`}>Todos</button>
        {(['PENDING', 'PREPARING', 'DELIVERING', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}>
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-16 text-base-content/50">
          <ChefHat size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Nenhum pedido encontrado</p>
          <p className="text-sm">Os pedidos feitos pelos clientes aparecerão aqui</p>
        </div>
      )}

      <div className="space-y-3">
        {orders.map((order) => {
          const next = nextStatus(order.status)
          const canCancel = order.status !== 'CANCELLED' && order.status !== 'DELIVERED'
          const isExpanded = expandedId === order.id

          return (
            <div key={order.id} className={`card bg-base-200 border ${order.status === 'PENDING' ? 'border-primary/30' : 'border-base-300'}`}>
              <div className="card-body p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-base-content/50">#{order.id.slice(0, 8).toUpperCase()}</span>
                      <span className={`badge badge-sm ${
                        order.status === 'PENDING' ? 'badge-warning' :
                        order.status === 'PREPARING' ? 'badge-info' :
                        order.status === 'DELIVERING' ? 'badge-primary' :
                        order.status === 'DELIVERED' ? 'badge-success' :
                        'badge-ghost'
                      }`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <div className="mt-1">
                      <span className="font-medium">{order.customer?.name || order.customerName || '—'}</span>
                      <span className="text-base-content/50 text-sm ml-2">{order.customer?.phone || order.customerPhone}</span>
                    </div>
                    <div className="text-xs text-base-content/50 mt-0.5">
                      {new Date(order.createdAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold">R$ {Number(order.total).toFixed(2)}</div>
                    <div className="text-xs text-base-content/50">{order.items.reduce((s, i) => s + i.quantity, 0)} item(ns)</div>
                  </div>
                </div>

                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="text-xs text-primary hover:underline text-left mt-1"
                >
                  {isExpanded ? 'Esconder itens' : 'Ver itens'}
                </button>

                {isExpanded && (
                  <div className="mt-2 space-y-1.5 text-sm border-t border-base-300 pt-2">
                    {order.items.map((item) => (
                      <div key={item.id}>
                        <div className="flex justify-between">
                          <span>{item.quantity}x {item.productName}</span>
                          <span className="text-base-content/70">R$ {(Number(item.price) * item.quantity).toFixed(2)}</span>
                        </div>
                        {item.addons.map((a) => (
                          <div key={a.id} className="flex justify-between text-xs text-base-content/50 pl-3">
                            <span>{a.addonName}</span>
                            {Number(a.addonPrice) > 0 && <span>+R$ {Number(a.addonPrice).toFixed(2)}</span>}
                          </div>
                        ))}
                        {item.notes && <div className="text-xs text-base-content/50 pl-3">Obs: {item.notes}</div>}
                      </div>
                    ))}
                    {order.notes && (
                      <div className="text-xs text-base-content/50 pt-1 border-t border-base-300">
                        Observação: {order.notes}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 mt-3 flex-wrap">
                  {next && (
                    <button onClick={() => handleStatus(order, next)} className="btn btn-primary btn-sm gap-1">
                      <ChefHat size={14} /> {next === 'PREPARING' ? 'Iniciar Preparo' : next === 'DELIVERING' ? 'Saiu p/ Entrega' : 'Confirmar Entrega'}
                    </button>
                  )}
                  <button onClick={() => handlePrint(order)} className="btn btn-ghost btn-sm gap-1">
                    <Printer size={14} /> Imprimir
                  </button>
                  {canCancel && (
                    <button onClick={() => handleCancel(order)} className="btn btn-ghost btn-sm gap-1 text-error hover:text-error">
                      <XCircle size={14} /> Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
