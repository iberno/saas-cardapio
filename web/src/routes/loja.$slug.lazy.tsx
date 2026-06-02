import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { api } from '../lib/api-client'
import { Spinner } from '../components/ui'
import type { Produto, StoreTheme } from '../types'
import { CATEGORIAS, CATEGORIA_LABEL } from '../types'
import { Phone } from 'lucide-react'

interface LojaInfo {
  id: string
  name: string
  slug: string
  theme: StoreTheme | null
  contactPhone: string | null
}

export const Route = createLazyFileRoute('/loja/$slug')({
  component: PublicCardapioPage,
})

function PublicCardapioPage() {
  const { slug } = Route.useParams()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loja, setLoja] = useState<LojaInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<{ data: Produto[] }>(`/public/${slug}/produtos`),
      api.get<LojaInfo | null>(`/public/${slug}/loja`),
    ])
      .then(([p, l]) => {
        setProdutos(p.data)
        setLoja(l)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  const t = loja?.theme || {}

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ backgroundColor: t.base100 || '#faf5f0' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (!loja) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ backgroundColor: t.base100 || '#faf5f0' }}>
        <p style={{ color: t.baseContent }}>Loja não encontrada</p>
      </div>
    )
  }

  return (
    <div
      className="min-h-dvh"
      style={{
        backgroundColor: t.base100 || '#faf5f0',
        color: t.baseContent || '#2c1810',
        '--color-primary': t.primary || '#763d6e',
        '--color-primary-content': t.primaryContent || '#ffffff',
        '--color-accent': t.accent || '#2d865b',
      } as React.CSSProperties}
    >
      <header
        className="sticky top-0 z-30 shadow-sm"
        style={{ backgroundColor: t.base100 || '#faf5f0', borderBottom: `1px solid ${t.base200 || '#f0e8e0'}` }}
      >
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-xl font-bold" style={{ color: t.primary }}>{loja.name}</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {produtos.length === 0 ? (
          <p className="text-center text-sm opacity-60">Cardápio em breve</p>
        ) : (
          CATEGORIAS.map((cat) => {
            const items = produtos.filter((p) => p.categoria === cat && p.disponivel)
            if (items.length === 0) return null
            return (
              <div key={cat}>
                <h2 className="font-bold text-lg mb-3 flex items-center gap-2" style={{ color: t.primary }}>
                  <span className="w-1 h-5 rounded-full" style={{ backgroundColor: t.accent }} />
                  {CATEGORIA_LABEL[cat]}
                </h2>
                <div className="space-y-2">
                  {items.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl p-4 flex items-center justify-between"
                      style={{ backgroundColor: t.base200 || '#f0e8e0' }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium" style={{ color: t.baseContent }}>{p.nome}</p>
                        {p.descricao && <p className="text-xs mt-0.5 opacity-60">{p.descricao}</p>}
                      </div>
                      <span className="font-bold text-sm ml-3" style={{ color: t.accent }}>
                        R$ {Number(p.preco).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </main>

      {loja.contactPhone && (
        <div className="sticky bottom-0 p-4">
          <a
            href={`https://wa.me/${loja.contactPhone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn w-full max-w-lg mx-auto flex items-center gap-2 shadow-lg rounded-xl text-white font-semibold"
            style={{ backgroundColor: t.primary || '#25D366' }}
          >
            <Phone size={18} />
            Pedir pelo WhatsApp
          </a>
        </div>
      )}
    </div>
  )
}
