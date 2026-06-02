import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth-context'
import { api } from '../lib/api-client'
import { Store, Package } from 'lucide-react'
import type { PlatformUser } from '../types'

export const Route = createLazyFileRoute('/admin/')({
  component: PlatformDashboard,
})

function PlatformDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<{ activeTenants: number; totalProdutos: number } | null>(null)

  useEffect(() => {
    api.get<{ totalTenants: number; activeTenants: number; totalProdutos: number }>('/platform/tenants/stats')
      .then(setStats)
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="opacity-60">
        Bem-vindo, {user ? (user as PlatformUser).email : ''}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-base-300 p-6 bg-base-100">
          <div className="flex items-center gap-3">
            <Store className="text-accent" size={24} />
            <div>
              <p className="text-2xl font-bold">{stats?.activeTenants ?? '-'}</p>
              <p className="text-sm opacity-60">Lojas Ativas</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-base-300 p-6 bg-base-100">
          <div className="flex items-center gap-3">
            <Package className="text-accent" size={24} />
            <div>
              <p className="text-2xl font-bold">{stats?.totalProdutos ?? '-'}</p>
              <p className="text-sm opacity-60">Total de Produtos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
