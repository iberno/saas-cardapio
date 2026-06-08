import { createLazyFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../lib/api-client'
import { useCustomerAuth } from '../lib/use-customer-auth'
import { getStoreOpenInfo } from '../lib/store-hours'
import type { StoreTheme } from '../types'
import { createPublicOrder } from '../services/public-orders.service'
import { ProductReviewStats } from '../components/ProductRating'
import { OrderStatusPoller } from '../components/OrderStatusPoller'
import {
  Phone, ShoppingCart, Trash2, X, User, LogOut, Star, ClipboardList,
  Search, Plus, Minus, MapPin, ExternalLink, Clock, CreditCard, Info,
  Check, Edit3, ChefHat,
} from 'lucide-react'

interface CartItem {
  key: string
  produto: PublicProduto
  quantities: Record<string, number>
  observacao: string
  hasCutlery: boolean
}

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
  settings: StoreSettingsData | null
}

interface StoreSettingsData {
  address: string
  instagram: string
  hoursText: string
  paymentMethods: string
  description: string
  logoUrl: string
}

export const Route = createLazyFileRoute('/loja/$slug')({
  component: PublicCardapioPage,
})

function PublicCardapioPage() {
  const { slug } = Route.useParams()
  const navigate = useNavigate()
  const [produtos, setProdutos] = useState<PublicProduto[]>([])
  const [banners, setBanners] = useState<PublicBanner[]>([])
  const [loja, setLoja] = useState<LojaInfo | null>(null)
  const [storeSettings, setStoreSettings] = useState<StoreSettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<PublicProduto | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [observacao, setObservacao] = useState('')
  const [hasCutlery, setHasCutlery] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartObservacao, setCartObservacao] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [showStoreInfo, setShowStoreInfo] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')

  const { customer, login, logout } = useCustomerAuth()
  const [loginPhone, setLoginPhone] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const loginModalRef = useRef<HTMLDialogElement>(null)

  const productModalRef = useRef<HTMLDivElement>(null)

  const getQty = (id: string) => quantities[id] || 0

  const incQty = (id: string) => {
    setQuantities((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
  }

  const decQty = (id: string) => {
    setQuantities((prev) => {
      const next = { ...prev }
      if ((next[id] || 0) <= 1) delete next[id]
      else next[id] = next[id] - 1
      return next
    })
  }

  let totalQtd = 0
  for (const q of Object.values(quantities)) totalQtd += q

  const storeOpenInfo = storeSettings?.hoursText ? getStoreOpenInfo(storeSettings.hoursText) : null

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
        setStoreSettings(l?.settings ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  const t = loja?.theme || {
    base100: '#282a36',
    base200: '#44475a',
    baseContent: '#f8f8f2',
    primary: '#bd93f9',
    primaryContent: '#282a36',
    accent: '#50fa7b',
  }

  const openProductModal = (produto: PublicProduto) => {
    setSelectedProduct(produto)
    const initial: Record<string, number> = {}
    if (produto.variantes.length === 1) {
      initial[produto.variantes[0].id] = 1
    }
    setQuantities(initial)
    setObservacao('')
    setHasCutlery(false)
  }

  const closeProductModal = () => {
    setSelectedProduct(null)
  }

  const addToCart = () => {
    if (!selectedProduct || totalQtd === 0) return
    setCart((prev) => [...prev, {
      key: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      produto: selectedProduct,
      quantities: { ...quantities },
      observacao,
      hasCutlery,
    }])
    closeProductModal()
  }

  const updateCartQty = (key: string, delta: number) => {
    setCart((prev) => {
      const item = prev.find((c) => c.key === key)
      if (!item) return prev
      if (delta < 0) {
        const firstKey = Object.keys(item.quantities)[0]
        const currentQty = item.quantities[firstKey] || 0
        if (currentQty <= 1) return prev.filter((c) => c.key !== key)
        return prev.map((c) => c.key === key ? { ...c, quantities: { ...c.quantities, [firstKey]: currentQty - 1 } } : c)
      }
      const firstKey = Object.keys(item.quantities)[0] || ''
      const currentQty = item.quantities[firstKey] || 0
      return prev.map((c) => c.key === key ? { ...c, quantities: { ...c.quantities, [firstKey]: currentQty + 1 } } : c)
    })
  }

  const [submitting, setSubmitting] = useState(false)

  const submitOrder = useCallback(async () => {
    if (!loja || cart.length === 0) return
    setSubmitting(true)
    try {
      const orderItems: {
        productId?: string
        productName: string
        quantity: number
        price: number
        notes?: string
        addons?: { addonName: string; addonPrice: number; groupName: string }[]
      }[] = []

      for (const item of cart) {
        const addons: { addonName: string; addonPrice: number; groupName: string }[] = []

        for (const v of item.produto.variantes) {
          const qty = item.quantities[v.id] || 0
          if (qty > 0) {
            orderItems.push({
              productId: item.produto.id,
              productName: `${item.produto.nome} - ${v.nome}`,
              quantity: qty,
              price: Number(v.preco),
              notes: item.observacao || undefined,
            })
          }
        }

        for (const g of item.produto.grupos) {
          for (const gi of g.itens) {
            const qty = item.quantities[gi.id] || 0
            if (qty > 0) {
              for (let i = 0; i < qty; i++) {
                addons.push({
                  addonName: `${g.nome}: ${gi.nome}`,
                  addonPrice: Number(gi.preco),
                  groupName: g.nome,
                })
              }
            }
          }
        }

        if (orderItems.length === 0 && addons.length === 0) {
          orderItems.push({
            productId: item.produto.id,
            productName: item.produto.nome,
            quantity: Object.values(item.quantities).reduce((a, b) => a + b, 0) || 1,
            price: Number(item.produto.preco),
            notes: item.observacao || undefined,
          })
        } else if (addons.length > 0) {
          const lastIdx = orderItems.length - 1
          if (lastIdx >= 0) {
            orderItems[lastIdx].addons = addons
          }
        }
      }

      await createPublicOrder(loja.slug, {
        customerName: customer?.name || customer?.phone || undefined,
        customerPhone: customer?.phone || undefined,
        notes: cartObservacao || undefined,
        items: orderItems,
      })
    } catch (err) {
      console.error('Erro ao criar pedido:', err)
    } finally {
      setSubmitting(false)
    }
  }, [loja, cart, cartObservacao, customer])

  const filteredProducts = produtos.filter((p) => {
    const matchCategory = !activeCategory || p.categoriaCardapio?.id === activeCategory
    const matchSearch = !search ||
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      (p.descricao && p.descricao.toLowerCase().includes(search.toLowerCase()))
    return matchCategory && matchSearch && p.disponivel
  })

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

  const cartCount = cart.reduce((sum, item) => {
    return sum + Object.values(item.quantities).reduce((a, b) => a + b, 0)
  }, 0)

  const calcCartTotal = () => {
    let total = 0
    for (const item of cart) {
      for (const v of item.produto.variantes) {
        const qty = item.quantities[v.id] || 0
        if (qty > 0) total += Number(v.preco) * qty
      }
      for (const g of item.produto.grupos) {
        for (const gi of g.itens) {
          const qty = item.quantities[gi.id] || 0
          if (qty > 0) total += Number(gi.preco) * qty
        }
      }
    }
    return total
  }

  const calcItemTotal = (item: CartItem) => {
    let total = 0
    for (const v of item.produto.variantes) {
      const qty = item.quantities[v.id] || 0
      if (qty > 0) total += Number(v.preco) * qty
    }
    for (const g of item.produto.grupos) {
      for (const gi of g.itens) {
        const qty = item.quantities[gi.id] || 0
        if (qty > 0) total += Number(gi.preco) * qty
      }
    }
    return total
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ backgroundColor: t.base100 }}>
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  if (!loja) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ backgroundColor: t.base100 }}>
        <p style={{ color: t.baseContent }}>Loja não encontrada</p>
      </div>
    )
  }

  return (
    <div
      className="min-h-dvh"
      data-theme={loja?.theme ? undefined : 'dracula'}
      style={{
        backgroundColor: t.base100,
        color: t.baseContent,
        '--color-primary': t.primary,
        '--color-primary-content': t.primaryContent,
        '--color-accent': t.accent,
      } as React.CSSProperties}
    >
      {/* ===== HEADER ===== */}
      <header
        className="sticky top-0 z-40 shadow-md"
        style={{ backgroundColor: t.primary, color: t.primaryContent }}
      >
        <div className="max-w-lg lg:max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {storeSettings?.logoUrl && (
              <img src={storeSettings.logoUrl} alt={loja.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
            )}
            <div className="min-w-0">
              <h1 className="font-bold text-base truncate">{loja.name}</h1>
              {storeOpenInfo && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${storeOpenInfo.isOpen ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-[10px] opacity-80">{storeOpenInfo.isOpen ? 'Aberto' : 'Fechado'}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {storeSettings?.instagram && (
              <a
                href={`https://instagram.com/${storeSettings.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-xs"
                title="Instagram"
              >
                <ExternalLink size={16} />
              </a>
            )}
            <button
              onClick={() => setShowStoreInfo(true)}
              className="btn btn-ghost btn-xs"
              title="Informações"
            >
              <Info size={16} />
            </button>
            {customer && (
              <>
                <Link to="/meus-pedidos" className="btn btn-ghost btn-xs" title="Meus Pedidos">
                  <ClipboardList size={16} />
                </Link>
                <Link to="/minha-conta" className="btn btn-ghost btn-xs" title="Minha Conta">
                  <User size={16} />
                </Link>
              </>
            )}
            {customer && customer.points > 0 && (
              <span className="flex items-center gap-1 text-xs font-medium" style={{ color: t.accent }}>
                <Star size={12} /> {customer.points}
              </span>
            )}
            <button
              onClick={() => setShowCart(true)}
              className="btn btn-ghost btn-sm relative"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="badge badge-sm badge-secondary absolute -top-1 -right-1 text-white font-bold">
                  {cartCount}
                </span>
              )}
            </button>
            {customer ? (
              <button onClick={logout} className="btn btn-ghost btn-xs" title="Sair">
                <LogOut size={16} />
              </button>
            ) : (
              <button onClick={() => loginModalRef.current?.showModal()} className="btn btn-ghost btn-xs" title="Entrar">
                <User size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ===== SEARCH + CATEGORIES ===== */}
      <div
        className="sticky top-[56px] z-30 shadow-sm"
        style={{ backgroundColor: t.base100, borderBottom: `1px solid ${t.base200}` }}
      >
        <div className="max-w-lg lg:max-w-6xl mx-auto px-4 pt-3 pb-2">
          <label className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: t.base200 }}>
            <Search size={18} className="opacity-40" />
            <input
              type="text"
              placeholder="Buscar no cardápio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="grow bg-transparent outline-none text-sm"
              style={{ color: t.baseContent }}
            />
          </label>
        </div>
        {sortedGroups.length > 0 && (
          <nav className="max-w-lg lg:max-w-6xl mx-auto overflow-x-auto px-4 pb-2">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveCategory('')}
                className={`btn btn-sm rounded-full px-4 ${!activeCategory ? 'btn-primary' : ''}`}
                style={!activeCategory ? {} : { backgroundColor: t.base200, color: t.baseContent }}
              >
                Todos
              </button>
              {sortedGroups.map(([catName]) => {
                const cat = produtos.find((p) => p.categoriaCardapio?.nome === catName)
                const catId = cat?.categoriaCardapio?.id
                return (
                  <button
                    key={catName}
                    onClick={() => setActiveCategory(catId || '')}
                    className={`btn btn-sm rounded-full px-4 whitespace-nowrap ${activeCategory === catId ? 'btn-primary' : ''}`}
                    style={activeCategory === catId ? {} : { backgroundColor: t.base200, color: t.baseContent }}
                  >
                    {catName}
                  </button>
                )
              })}
            </div>
          </nav>
        )}
      </div>

      {/* ===== BANNERS ===== */}
      {banners.length > 0 && (
        <div className="max-w-lg lg:max-w-6xl mx-auto px-4 py-4">
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-4 px-4">
            {banners.map((b) => (
              <a
                key={b.id}
                href={b.linkUrl || '#'}
                target={b.linkUrl ? '_blank' : undefined}
                rel={b.linkUrl ? 'noopener noreferrer' : undefined}
                className="snap-start shrink-0 w-[85vw] lg:w-[400px] rounded-2xl overflow-hidden shadow-sm"
              >
                <img
                  src={b.imagemUrl}
                  alt={b.titulo || ''}
                  className="w-full h-36 lg:h-48 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ===== SOBRE ===== */}
      {storeSettings?.description && (
        <div className="max-w-lg lg:max-w-6xl mx-auto px-4 pt-4">
          <div className="rounded-xl p-4" style={{ backgroundColor: t.base200 }}>
            <h2 className="font-bold text-sm mb-2 flex items-center gap-1.5" style={{ color: t.baseContent }}>
              <Info size={16} /> Sobre
            </h2>
            <p className="text-sm leading-relaxed opacity-70 whitespace-pre-line" style={{ color: t.baseContent }}>
              {storeSettings.description}
            </p>
          </div>
        </div>
      )}

      {/* ===== PRODUCTS ===== */}
      <main className="max-w-lg lg:max-w-6xl mx-auto px-4 py-4 pb-28">
        {filteredProducts.length === 0 ? (
          <p className="text-center opacity-40 py-12">Nenhum produto encontrado</p>
        ) : activeCategory ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                t={t}
                onOpen={openProductModal}
              />
            ))}
          </div>
        ) : (
          sortedGroups.map(([catName, items]) => {
            const catItems = items.filter((p) => {
              return !search || p.nome.toLowerCase().includes(search.toLowerCase()) ||
                (p.descricao && p.descricao.toLowerCase().includes(search.toLowerCase()))
            })
            if (catItems.length === 0) return null
            return (
              <div key={catName} className="mb-6">
                <h2 className="font-bold text-lg mb-3 flex items-center gap-2" style={{ color: t.baseContent }}>
                  <span className="w-1 h-5 rounded-full" style={{ backgroundColor: t.primary }} />
                  {catName}
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  {catItems.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      t={t}
                      slug={slug}
                      onOpen={openProductModal}
                    />
                  ))}
                </div>
              </div>
            )
          })
        )}
      </main>

      {/* ===== ADDON MODAL (bottom-sheet) ===== */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex flex-col lg:items-center lg:justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeProductModal} />
          <div
            ref={productModalRef}
            className="relative mt-auto lg:m-0 rounded-t-2xl lg:rounded-2xl max-h-[90vh] lg:max-h-[85vh] lg:max-w-xl lg:w-full flex flex-col shadow-xl"
            style={{ backgroundColor: t.base100 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b shrink-0" style={{ borderColor: t.base200 }}>
              <div className="flex items-center gap-3 min-w-0">
                {selectedProduct.imagemUrl && (
                  <img
                    src={selectedProduct.imagemUrl}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )}
                <div className="min-w-0">
                  <h2 className="font-bold text-base truncate">{selectedProduct.nome}</h2>
                  <p className="text-xs font-medium" style={{ color: t.primary }}>R$ {Number(selectedProduct.preco).toFixed(2)}</p>
                </div>
              </div>
              <button onClick={closeProductModal} className="btn btn-ghost btn-sm btn-square">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Variants */}
              {selectedProduct.variantes.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Tamanho</h3>
                  <div className="space-y-1.5">
                    {selectedProduct.variantes.map((v) => {
                      const qty = getQty(v.id)
                      return (
                        <div
                          key={v.id}
                          className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm"
                          style={{
                            backgroundColor: qty > 0 ? `${t.primary}15` : t.base200,
                            border: `1px solid ${qty > 0 ? `${t.primary}40` : 'transparent'}`,
                          }}
                        >
                          <span>{v.nome}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs opacity-60">R$ {Number(v.preco).toFixed(2)}</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => decQty(v.id)}
                                className="btn btn-ghost btn-xs btn-square"
                                style={{ color: qty > 0 ? undefined : 'inherit' }}
                              >
                                <Minus size={14} />
                              </button>
                              <span className="font-semibold text-sm w-5 text-center">{qty}</span>
                              <button
                                onClick={() => incQty(v.id)}
                                className="btn btn-ghost btn-xs btn-square"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Addon groups */}
              {selectedProduct.grupos.map((g) => {
                const selectedCount = g.itens.filter((gi) => getQty(gi.id) > 0).length
                return (
                  <div key={g.id}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm">{g.nome}</h3>
                      {g.maxSelect > 0 && (
                        <span className="text-xs opacity-40">{selectedCount}/{g.maxSelect}</span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {g.itens.map((gi) => {
                        const isSelected = getQty(gi.id) > 0
                        return (
                          <button
                            key={gi.id}
                            onClick={() => {
                              if (isSelected) {
                                setQuantities((prev) => {
                                  const next = { ...prev }
                                  delete next[gi.id]
                                  return next
                                })
                              } else {
                                if (g.maxSelect > 0 && selectedCount >= g.maxSelect) return
                                setQuantities((prev) => ({ ...prev, [gi.id]: 1 }))
                              }
                            }}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors"
                            style={{
                              backgroundColor: isSelected ? `${t.primary}15` : t.base200,
                              border: `1px solid ${isSelected ? `${t.primary}40` : 'transparent'}`,
                            }}
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                                style={{
                                  borderColor: isSelected ? t.primary : `${t.baseContent}30`,
                                  backgroundColor: isSelected ? t.primary : 'transparent',
                                }}
                              >
                                {isSelected && <Check size={12} style={{ color: t.primaryContent }} />}
                              </span>
                              {gi.nome}
                            </span>
                            {Number(gi.preco) > 0 && (
                              <span className="text-xs font-medium" style={{ color: t.primary }}>+R$ {Number(gi.preco).toFixed(2)}</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {/* Observação */}
              <div>
                <h3 className="font-semibold text-sm mb-2">Observação</h3>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className="textarea w-full rounded-xl text-sm"
                  style={{ backgroundColor: t.base200 }}
                  rows={3}
                  placeholder="Alguma observação?"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-4 space-y-3 shrink-0" style={{ borderColor: t.base200, backgroundColor: t.base100 }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => { if (totalQtd > 0) setQuantities((prev) => { const first = Object.keys(prev)[0]; if (!first) return prev; const q = prev[first]; if (q <= 1) return prev; return { ...prev, [first]: q - 1 } }) }} className="btn btn-ghost btn-sm btn-square">
                    <span className="text-lg font-bold">-</span>
                  </button>
                  <span className="font-semibold text-lg w-8 text-center">{totalQtd}</span>
                  <button onClick={() => { if (selectedProduct.variantes.length > 0) { incQty(selectedProduct.variantes[0].id) } else if (selectedProduct.grupos.length > 0 && selectedProduct.grupos[0].itens.length > 0) { incQty(selectedProduct.grupos[0].itens[0].id) } }} className="btn btn-ghost btn-sm btn-square">
                    <span className="text-lg font-bold">+</span>
                  </button>
                </div>
                <button
                  onClick={addToCart}
                  className="btn px-8 rounded-xl text-white font-semibold"
                  style={{ backgroundColor: t.primary }}
                  disabled={totalQtd === 0}
                >
                  Adicionar · R$ {(selectedProduct.variantes.reduce((s, v) => s + (getQty(v.id) > 0 ? Number(v.preco) * getQty(v.id) : 0), 0) + selectedProduct.grupos.reduce((s, g) => s + g.itens.reduce((s2, gi) => s2 + (getQty(gi.id) > 0 ? Number(gi.preco) * getQty(gi.id) : 0), 0), 0)).toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== CART DRAWER ===== */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex flex-col lg:flex-row lg:items-stretch lg:justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
          <div
            className="relative mt-auto lg:mt-0 rounded-t-2xl lg:rounded-t-none lg:rounded-l-2xl max-h-[85vh] lg:max-h-dvh lg:w-[420px] flex flex-col shadow-xl"
            style={{ backgroundColor: t.base100 }}
          >
            <div className="flex items-center justify-between p-4 border-b sticky top-0 shrink-0 z-10" style={{ borderColor: t.base200, backgroundColor: t.base100 }}>
              <h2 className="font-bold text-base">Seu carrinho</h2>
              <button onClick={() => setShowCart(false)} className="btn btn-ghost btn-sm btn-square">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <p className="text-center opacity-40 py-8 text-sm">Carrinho vazio</p>
              ) : (
                cart.map((item) => {
                  const itemTotal = calcItemTotal(item)
                  const variantNames = item.produto.variantes
                    .filter((v) => (item.quantities[v.id] || 0) > 0)
                    .map((v) => `${item.quantities[v.id]}x ${v.nome}`)
                    .join(', ')
                  const addonNames = item.produto.grupos.flatMap((g) =>
                    g.itens.filter((gi) => (item.quantities[gi.id] || 0) > 0)
                      .map((gi) => `${g.nome}: ${gi.nome}`)
                  )

                  return (
                    <div key={item.key} className="rounded-xl px-4 py-3" style={{ backgroundColor: t.base200 }}>
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{item.produto.nome}</p>
                          {variantNames && <p className="text-xs opacity-60 mt-0.5">{variantNames}</p>}
                          {addonNames.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {addonNames.map((name, i) => (
                                <span key={i} className="text-[10px] rounded-full px-1.5 py-0.5" style={{ backgroundColor: t.base300 || t.base200 }}>
                                  {name}
                                </span>
                              ))}
                            </div>
                          )}
                          {item.observacao && <p className="text-[10px] opacity-40 mt-0.5 italic">"{item.observacao}"</p>}
                          <p className="text-xs opacity-60 mt-0.5">R$ {itemTotal.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-3 shrink-0">
                          <button onClick={() => { setCart((prev) => prev.filter((c) => c.key !== item.key)); openProductModal(item.produto); setQuantities(item.quantities); setObservacao(item.observacao); setHasCutlery(item.hasCutlery) }} className="btn btn-ghost btn-xs btn-square" title="Editar">
                            <Edit3 size={12} />
                          </button>
                          <button onClick={() => updateCartQty(item.key, -1)} className="btn btn-ghost btn-xs btn-square opacity-40 hover:opacity-100">
                            <Minus size={14} />
                          </button>
                          <span className="font-semibold text-sm w-5 text-center">
                            {Object.values(item.quantities).reduce((a, b) => a + b, 0)}
                          </span>
                          <button onClick={() => updateCartQty(item.key, 1)} className="btn btn-ghost btn-xs btn-square opacity-40 hover:opacity-100">
                            <Plus size={14} />
                          </button>
                          <button onClick={() => setCart((prev) => prev.filter((c) => c.key !== item.key))} className="btn btn-ghost btn-xs btn-square opacity-40 hover:opacity-100">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Cart footer */}
            {cart.length > 0 && (
              <div className="border-t p-4 space-y-3 shrink-0" style={{ borderColor: t.base200, backgroundColor: t.base100 }}>
                <textarea
                  className="textarea textarea-sm w-full rounded-xl text-sm"
                  style={{ backgroundColor: t.base200 }}
                  placeholder="Observações gerais (ex: forma de pagamento, endereço...)"
                  rows={2}
                  value={cartObservacao}
                  onChange={(e) => setCartObservacao(e.target.value)}
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm opacity-60">Total</span>
                  <span className="font-bold text-base" style={{ color: t.primary }}>R$ {calcCartTotal().toFixed(2)}</span>
                </div>
                {loja.contactPhone ? (
                  <button
                    onClick={async () => {
                      if (submitting) return
                      const phone = loja.contactPhone
                      if (!phone) return

                      let msg = `Olá! Gostaria de pedir:\n`
                      for (const item of cart) {
                        msg += `\n*${item.produto.nome}*\n`
                        for (const v of item.produto.variantes) {
                          const qty = item.quantities[v.id] || 0
                          if (qty > 0) msg += `${qty}x ${v.nome} - R$ ${(Number(v.preco) * qty).toFixed(2)}\n`
                        }
                        for (const g of item.produto.grupos) {
                          for (const gi of g.itens) {
                            const qty = item.quantities[gi.id] || 0
                            if (qty > 0) msg += `${qty}x ${g.nome}: ${gi.nome} - R$ ${(Number(gi.preco) * qty).toFixed(2)}\n`
                          }
                        }
                        if (item.observacao) msg += `Obs: ${item.observacao}\n`
                        msg += `Item: R$ ${calcItemTotal(item).toFixed(2)}\n`
                      }
                      if (cartObservacao) msg += `\nObs: ${cartObservacao}`
                      msg += `\n\nTotal do pedido: R$ ${calcCartTotal().toFixed(2)}`

                      await submitOrder()
                      setCart([])
                      setCartObservacao('')
                      setShowCart(false)
                      window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
                      if (customer) navigate({ to: '/meus-pedidos' })
                    }}
                    className="btn w-full flex items-center gap-2 text-white font-semibold"
                    style={{ backgroundColor: '#25D366' }}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <><Phone size={18} /> Enviar pedido pelo WhatsApp</>
                    )}
                  </button>
                ) : (
                  <p className="text-xs text-center opacity-40">Loja sem telefone configurado</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== CART FLOATING BUTTON ===== */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-5 bg-gradient-to-t from-transparent pointer-events-none">
          <button
            onClick={() => setShowCart(true)}
            className="pointer-events-auto btn w-full max-w-lg lg:max-w-6xl mx-auto flex items-center justify-between shadow-lg rounded-xl"
            style={{ backgroundColor: t.primary, color: t.primaryContent }}
          >
            <span className="flex items-center gap-2">
              <ShoppingCart size={18} />
              Ver Carrinho ({cartCount})
            </span>
            <span>R$ {calcCartTotal().toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* ===== STORE INFO FOOTER ===== */}
      {storeSettings && (
        <footer className="mt-12 border-t pt-8 pb-12 px-4 max-w-lg lg:max-w-6xl mx-auto text-sm space-y-4" style={{ borderColor: t.base200, color: `${t.baseContent}99` }}>
          <h3 className="font-bold text-base" style={{ color: t.baseContent }}>{loja.name}</h3>
          {storeSettings.description && <p>{storeSettings.description}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {storeSettings.address && (
              <div className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 shrink-0" />
                <span>{storeSettings.address}</span>
              </div>
            )}
            {loja.contactPhone && (
              <div className="flex items-start gap-2">
                <Phone size={16} className="mt-0.5 shrink-0" />
                <span>{loja.contactPhone}</span>
              </div>
            )}
            {storeSettings.instagram && (
              <div className="flex items-start gap-2">
                <ExternalLink size={16} className="mt-0.5 shrink-0" />
                <a
                  href={`https://instagram.com/${storeSettings.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: t.primary }}
                >
                  {storeSettings.instagram}
                </a>
              </div>
            )}
            {storeSettings.hoursText && (
              <div className="flex items-start gap-2">
                <Clock size={16} className="mt-0.5 shrink-0" />
                <span className="whitespace-pre-line">{storeSettings.hoursText}</span>
              </div>
            )}
          </div>
          {storeSettings.paymentMethods && (
            <div className="flex items-start gap-2">
              <CreditCard size={16} className="mt-0.5 shrink-0" />
              <span className="whitespace-pre-line">{storeSettings.paymentMethods}</span>
            </div>
          )}
        </footer>
      )}

      {/* ===== STORE INFO MODAL ===== */}
      {showStoreInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowStoreInfo(false)} />
          <div className="relative w-full max-w-sm p-6 rounded-box shadow-xl" style={{ backgroundColor: t.base100 }}>
            <button onClick={() => setShowStoreInfo(false)} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              <X size={20} />
            </button>
            <div className="space-y-4">
              <h3 className="font-bold text-lg">{loja.name}</h3>
              {(() => {
                const hasInfo =
                  storeSettings?.description ||
                  storeSettings?.address ||
                  loja.contactPhone ||
                  storeSettings?.instagram ||
                  storeSettings?.hoursText ||
                  storeSettings?.paymentMethods;
                if (!hasInfo) {
                  return (
                    <p className="text-sm opacity-40 italic">
                      Nenhuma informação cadastrada ainda.
                    </p>
                  );
                }
                return (
                  <>
                    {storeSettings?.description && <p className="text-sm opacity-60">{storeSettings.description}</p>}
                    <div className="space-y-3">
                      {storeSettings?.address && (
                        <div className="flex items-start gap-3">
                          <MapPin size={18} className="mt-0.5 shrink-0" style={{ color: t.primary }} />
                          <span className="text-sm">{storeSettings.address}</span>
                        </div>
                      )}
                      {loja.contactPhone && (
                        <div className="flex items-start gap-3">
                          <Phone size={18} className="mt-0.5 shrink-0" style={{ color: t.primary }} />
                          <span className="text-sm">{loja.contactPhone}</span>
                        </div>
                      )}
                      {storeSettings?.instagram && (
                        <div className="flex items-start gap-3">
                          <ExternalLink size={18} className="mt-0.5 shrink-0" style={{ color: t.primary }} />
                          <a
                            href={`https://instagram.com/${storeSettings.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm hover:underline"
                            style={{ color: t.primary }}
                          >
                            {storeSettings.instagram}
                          </a>
                        </div>
                      )}
                      {storeSettings?.hoursText && (
                        <div className="flex items-start gap-3">
                          <Clock size={18} className="mt-0.5 shrink-0" style={{ color: t.primary }} />
                          <span className="text-sm whitespace-pre-line">{storeSettings.hoursText}</span>
                        </div>
                      )}
                    </div>
                    {storeSettings?.paymentMethods && (
                      <div className="flex items-start gap-3 pt-2 border-t" style={{ borderColor: t.base200 }}>
                        <CreditCard size={18} className="mt-0.5 shrink-0" style={{ color: t.primary }} />
                        <span className="text-sm whitespace-pre-line">{storeSettings.paymentMethods}</span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ===== LOGIN MODAL ===== */}
      <dialog ref={loginModalRef} className="modal" onClick={(e) => { if (e.target === loginModalRef.current) { loginModalRef.current?.close(); setLoginError('') } }}>
        <div className="modal-box max-w-sm" style={{ backgroundColor: t.base100 }}>
          <button onClick={() => { loginModalRef.current?.close(); setLoginError('') }} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
            <X size={20} />
          </button>
          <h3 className="font-bold text-lg mb-2">Entrar</h3>
          <p className="text-sm opacity-60 mb-4">Informe seu telefone para entrar ou se cadastrar</p>
          <form onSubmit={async (e) => {
            e.preventDefault()
            setLoginLoading(true)
            setLoginError('')
            try {
              await login(loginPhone, slug)
              loginModalRef.current?.close()
              setLoginPhone('')
            } catch (err: any) {
              setLoginError(err.message || 'Erro ao fazer login')
            } finally {
              setLoginLoading(false)
            }
          }} className="space-y-4">
            <label className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: t.base200 }}>
              <Phone size={18} className="opacity-40" />
              <input
                type="tel"
                className="grow bg-transparent outline-none text-sm"
                placeholder="Telefone com DDD"
                value={loginPhone}
                onChange={(e) => { setLoginPhone(e.target.value.replace(/\D/g, '')); setLoginError('') }}
                required
              />
            </label>
            {loginError && <p className="text-sm text-error text-center">{loginError}</p>}
            <button type="submit" className="btn w-full rounded-xl text-white font-semibold" style={{ backgroundColor: t.primary }} disabled={loginLoading || loginPhone.length < 10}>
              {loginLoading ? <span className="loading loading-spinner loading-xs" /> : 'Entrar'}
            </button>
          </form>
        </div>
      </dialog>

      {/* ===== ORDER STATUS POLLER ===== */}
      {customer?.phone && <OrderStatusPoller slug={slug} phone={customer.phone} />}
    </div>
  )
}

/* ===== Product Card Component ===== */
function ProductCard({ product: p, t, slug, onOpen }: {
  product: PublicProduto
  t: StoreTheme
  slug: string
  onOpen: (p: PublicProduto) => void
}) {
  const hasVariants = p.variantes.length > 0
  const displayPrice = hasVariants
    ? `a partir de R$ ${Math.min(...p.variantes.map((v) => Number(v.preco))).toFixed(2)}`
    : `R$ ${Number(p.preco).toFixed(2)}`

  return (
    <div
      className="flex rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
      style={{ backgroundColor: t.base200 }}
      onClick={() => onOpen(p)}
    >
      <div className="w-24 lg:w-32 h-24 lg:h-32 shrink-0 flex items-center justify-center" style={{ backgroundColor: t.base200 }}>
        {p.imagemUrl ? (
          <img
            src={p.imagemUrl}
            alt={p.nome}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <ChefHat size={28} className="opacity-20" />
        )}
      </div>
      <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{p.nome}</h3>
            {p.destaque && <span className="badge badge-warning badge-xs">Destaque</span>}
          </div>
          {p.descricao && (
            <p className="text-xs mt-0.5 opacity-60 line-clamp-2">{p.descricao}</p>
          )}
          <ProductReviewStats slug={slug} productId={p.id} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-sm" style={{ color: t.primary }}>{displayPrice}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(p) }}
            className="btn btn-sm btn-square"
            style={{ backgroundColor: t.primary, color: t.primaryContent }}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
