import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { listarTenants } from '../services/tenants.service'
import { Card, Button, Badge, Spinner } from '../components/ui'
import { Plus } from 'lucide-react'
import type { Tenant } from '../types'

export const Route = createLazyFileRoute('/admin/lojas')({
  component: LojasPage,
})

function LojasPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listarTenants()
      .then((res) => setTenants(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner size="lg" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Lojas</h1>
        <Button icon={Plus}>Nova Loja</Button>
      </div>
      <div className="grid gap-4">
        {tenants.map((t) => (
          <Card key={t.id} className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">{t.name}</p>
              <p className="text-sm text-white/60">{t.subdomain}</p>
            </div>
            <Badge
              color={
                t.status === 'ACTIVE'
                  ? 'success'
                  : t.status === 'SUSPENDED'
                    ? 'warning'
                    : 'error'
              }
            >
              {t.status}
            </Badge>
          </Card>
        ))}
        {tenants.length === 0 && (
          <Card>
            <p className="text-white/60 text-sm text-center">
              Nenhuma loja encontrada.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
