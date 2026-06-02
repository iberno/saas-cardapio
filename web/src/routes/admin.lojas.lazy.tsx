import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { listarTenants, criarTenant, atualizarStatusTenant } from '../services/tenants.service'
import { Card, Button, Badge, Spinner, Input } from '../components/ui'
import { Plus, X, Check } from 'lucide-react'
import type { Tenant, CreateTenantRequest } from '../types'

export const Route = createLazyFileRoute('/admin/lojas')({
  component: LojasPage,
})

function LojasPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateTenantRequest>({ name: '', subdomain: '' })

  const load = () => {
    setLoading(true)
    listarTenants()
      .then((res) => setTenants(res))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    await criarTenant(form)
    setShowForm(false)
    setForm({ name: '', subdomain: '' })
    load()
  }

  const toggleStatus = async (t: Tenant) => {
    const newStatus = t.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    await atualizarStatusTenant(t.id, { status: newStatus })
    load()
  }

  if (loading) return <Spinner size="lg" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Lojas</h1>
        <Button icon={Plus} onClick={() => setShowForm(true)}>Nova Loja</Button>
      </div>

      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Nova Loja</h3>
            <button onClick={() => setShowForm(false)} className="text-white/60 hover:text-white"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Subdomínio" value={form.subdomain} onChange={(e) => setForm({ ...form, subdomain: e.target.value })} placeholder="minha-loja" />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleCreate} icon={Check}>Criar</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {tenants.map((t) => (
          <Card key={t.id} className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">{t.name}</p>
              <p className="text-sm text-white/60">{t.subdomain}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge color={t.status === 'ACTIVE' ? 'success' : t.status === 'SUSPENDED' ? 'warning' : 'error'}>
                {t.status}
              </Badge>
              <button onClick={() => toggleStatus(t)} className="btn btn-ghost btn-xs">
                {t.status === 'ACTIVE' ? 'Suspender' : 'Ativar'}
              </button>
            </div>
          </Card>
        ))}
        {tenants.length === 0 && (
          <Card><p className="text-white/60 text-sm text-center">Nenhuma loja encontrada.</p></Card>
        )}
      </div>
    </div>
  )
}
