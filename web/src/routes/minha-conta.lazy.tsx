import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { api } from '../lib/api-client'
import type { Customer, StoreTheme } from '../types'
import { ArrowLeft, User, MapPin, Star, Save } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createLazyFileRoute('/minha-conta')({
  component: MinhaContaPage,
})

function MinhaContaPage() {
  const [customer, setCustomer] = useState<(Customer & { tenant?: { id: string; name: string; slug: string; theme: StoreTheme | null; contactPhone: string | null } }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')

  useEffect(() => {
    api.get<Customer & { tenant: any }>('/customer/auth/me')
      .then((data) => {
        setCustomer(data)
        setName(data.name || '')
        setAddress(data.address || '')
      })
      .catch(() => setCustomer(null))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await api.patch<Customer>('/customer/auth/profile', { name, address })
      setCustomer(prev => prev ? { ...prev, ...updated } : null)
      toast.success('Perfil atualizado')
    } catch {
      toast.error('Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }

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
          <User size={48} className="mx-auto opacity-30" style={{ color: t.baseContent }} />
          <p style={{ color: t.baseContent }}>Faça login para ver seu perfil</p>
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
          <span className="text-sm opacity-80">Minha Conta</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3 pb-4" style={{ borderBottom: `1px solid ${t.base200}` }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold" style={{ backgroundColor: t.primary, color: t.primaryContent }}>
            {(customer.name || customer.phone).charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-lg">{customer.name || 'Sem nome'}</p>
            <p className="text-sm opacity-60">{customer.phone}</p>
            {customer.points > 0 && (
              <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: t.accent }}>
                <Star size={12} /> {customer.points} pontos
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <User size={14} className="opacity-50" /> Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="input input-bordered w-full text-sm"
              style={{ backgroundColor: t.base200, borderColor: t.base200, color: t.baseContent }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <MapPin size={14} className="opacity-50" /> Endereço
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número, bairro, complemento..."
              rows={3}
              className="textarea textarea-bordered w-full text-sm resize-none"
              style={{ backgroundColor: t.base200, borderColor: t.base200, color: t.baseContent }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5 opacity-50">
              <Star size={14} /> Telefone
            </label>
            <input
              type="text"
              value={customer.phone}
              disabled
              className="input input-bordered w-full text-sm opacity-60"
              style={{ backgroundColor: t.base200, borderColor: t.base200, color: t.baseContent }}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn w-full gap-1.5"
          style={{ backgroundColor: t.primary, color: t.primaryContent, borderColor: t.primary }}
        >
          {saving ? <span className="loading loading-spinner loading-sm" /> : <Save size={16} />}
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>

        <Link
          to="/meus-pedidos"
          className="btn btn-ghost w-full gap-1.5 text-sm"
          style={{ color: t.baseContent }}
        >
          Ver meus pedidos
        </Link>
      </main>
    </div>
  )
}
