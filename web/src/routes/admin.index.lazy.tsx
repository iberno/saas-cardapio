import { createLazyFileRoute } from '@tanstack/react-router'
import { useAuth } from '../lib/auth-context'
import { Card } from '../components/ui'
import { Store, Package } from 'lucide-react'
import type { PlatformUser } from '../types'

export const Route = createLazyFileRoute('/admin/')({
  component: PlatformDashboard,
})

function PlatformDashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      <p className="text-white/60">
        Bem-vindo, {user ? (user as PlatformUser).email : ''}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <Store className="text-accent" size={24} />
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-sm text-white/60">Lojas Ativas</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Package className="text-accent" size={24} />
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-sm text-white/60">Total de Produtos</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
