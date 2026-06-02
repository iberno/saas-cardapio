import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api-client'
import type { StoreTheme } from '../types'
import { Phone } from 'lucide-react'

interface PublicProdutoVariante {
  id: string
  nome: string
  preco: number
}

interface PublicGrupoItem {
  id: string
  nome: string
  preco: number
}

interface PublicGrupo {
  id: string
  nome: string
  maxSelect: number
  ordem: number
  itens: PublicGrupoItem[]
}

interface PublicProduto {
  id: string
  nome: string
  descricao: string | null
  preco: number
  disponivel: boolean
  destaque: boolean
  imagemUrl: string | null
  exibirPrecoAPartirDe: boolean
  categoriaCardapio: { id: string; nome: string } | null
  variantes: PublicProdutoVariante[]
  grupos: PublicGrupo[]
}

interface PublicBanner {
  id: string
  imagemUrl: string
  titulo: string | null
  linkUrl: string | null
  ordem: number
  ativo: boolean
}

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
  const [produtos, setProdutos] = useState<PublicProduto[]>([])
  const [banners, setBanners] = useState<PublicBanner[]>([])
  const [loja, setLoja] = useState<LojaInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<PublicProduto | null>(null)
  const [selectedVarianteId, setSelectedVarianteId] = useState<string | null>(null)
  const [selectedGrupoItens, setSelectedGrupoItens] = useState<Map<string, Set<string>>>(new Map())
  const [addedToCart, setAddedToCart] = useState(false)

  const modalRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    Promise.all([
      api.get<{ data: PublicProduto[] }>(`/public/${slug}/produtos`),
      api.get<LojaInfo | null>(`/public/${slug}/loja`),
      api.get<PublicBanner[]>(`/public/${slug}/banners`),
    ])
      .then(([p, l, b]) => {
        setProdutos(p.data)
        setLoja(l)
        setBanners(b)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  const t = loja?.theme || {}

  const openModal = (produto: PublicProduto) => {
    setSelectedProduct(produto)
    setSelectedVarianteId(produto.variantes[0]?.id || null)
    setSelectedGrupoItens(new Map())
    setAddedToCart(false)
    modalRef.current?.showModal()
  }

  const closeModal = () => {
    modalRef.current?.close()
    setSelectedProduct(null)
  }

  const toggleGrupoItem = (grupoId: string, itemId: string, maxSelect: number) => {
    setSelectedGrupoItens((prev) => {
      const next = new Map(prev)
      const current = new Set(next.get(grupoId) || [])
      if (current.has(itemId)) {
        current.delete(itemId)
      } else {
        if (maxSelect === 1) {
          next.set(grupoId, new Set([itemId]))
          return next
        }
        if (current.size >= maxSelect) return prev
        current.add(itemId)
      }
      if (current.size === 0) {
        next.delete(grupoId)
      } else {
        next.set(grupoId, current)
      }
      return next
    })
  }

  const grouped = new Map<string, PublicProduto[]>()
  for (const p of produtos) {
    const catName = p.categoriaCardapio?.nome || 'Sem categoria'
    const arr = grouped.get(catName) || []
    arr.push(p)
    grouped.set(catName, arr)
  }
  const sortedGroups = [...grouped.entries()].sort(([a], [b]) => {
    if (a === 'Sem categoria') return 1
    if (b === 'Sem categoria') return -1
    return a.localeCompare(b)
  })

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ backgroundColor: t.base100 || '#faf5f0' }}>
        <span className="loading loading-spinner loading-lg" />
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
        {banners.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {banners.map((b) => (
              <img
                key={b.id}
                src={b.imagemUrl}
                alt={b.titulo || ''}
                className="h-48 rounded-xl object-cover shrink-0"
              />
            ))}
          </div>
        )}

        {produtos.length === 0 ? (
          <p className="text-center text-sm opacity-60">Cardápio em breve</p>
        ) : (
          sortedGroups.map(([catName, items]) => (
            <div key={catName}>
              <h2 className="font-bold text-lg mb-3 flex items-center gap-2" style={{ color: t.primary }}>
                <span className="w-1 h-5 rounded-full" style={{ backgroundColor: t.accent }} />
                {catName}
              </h2>
              <div className="space-y-2">
                {items.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: t.base200 || '#f0e8e0' }}
                    onClick={() => openModal(p)}
                  >
                    {p.imagemUrl && (
                      <img
                        src={p.imagemUrl}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium" style={{ color: t.baseContent }}>{p.nome}</p>
                        {p.destaque && <span className="badge badge-warning badge-sm">Destaque</span>}
                        {p.disponivel && <span className="badge badge-success badge-sm">Disponível</span>}
                      </div>
                      {p.descricao && <p className="text-xs mt-0.5 opacity-60 truncate">{p.descricao}</p>}
                      <span className="font-bold text-sm" style={{ color: t.accent }}>
                        {(p.variantes.length > 0 || p.exibirPrecoAPartirDe) && 'a partir de '}
                        R$ {Number(p.preco).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      <dialog ref={modalRef} className="modal" onClick={(e) => { if (e.target === modalRef.current) closeModal() }}>
        <div className="modal-box max-w-lg p-0 overflow-hidden">
          {selectedProduct && (() => {
            const selectedVariante = selectedProduct.variantes.find((v) => v.id === selectedVarianteId)
            const precoBase = selectedVariante?.preco ?? selectedProduct.preco ?? 0
            let totalExtra = 0
            for (const [gId, itemIds] of selectedGrupoItens) {
              const grupo = selectedProduct.grupos.find((g) => g.id === gId)
              if (!grupo) continue
              for (const iId of itemIds) {
                const item = grupo.itens.find((i) => i.id === iId)
                if (item) totalExtra += Number(item.preco)
              }
            }
            const total = precoBase + totalExtra

            const buildWhatsAppMessage = () => {
              let msg = `Olá! Gostaria de pedir:\n\n*${selectedProduct.nome}*`
              if (selectedVariante) {
                msg += `\n- ${selectedVariante.nome}`
              }
              for (const [gId, itemIds] of selectedGrupoItens) {
                const grupo = selectedProduct.grupos.find((g) => g.id === gId)
                if (!grupo) continue
                for (const iId of itemIds) {
                  const item = grupo.itens.find((i) => i.id === iId)
                  if (item) msg += `\n- ${grupo.nome}: ${item.nome}`
                }
              }
              msg += `\n\nTotal: R$ ${total.toFixed(2)}`
              return encodeURIComponent(msg)
            }

            return (
              <>
                {selectedProduct.imagemUrl && (
                  <img
                    src={selectedProduct.imagemUrl}
                    alt={selectedProduct.nome}
                    className="w-full h-64 object-cover"
                  />
                )}
                <div className="p-6 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-xl font-bold">{selectedProduct.nome}</h3>
                      {selectedProduct.destaque && <span className="badge badge-warning badge-sm">Destaque</span>}
                    </div>
                    {selectedProduct.descricao && (
                      <p className="text-sm opacity-60">{selectedProduct.descricao}</p>
                    )}
                  </div>

                  {selectedProduct.variantes.length > 0 && (
                    <div>
                      <p className="font-semibold text-sm mb-2">Opções</p>
                      <div className="join flex-wrap">
                        {selectedProduct.variantes.map((v) => (
                          <input
                            key={v.id}
                            className="join-item btn btn-sm"
                            type="radio"
                            name="variante"
                            aria-label={`${v.nome} - R$ ${Number(v.preco).toFixed(2)}`}
                            checked={selectedVarianteId === v.id}
                            onChange={() => setSelectedVarianteId(v.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProduct.grupos.map((g) => (
                    <div key={g.id}>
                      <p className="font-semibold text-sm mb-2">
                        {g.nome}
                        {g.maxSelect > 1 && (
                          <span className="font-normal opacity-50 ml-1">(máx. {g.maxSelect})</span>
                        )}
                      </p>
                      <div className="space-y-1">
                        {g.itens.map((item) => {
                          const isSelected = selectedGrupoItens.get(g.id)?.has(item.id) || false
                          return (
                            <label
                              key={item.id}
                              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors hover:bg-black/5 ${
                                isSelected ? 'bg-primary/10' : ''
                              }`}
                              style={{
                                backgroundColor: isSelected ? `${t.primary}15` : undefined,
                              }}
                            >
                              <div className="flex items-center gap-2">
                                {g.maxSelect === 1 ? (
                                  <input
                                    type="radio"
                                    name={`grupo-${g.id}`}
                                    className="radio radio-sm"
                                    checked={isSelected}
                                    onChange={() => toggleGrupoItem(g.id, item.id, g.maxSelect)}
                                  />
                                ) : (
                                  <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm"
                                    checked={isSelected}
                                    onChange={() => toggleGrupoItem(g.id, item.id, g.maxSelect)}
                                  />
                                )}
                                <span className="text-sm">{item.nome}</span>
                              </div>
                              {Number(item.preco) > 0 && (
                                <span className="text-sm font-semibold">
                                  +R$ {Number(item.preco).toFixed(2)}
                                </span>
                              )}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-2 border-t border-base-300">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-lg" style={{ color: t.accent }}>
                      R$ {total.toFixed(2)}
                    </span>
                  </div>

                  <button
                    className="btn w-full text-white font-semibold"
                    style={{ backgroundColor: t.primary, borderColor: t.primary }}
                    onClick={() => {
                      setAddedToCart(true)
                      setTimeout(() => setAddedToCart(false), 2000)
                    }}
                  >
                    {addedToCart ? '✓ Adicionado!' : 'Adicionar ao carrinho'}
                  </button>

                  {loja.contactPhone && (
                    <a
                      href={`https://wa.me/${loja.contactPhone.replace(/\D/g, '')}?text=${buildWhatsAppMessage()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn w-full flex items-center gap-2 shadow-lg rounded-xl text-white font-semibold"
                      style={{ backgroundColor: '#25D366' }}
                    >
                      <Phone size={18} />
                      Pedir pelo WhatsApp
                    </a>
                  )}
                </div>
              </>
            )
          })()}
        </div>
      </dialog>

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
