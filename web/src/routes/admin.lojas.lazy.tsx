import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { listarTenants, criarTenant, atualizarStatusTenant } from '../services/tenants.service'
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

  if (loading) return <span className="loading loading-spinner loading-lg" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lojas</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} />Nova Loja</button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-base-300 p-6 bg-base-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Nova Loja</h3>
            <button onClick={() => setShowForm(false)} className="opacity-60 hover:opacity-100"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nome</legend>
              <input className="input w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Subdomínio</legend>
              <input className="input w-full" value={form.subdomain} onChange={(e) => setForm({ ...form, subdomain: e.target.value })} placeholder="minha-loja" />
            </fieldset>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn btn-primary" onClick={handleCreate}><Check size={16} />Criar</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {tenants.map((t) => (
          <div key={t.id} className="rounded-xl border border-base-300 p-6 bg-base-100 flex items-center justify-between">
            <div>
              <p className="font-semibold">{t.name}</p>
              <p className="text-sm opacity-60">{t.subdomain}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`badge ${t.status === 'ACTIVE' ? 'badge-success' : t.status === 'SUSPENDED' ? 'badge-warning' : 'badge-error'}`}>
                {t.status}
              </span>
              <button onClick={() => toggleStatus(t)} className="btn btn-ghost btn-xs">
                {t.status === 'ACTIVE' ? 'Suspender' : 'Ativar'}
              </button>
            </div>
          </div>
        ))}
        {tenants.length === 0 && (
          <div className="rounded-xl border border-base-300 p-6 bg-base-100"><p className="opacity-60 text-sm text-center">Nenhuma loja encontrada.</p></div>
        )}
      </div>
    </div>
  )
}
