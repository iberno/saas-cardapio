import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth-context'
import { listarProdutos, criarProduto, atualizarProduto, excluirProduto } from '../services/produtos.service'
import { Card, Button, Badge, Spinner, Input } from '../components/ui'
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
    if (editId) {
      await atualizarProduto(tenantId, editId, form as UpdateProdutoRequest)
    } else {
      await criarProduto(tenantId, form)
    }
    resetForm()
    load()
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
      <Card><p className="text-white/60">Faça login como usuário da loja.</p></Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Cardápio</h1>
        <Button icon={Plus} onClick={() => { resetForm(); setShowForm(true) }}>Novo Produto</Button>
      </div>

      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">{editId ? 'Editar' : 'Novo'} Produto</h3>
            <button onClick={resetForm} className="text-white/60 hover:text-white"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <Input label="Descrição" value={form.descricao || ''} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            <Input label="Preço (R$)" type="number" step="0.01" value={form.preco} onChange={(e) => setForm({ ...form, preco: Number(e.target.value) })} />
            <div>
              <label className="text-sm text-white/60 block mb-1">Categoria</label>
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
            <Button onClick={handleSave} icon={Check}>Salvar</Button>
            <Button variant="ghost" onClick={resetForm}>Cancelar</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <Spinner size="lg" />
      ) : produtos.length === 0 ? (
        <Card><p className="text-white/60 text-center">Nenhum produto. Crie o primeiro!</p></Card>
      ) : (
        <div className="grid gap-3">
          {CATEGORIAS.map((cat) => {
            const items = produtos.filter((p) => p.categoria === cat)
            if (items.length === 0) return null
            return (
              <Card key={cat}>
                <h3 className="text-accent font-semibold mb-3">{CATEGORIA_LABEL[cat]}</h3>
                <div className="divide-y divide-base-300">
                  {items.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-white font-medium ${!p.disponivel ? 'line-through opacity-50' : ''}`}>{p.nome}</span>
                          {p.destaque && <Badge color="info">Destaque</Badge>}
                        </div>
                        {p.descricao && <p className="text-xs text-white/50 mt-0.5">{p.descricao}</p>}
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
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
