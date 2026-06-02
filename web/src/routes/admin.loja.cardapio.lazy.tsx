import { createLazyFileRoute } from '@tanstack/react-router'
import { Card, Button } from '../components/ui'
import { useAuth } from '../lib/auth-context'
import { Plus } from 'lucide-react'
import type { TenantUser } from '../types'

export const Route = createLazyFileRoute('/admin/loja/cardapio')({
  component: CardapioPage,
})

function CardapioPage() {
  const { user } = useAuth()
  const tenantId =
    user && 'tenantId' in user ? (user as TenantUser).tenantId : ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Cardápio</h1>
        <Button icon={Plus}>Novo Produto</Button>
      </div>
      <Card>
        <p className="text-white/60 text-sm">
          {tenantId
            ? 'Gerencie os produtos do seu cardápio.'
            : 'Selecione uma loja para gerenciar o cardápio.'}
        </p>
      </Card>
    </div>
  )
}
