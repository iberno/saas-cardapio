import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../lib/auth-context'
import { listarProdutos, criarProduto, atualizarProduto, excluirProduto } from '../services/produtos.service'
import { listarCategorias } from '../services/categorias.service'
import { listarVariantes, criarVariante, excluirVariante } from '../services/variantes.service'
import { listarGrupos, criarGrupo, excluirGrupo, criarGrupoItem, excluirGrupoItem } from '../services/grupos.service'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { ImageUpload } from '../components/ui/ImageUpload'
import type { Produto, TenantUser, Categoria } from '../types'

export const Route = createLazyFileRoute('/admin/loja/cardapio')({
  component: CardapioPage,
})

let keyCounter = 0
const uid = () => `k_${++keyCounter}`

interface FVar {
  _k: string
  id?: string
  nome: string
  preco: number
}

interface FItem {
  _k: string
  id?: string
  nome: string
  preco: number
}

interface FGrupo {
  _k: string
  id?: string
  nome: string
  maxSelect: number
  itens: FItem[]
}

interface FState {
  nome: string
  descricao: string
  categoriaId: string
  imagemUrl: string | null
  exibirPrecoAPartirDe: boolean
  variantes: FVar[]
  grupos: FGrupo[]
}

const blank = (cats: Categoria[]): FState => ({
  nome: '',
  descricao: '',
  categoriaId: cats[0]?.id || '',
  imagemUrl: null,
  exibirPrecoAPartirDe: true,
  variantes: [],
  grupos: [],
})

function CardapioPage() {
  const { user } = useAuth()
  const tenantId = user && 'tenantId' in user ? (user as TenantUser).tenantId : ''

  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FState>(blank([]))
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Produto | null>(null)
  const [newVarNome, setNewVarNome] = useState('')
  const [newVarPreco, setNewVarPreco] = useState('')

  const modalRef = useRef<HTMLDialogElement>(null)
  const delRef = useRef<HTMLDialogElement>(null)

  const load = () => {
    if (!tenantId) return
    setLoading(true)
    Promise.all([listarProdutos(tenantId), listarCategorias(tenantId)])
      .then(([pr, cats]) => {
        setProdutos(pr.data)
        setCategorias(cats)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [tenantId])

  const openCreate = () => {
    setEditId(null)
    setForm(blank(categorias))
    setError('')
    setNewVarNome('')
    setNewVarPreco('')
    modalRef.current?.showModal()
  }

  const closeModal = () => {
    modalRef.current?.close()
    setEditId(null)
  }

  const openEdit = async (p: Produto) => {
    setEditId(p.id)
    setError('')
    setNewVarNome('')
    setNewVarPreco('')
    const s: FState = {
      nome: p.nome,
      descricao: p.descricao || '',
      categoriaId: p.categoriaId || '',
      imagemUrl: p.imagemUrl,
      exibirPrecoAPartirDe: p.exibirPrecoAPartirDe,
      variantes: [],
      grupos: [],
    }
    try {
      const [vars, grupos] = await Promise.all([
        listarVariantes(tenantId, p.id),
        listarGrupos(tenantId, p.id),
      ])
      s.variantes = vars.map((v) => ({ _k: uid(), id: v.id, nome: v.nome, preco: Number(v.preco) }))
      s.grupos = grupos.map((g) => ({
        _k: uid(),
        id: g.id,
        nome: g.nome,
        maxSelect: g.maxSelect,
        itens: g.itens.map((i) => ({ _k: uid(), id: i.id, nome: i.nome, preco: Number(i.preco) })),
      }))
    } catch {}
    setForm(s)
    modalRef.current?.showModal()
  }

  const handleSave = async () => {
    if (!tenantId) return
    setSaving(true)
    setError('')
    try {
      if (editId) {
        await atualizarProduto(tenantId, editId, {
          nome: form.nome,
          descricao: form.descricao || undefined,
          categoriaId: form.categoriaId || undefined,
          imagemUrl: form.imagemUrl || undefined,
          exibirPrecoAPartirDe: form.exibirPrecoAPartirDe,
        })
        const oldVars = await listarVariantes(tenantId, editId)
        await Promise.all(oldVars.map((v) => excluirVariante(tenantId, editId, v.id)))
        for (const v of form.variantes) await criarVariante(tenantId, editId, { nome: v.nome, preco: v.preco })
        const oldGrupos = await listarGrupos(tenantId, editId)
        for (const g of oldGrupos) await excluirGrupo(tenantId, editId, g.id)
        for (const g of form.grupos) {
          const cg = await criarGrupo(tenantId, editId, { nome: g.nome, maxSelect: g.maxSelect || undefined })
          for (const i of g.itens) await criarGrupoItem(tenantId, cg.id, { nome: i.nome, preco: i.preco || undefined })
        }
      } else {
        const created = await criarProduto(tenantId, {
          nome: form.nome,
          descricao: form.descricao || undefined,
          categoriaId: form.categoriaId || undefined,
          imagemUrl: form.imagemUrl || undefined,
          exibirPrecoAPartirDe: form.exibirPrecoAPartirDe,
        })
        for (const v of form.variantes) await criarVariante(tenantId, created.id, { nome: v.nome, preco: v.preco })
        for (const g of form.grupos) {
          const cg = await criarGrupo(tenantId, created.id, { nome: g.nome, maxSelect: g.maxSelect || undefined })
          for (const i of g.itens) await criarGrupoItem(tenantId, cg.id, { nome: i.nome, preco: i.preco || undefined })
        }
      }
      closeModal()
      load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!tenantId || !deleteTarget) return
    await excluirProduto(tenantId, deleteTarget.id)
    setDeleteTarget(null)
    delRef.current?.close()
    load()
  }

  const toggleDisponivel = async (p: Produto) => {
    if (!tenantId) return
    await atualizarProduto(tenantId, p.id, { disponivel: !p.disponivel })
    load()
  }

  const addVariante = () => {
    if (!newVarNome.trim()) return
    setForm((f) => ({
      ...f,
      variantes: [...f.variantes, { _k: uid(), nome: newVarNome, preco: Number(newVarPreco) || 0 }],
    }))
    setNewVarNome('')
    setNewVarPreco('')
  }

  const delVariante = (k: string) =>
    setForm((f) => ({ ...f, variantes: f.variantes.filter((v) => v._k !== k) }))

  const addGrupo = () =>
    setForm((f) => ({
      ...f,
      grupos: [...f.grupos, { _k: uid(), nome: '', maxSelect: 1, itens: [] }],
    }))

  const updGrupo = (k: string, p: Partial<FGrupo>) =>
    setForm((f) => ({
      ...f,
      grupos: f.grupos.map((g) => (g._k === k ? { ...g, ...p } : g)),
    }))

  const delGrupo = (k: string) =>
    setForm((f) => ({ ...f, grupos: f.grupos.filter((g) => g._k !== k) }))

  const addItem = (gk: string) =>
    setForm((f) => ({
      ...f,
      grupos: f.grupos.map((g) =>
        g._k === gk ? { ...g, itens: [...g.itens, { _k: uid(), nome: '', preco: 0 }] } : g,
      ),
    }))

  const updItem = (gk: string, ik: string, p: Partial<FItem>) =>
    setForm((f) => ({
      ...f,
      grupos: f.grupos.map((g) =>
        g._k === gk
          ? { ...g, itens: g.itens.map((i) => (i._k === ik ? { ...i, ...p } : i)) }
          : g,
      ),
    }))

  const delItem = (gk: string, ik: string) =>
    setForm((f) => ({
      ...f,
      grupos: f.grupos.map((g) =>
        g._k === gk ? { ...g, itens: g.itens.filter((i) => i._k !== ik) } : g,
      ),
    }))

  if (!tenantId) {
    return (
      <div className="rounded-xl border border-base-300 p-6 bg-base-100">
        <p className="opacity-60">Faça login como usuário da loja.</p>
      </div>
    )
  }

  const grouped = new Map<string, Produto[]>()
  for (const p of produtos) {
    const cat = p.categoriaCardapio?.nome || 'Sem categoria'
    const arr = grouped.get(cat) || []
    arr.push(p)
    grouped.set(cat, arr)
  }
  const sortedGroups = [...grouped.entries()].sort(([a], [b]) => {
    if (a === 'Sem categoria') return 1
    if (b === 'Sem categoria') return -1
    return a.localeCompare(b)
  })

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Cardápio</h1>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} />Novo Produto
          </button>
        </div>

        {loading ? (
          <span className="loading loading-spinner loading-lg" />
        ) : produtos.length === 0 ? (
          <div className="rounded-xl border border-base-300 p-6 bg-base-100">
            <p className="opacity-60 text-center">Nenhum produto. Crie o primeiro!</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {sortedGroups.map(([catName, items]) => (
              <div key={catName} className="rounded-xl border border-base-300 p-6 bg-base-100">
                <h3 className="font-semibold mb-3 text-accent">{catName}</h3>
                <div className="divide-y divide-base-300">
                  {items.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {p.imagemUrl && (
                          <img
                            src={p.imagemUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-medium truncate ${!p.disponivel ? 'line-through opacity-50' : ''}`}>
                              {p.nome}
                            </span>
                            {p.destaque && <span className="badge badge-info badge-sm">Destaque</span>}
                            {!p.disponivel && <span className="badge badge-soft badge-error badge-sm">Indisponível</span>}
                          </div>
                          {p.descricao && <p className="text-xs opacity-50 mt-0.5 truncate">{p.descricao}</p>}
                          <span className="text-sm font-semibold text-accent">
                            {p.exibirPrecoAPartirDe ? 'a partir de ' : ''}R$ {Number(p.preco).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleDisponivel(p)}
                          className={`btn btn-xs ${p.disponivel ? 'btn-success' : 'btn-ghost'}`}
                          title={p.disponivel ? 'Disponível' : 'Indisponível'}
                        >
                          {p.disponivel ? <Check size={14} /> : <X size={14} />}
                        </button>
                        <button onClick={() => openEdit(p)} className="btn btn-ghost btn-xs"><Pencil size={14} /></button>
                        <button
                          onClick={() => { setDeleteTarget(p); delRef.current?.showModal() }}
                          className="btn btn-ghost btn-xs text-error"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <dialog ref={modalRef} className="modal" onClick={(e) => { if (e.target === modalRef.current) closeModal() }}>
        <div className="modal-box max-w-3xl">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={closeModal}>
              <X size={16} />
            </button>
          </form>
          <h3 className="font-bold text-lg mb-4">{editId ? 'Editar' : 'Novo'} Produto</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nome</legend>
              <input
                className="input w-full"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Descrição</legend>
              <input
                className="input w-full"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Categoria</legend>
              <select
                className="select w-full"
                value={form.categoriaId}
                onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
              >
                <option value="">Sem categoria</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nome}</option>
                ))}
              </select>
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Imagem</legend>
              <ImageUpload
                tenantId={tenantId}
                currentUrl={form.imagemUrl}
                onUpload={(url) => setForm({ ...form, imagemUrl: url })}
                onRemove={() => setForm({ ...form, imagemUrl: null })}
              />
            </fieldset>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.exibirPrecoAPartirDe}
                onChange={(e) => setForm((f) => ({ ...f, exibirPrecoAPartirDe: e.target.checked }))}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm">Exibir "a partir de"</span>
            </label>
          </div>

          <hr className="my-4" />

          <h4 className="font-semibold mb-2">Variantes</h4>
          <div className="overflow-x-auto mb-4">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Preço (R$)</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {form.variantes.map((v) => (
                  <tr key={v._k}>
                    <td>{v.nome}</td>
                    <td>{v.preco.toFixed(2)}</td>
                    <td>
                      <button onClick={() => delVariante(v._k)} className="btn btn-ghost btn-xs text-error">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>
                    <input
                      className="input input-xs w-full"
                      placeholder="Nome"
                      value={newVarNome}
                      onChange={(e) => setNewVarNome(e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="input input-xs w-full"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={newVarPreco}
                      onChange={(e) => setNewVarPreco(e.target.value)}
                    />
                  </td>
                  <td>
                    <button onClick={addVariante} className="btn btn-primary btn-xs"><Plus size={14} /></button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <hr className="my-4" />

          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Grupos</h4>
            <button onClick={addGrupo} className="btn btn-ghost btn-xs"><Plus size={14} />Adicionar Grupo</button>
          </div>
          <div className="space-y-3 mb-4">
            {form.grupos.map((g) => (
              <div key={g._k} className="card border border-base-300 bg-base-200">
                <div className="card-body p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      className="input input-sm flex-1"
                      placeholder="Nome do grupo"
                      value={g.nome}
                      onChange={(e) => updGrupo(g._k, { nome: e.target.value })}
                    />
                    <fieldset className="fieldset flex-row items-center gap-1">
                      <legend className="fieldset-legend text-xs">Máx</legend>
                      <input
                        className="input input-sm w-16"
                        type="number"
                        min="1"
                        value={g.maxSelect}
                        onChange={(e) => updGrupo(g._k, { maxSelect: Number(e.target.value) || 1 })}
                      />
                    </fieldset>
                    <button onClick={() => delGrupo(g._k)} className="btn btn-ghost btn-xs text-error">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Preço (R$)</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.itens.map((i) => (
                          <tr key={i._k}>
                            <td>
                              <input
                                className="input input-xs w-full"
                                placeholder="Nome"
                                value={i.nome}
                                onChange={(e) => updItem(g._k, i._k, { nome: e.target.value })}
                              />
                            </td>
                            <td>
                              <input
                                className="input input-xs w-full"
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                value={i.preco}
                                onChange={(e) => updItem(g._k, i._k, { preco: Number(e.target.value) || 0 })}
                              />
                            </td>
                            <td>
                              <button onClick={() => delItem(g._k, i._k)} className="btn btn-ghost btn-xs text-error">
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button onClick={() => addItem(g._k)} className="btn btn-ghost btn-xs self-start">
                    <Plus size={14} />Adicionar Item
                  </button>
                </div>
              </div>
            ))}
            {form.grupos.length === 0 && (
              <p className="text-sm opacity-50">Nenhum grupo adicionado.</p>
            )}
          </div>

          {error && <div className="alert alert-error mb-4"><span>{error}</span></div>}

          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <span className="loading loading-spinner" /> : <Check size={16} />}
              Salvar
            </button>
            <button className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
          </div>
        </div>
      </dialog>

      <dialog ref={delRef} className="modal" onClick={(e) => { if (e.target === delRef.current) setDeleteTarget(null) }}>
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={() => setDeleteTarget(null)}>
              <X size={16} />
            </button>
          </form>
          <h3 className="font-bold text-lg mb-2">Excluir Produto</h3>
          <p className="mb-4">Tem certeza que deseja excluir <strong>{deleteTarget?.nome}</strong>?</p>
          <p className="text-sm opacity-60 mb-4">Variantes e grupos associados também serão removidos.</p>
          <div className="flex gap-2">
            <button className="btn btn-error" onClick={handleDelete}><Trash2 size={16} />Excluir</button>
            <button className="btn btn-ghost" onClick={() => { setDeleteTarget(null); delRef.current?.close() }}>
              Cancelar
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
