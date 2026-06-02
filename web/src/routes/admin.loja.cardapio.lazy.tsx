import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth-context'
import { listarProdutos, criarProduto, atualizarProduto, excluirProduto } from '../services/produtos.service'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import type { Produto, CreateProdutoRequest, UpdateProdutoRequest, Categoria } from '../types'
import { CATEGORIAS, CATEGORIA_LABEL } from '../types'
import type { TenantUser } from '../types'

export const Route = createLazyFileRoute('/admin/loja/cardapio')({
  component: CardapioPage,
})

function CardapioPage() {
  const { user } = useAuth()
  const tenantId = user && 'tenantId' in user ? (user as TenantUser).tenantId : ''

  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState<CreateProdutoRequest>({
    nome: '', descricao: '', preco: 0, categoria: 'BEBIDAS',
  })

  const load = () => {
    if (!tenantId) return
    setLoading(true)
    listarProdutos(tenantId)
      .then((res) => setProdutos(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [tenantId])

  const resetForm = () => {
    setForm({ nome: '', descricao: '', preco: 0, categoria: 'BEBIDAS' })
    setEditId(null)
    setShowForm(false)
  }

  const openEdit = (p: Produto) => {
    setForm({ nome: p.nome, descricao: p.descricao || '', preco: Number(p.preco), categoria: p.categoria })
    setEditId(p.id)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!tenantId) return
    setError('')
    try {
      if (editId) {
        await atualizarProduto(tenantId, editId, form as UpdateProdutoRequest)
      } else {
        await criarProduto(tenantId, form)
      }
      resetForm()
      load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  const handleDelete = async (id: string) => {
    if (!tenantId || !confirm('Excluir produto?')) return
    await excluirProduto(tenantId, id)
    load()
  }

  const toggleDisponivel = async (p: Produto) => {
    if (!tenantId) return
    await atualizarProduto(tenantId, p.id, { disponivel: !p.disponivel })
    load()
  }

  if (!tenantId) {
    return (
      <div className="rounded-xl border border-base-300 p-6 bg-base-100"><p className="opacity-60">Faça login como usuário da loja.</p></div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cardápio</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true) }}>
          <Plus size={16} />Novo Produto
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-base-300 p-6 bg-base-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{editId ? 'Editar' : 'Novo'} Produto</h3>
            <button onClick={resetForm} className="opacity-60 hover:opacity-100"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nome</legend>
              <input className="input w-full" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Descrição</legend>
              <input className="input w-full" value={form.descricao || ''} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Preço (R$)</legend>
              <input className="input w-full" type="number" step="0.01" value={form.preco} onChange={(e) => setForm({ ...form, preco: Number(e.target.value) })} />
            </fieldset>
            <div>
              <label className="text-sm opacity-60 block mb-1">Categoria</label>
              <select
                className="select w-full"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value as Categoria })}
              >
                {CATEGORIAS.map((c) => <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn btn-primary" onClick={handleSave}><Check size={16} />Salvar</button>
            <button className="btn btn-ghost" onClick={resetForm}>Cancelar</button>
          </div>
        </div>
      )}

      {loading ? (
        <span className="loading loading-spinner loading-lg" />
      ) : produtos.length === 0 ? (
        <div className="rounded-xl border border-base-300 p-6 bg-base-100"><p className="opacity-60 text-center">Nenhum produto. Crie o primeiro!</p></div>
      ) : (
        <div className="grid gap-3">
          {CATEGORIAS.map((cat) => {
            const items = produtos.filter((p) => p.categoria === cat)
            if (items.length === 0) return null
            return (
              <div key={cat} className="rounded-xl border border-base-300 p-6 bg-base-100">
                <h3 className="text-accent font-semibold mb-3">{CATEGORIA_LABEL[cat]}</h3>
                <div className="divide-y divide-base-300">
                  {items.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${!p.disponivel ? 'line-through opacity-50' : ''}`}>{p.nome}</span>
                          {p.destaque && <span className="badge badge-info">Destaque</span>}
                        </div>
                        {p.descricao && <p className="text-xs opacity-50 mt-0.5">{p.descricao}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-accent">R$ {Number(p.preco).toFixed(2)}</span>
                        <button
                          onClick={() => toggleDisponivel(p)}
                          className={`btn btn-xs ${p.disponivel ? 'btn-success' : 'btn-ghost'}`}
                          title={p.disponivel ? 'Disponível' : 'Indisponível'}
                        >
                          {p.disponivel ? <Check size={14} /> : <X size={14} />}
                        </button>
                        <button onClick={() => openEdit(p)} className="btn btn-ghost btn-xs"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(p.id)} className="btn btn-ghost btn-xs text-error"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
