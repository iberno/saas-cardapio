import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../lib/auth-context'
import { listarCategorias, criarCategoria, atualizarCategoria, excluirCategoria } from '../services/categorias.service'
import { listarProdutos } from '../services/produtos.service'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import type { Categoria, TenantUser } from '../types'

export const Route = createLazyFileRoute('/admin/loja/categorias')({
  component: CategoriasPage,
})

function CategoriasPage() {
  const { user } = useAuth()
  const tenantId = user && 'tenantId' in user ? (user as TenantUser).tenantId : ''

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [produtoCounts, setProdutoCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [nome, setNome] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Categoria | null>(null)

  const modalRef = useRef<HTMLDialogElement>(null)
  const delRef = useRef<HTMLDialogElement>(null)

  const load = () => {
    if (!tenantId) return
    setLoading(true)
    Promise.all([
      listarCategorias(tenantId),
      listarProdutos(tenantId, { limit: 10000 }),
    ])
      .then(([cats, produtos]) => {
        setCategorias(cats)
        const counts: Record<string, number> = {}
        for (const p of produtos.data) {
          if (p.categoriaId) {
            counts[p.categoriaId] = (counts[p.categoriaId] || 0) + 1
          }
        }
        setProdutoCounts(counts)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [tenantId])

  const openCreate = () => {
    setEditId(null)
    setNome('')
    setError('')
    modalRef.current?.showModal()
  }

  const openEdit = (cat: Categoria) => {
    setEditId(cat.id)
    setNome(cat.nome)
    setError('')
    modalRef.current?.showModal()
  }

  const closeModal = () => {
    modalRef.current?.close()
    setEditId(null)
  }

  const handleSave = async () => {
    if (!tenantId) return
    setSaving(true)
    setError('')
    try {
      if (editId) {
        await atualizarCategoria(tenantId, editId, { nome })
        toast.success('Categoria atualizada')
      } else {
        await criarCategoria(tenantId, { nome })
        toast.success('Categoria criada')
      }
      closeModal()
      load()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar'
      setError(msg)
      toast.error(msg)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!tenantId || !deleteTarget) return
    try {
      await excluirCategoria(tenantId, deleteTarget.id)
      toast.success('Categoria excluída')
      setDeleteTarget(null)
      delRef.current?.close()
      load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  if (!tenantId) {
    return (
      <div className="rounded-xl border border-base-300 p-6 bg-base-100">
        <p className="opacity-60">Faça login como usuário da loja.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Categorias</h1>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} />Nova Categoria
          </button>
        </div>

        {loading ? (
          <span className="loading loading-spinner loading-lg" />
        ) : categorias.length === 0 ? (
          <div className="rounded-xl border border-base-300 p-6 bg-base-100">
            <p className="opacity-60 text-center">Nenhuma categoria. Crie a primeira!</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-base-300 bg-base-100">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Ordem</th>
                  <th>Produtos</th>
                  <th className="w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map((cat) => (
                  <tr key={cat.id}>
                    <td className="font-medium">{cat.nome}</td>
                    <td>{cat.ordem}</td>
                    <td>{produtoCounts[cat.id] || 0}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(cat)} className="btn btn-ghost btn-xs">
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => { setDeleteTarget(cat); delRef.current?.showModal() }}
                          className="btn btn-ghost btn-xs text-error"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <dialog ref={modalRef} className="modal" onClick={(e) => { if (e.target === modalRef.current) closeModal() }}>
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={closeModal}>
              <X size={16} />
            </button>
          </form>
          <h3 className="font-bold text-lg mb-4">{editId ? 'Editar' : 'Nova'} Categoria</h3>

          <fieldset className="fieldset mb-4">
            <legend className="fieldset-legend">Nome</legend>
            <input
              className="input w-full"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoFocus
            />
          </fieldset>

          {error && <div className="alert alert-error mb-4"><span>{error}</span></div>}

          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <span className="loading loading-spinner" /> : null}
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
          <h3 className="font-bold text-lg mb-2">Excluir Categoria</h3>
          <p className="mb-4">Tem certeza que deseja excluir <strong>{deleteTarget?.nome}</strong>?</p>
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
