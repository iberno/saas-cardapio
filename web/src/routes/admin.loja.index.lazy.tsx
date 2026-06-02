import { createLazyFileRoute } from '@tanstack/react-router'
import { useAuth } from '../lib/auth-context'
import { Card } from '../components/ui'
import { Package } from 'lucide-react'
import type { TenantUser } from '../types'

export const Route = createLazyFileRoute('/admin/loja/')({
  component: StoreDashboard,
})

function StoreDashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Minha Loja</h1>
      <p className="text-white/60">
        Bem-vindo, {user && 'name' in user ? (user as TenantUser).name : ''}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <Package className="text-accent" size={24} />
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-sm text-white/60">Produtos</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
