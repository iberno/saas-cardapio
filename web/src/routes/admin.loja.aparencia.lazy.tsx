import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth-context'
import { getTheme, updateTheme } from '../services/theme.service'
import { Card, Button, Spinner } from '../components/ui'
import { Save } from 'lucide-react'
import type { StoreTheme, TenantUser } from '../types'

const COLOR_FIELDS: { key: keyof StoreTheme; label: string }[] = [
  { key: 'primary', label: 'Primária' },
  { key: 'primaryContent', label: 'Texto na Primária' },
  { key: 'secondary', label: 'Secundária' },
  { key: 'secondaryContent', label: 'Texto na Secundária' },
  { key: 'accent', label: 'Destaque' },
  { key: 'accentContent', label: 'Texto no Destaque' },
  { key: 'neutral', label: 'Neutra' },
  { key: 'neutralContent', label: 'Texto na Neutra' },
  { key: 'base100', label: 'Fundo' },
  { key: 'base200', label: 'Fundo 2' },
  { key: 'base300', label: 'Fundo 3' },
  { key: 'baseContent', label: 'Texto Principal' },
]

export const Route = createLazyFileRoute('/admin/loja/aparencia')({
  component: AppearancePage,
})

function AppearancePage() {
  const { user } = useAuth()
  const tenantId = user && 'tenantId' in user ? (user as TenantUser).tenantId : ''
  const [theme, setTheme] = useState<StoreTheme>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!tenantId) return
    getTheme(tenantId)
      .then(setTheme)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tenantId])

  const handleSave = async () => {
    if (!tenantId) return
    setSaving(true)
    try {
      await updateTheme(tenantId, theme)
    } catch {}
    setSaving(false)
  }

  const setColor = (key: keyof StoreTheme, value: string) => {
    setTheme((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) return <Spinner size="lg" />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Aparência da Loja</h1>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COLOR_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <label className="text-sm opacity-60 block mb-1">{label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme[key] || '#000000'}
                  onChange={(e) => setColor(key, e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-base-300"
                />
                <input
                  type="text"
                  value={theme[key] || ''}
                  onChange={(e) => setColor(key, e.target.value)}
                  className="input input-sm w-full"
                  placeholder="#000000"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Button onClick={handleSave} loading={saving} icon={Save}>Salvar</Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-4">Pré-visualização</h3>
        <div
          className="rounded-xl p-6 space-y-3"
          style={{
            backgroundColor: theme.base100 || '#1e1e2d',
            color: theme.baseContent || '#cdd2da',
          }}
        >
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-lg text-sm font-medium" style={{ backgroundColor: theme.primary || '#763d6e', color: theme.primaryContent || '#fff' }}>Botão</span>
            <span className="px-3 py-1 rounded-lg text-sm font-medium" style={{ backgroundColor: theme.secondary || '#d4555a', color: theme.secondaryContent || '#fff' }}>Secundário</span>
            <span className="px-3 py-1 rounded-lg text-sm font-medium" style={{ backgroundColor: theme.accent || '#2d865b', color: theme.accentContent || '#fff' }}>Destaque</span>
          </div>
          <p className="text-sm">Texto de exemplo com a cor <span style={{ color: theme.primary }}>primária</span> e <span style={{ color: theme.accent }}>destaque</span>.</p>
        </div>
      </Card>
    </div>
  )
}
