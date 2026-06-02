import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { listarTenants, criarTenant, atualizarTenant, excluirTenant, atualizarStatusTenant } from '../services/tenants.service'
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react'
import type { Tenant, CreateTenantRequest, UpdateTenantRequest } from '../types'

const PAGE_SIZE = 10
const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'badge-success',
  TRIAL: 'badge-info',
  SUSPENDED: 'badge-warning',
  CANCELED: 'badge-error',
}

export const Route = createLazyFileRoute('/admin/lojas')({
  component: LojasPage,
})

function LojasPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState('')

  const createRef = useRef<HTMLDialogElement>(null)
  const editRef = useRef<HTMLDialogElement>(null)
  const confirmRef = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState<CreateTenantRequest>({ slug: '', name: '', contactEmail: '' })
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<UpdateTenantRequest>({})
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {})
  const [confirmMessage, setConfirmMessage] = useState('')

  const load = () => {
    setLoading(true)
    listarTenants().then(setTenants).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(filter.toLowerCase()) ||
    t.slug.toLowerCase().includes(filter.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const openCreate = () => {
    setForm({ slug: '', name: '', contactEmail: '' })
    createRef.current?.showModal()
  }

  const handleCreate = async () => {
    await criarTenant(form)
    createRef.current?.close()
    load()
  }

  const openEdit = (t: Tenant) => {
    setEditId(t.id)
    setEditForm({ name: t.name, contactEmail: t.contactEmail, contactPhone: t.contactPhone || '' })
    editRef.current?.showModal()
  }

  const handleUpdate = async () => {
    if (!editId) return
    await atualizarTenant(editId, editForm)
    editRef.current?.close()
    load()
  }

  const confirmAndExecute = (message: string, action: () => void) => {
    setConfirmMessage(message)
    setConfirmAction(() => action)
    confirmRef.current?.showModal()
  }

  const handleDelete = (t: Tenant) => {
    confirmAndExecute(
      `Excluir a loja "${t.name}"? Esta ação não pode ser desfeita.`,
      async () => { await excluirTenant(t.id); load() },
    )
  }

  const toggleStatus = (t: Tenant) => {
    const next = t.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    const label = next === 'SUSPENDED' ? 'Suspender' : 'Ativar'
    confirmAndExecute(
      `${label} a loja "${t.name}"?`,
      async () => { await atualizarStatusTenant(t.id, { status: next }); load() },
    )
  }

  if (loading) return <span className="loading loading-spinner loading-lg" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Lojas</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} />Nova Loja
        </button>
      </div>

      <label className="input input-bordered flex items-center gap-2 w-full max-w-sm">
        <Search size={16} className="opacity-60" />
        <input className="grow" placeholder="Buscar por nome ou slug..." value={filter} onChange={(e) => { setFilter(e.target.value); setPage(0) }} />
      </label>

      <dialog ref={createRef} className="modal">
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"><X size={16} /></button>
          </form>
          <h3 className="font-bold text-lg mb-4">Nova Loja</h3>
          <div className="space-y-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nome</legend>
              <input className="input w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Açúcar & Tal" />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Slug</legend>
              <input className="input w-full" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="acucar-e-tal" />
              <span className="text-xs opacity-50 mt-1">Usado no subdomínio: acucar-e-tal.saas-cardapio.local</span>
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Email de contato</legend>
              <input className="input w-full" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                placeholder="contato@acucaretal.com" />
            </fieldset>
          </div>
          <div className="modal-action">
            <button className="btn btn-primary" onClick={handleCreate}>Criar</button>
            <form method="dialog"><button className="btn">Cancelar</button></form>
          </div>
        </div>
      </dialog>

      <dialog ref={confirmRef} className="modal">
        <div className="modal-box">
          <p className="py-4">{confirmMessage}</p>
          <div className="modal-action">
            <button className="btn btn-error" onClick={async () => { await confirmAction(); confirmRef.current?.close() }}>Confirmar</button>
            <form method="dialog"><button className="btn">Cancelar</button></form>
          </div>
        </div>
      </dialog>

      <dialog ref={editRef} className="modal">
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"><X size={16} /></button>
          </form>
          <h3 className="font-bold text-lg mb-4">Editar Loja</h3>
          <div className="space-y-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nome</legend>
              <input className="input w-full" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Email de contato</legend>
              <input className="input w-full" type="email" value={editForm.contactEmail || ''} onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })} />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Telefone</legend>
              <input className="input w-full" value={editForm.contactPhone || ''} onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })} />
            </fieldset>
          </div>
          <div className="modal-action">
            <button className="btn btn-primary" onClick={handleUpdate}>Salvar</button>
            <form method="dialog"><button className="btn">Cancelar</button></form>
          </div>
        </div>
      </dialog>

      <div className="overflow-x-auto rounded-xl border border-base-300 bg-base-100">
        <table className="table">
          <thead>
            <tr>
              <th>Loja</th>
              <th className="hidden sm:table-cell">Slug</th>
              <th className="hidden md:table-cell">Contato</th>
              <th>Status</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((t) => (
              <tr key={t.id}>
                <td>
                  <span className="font-medium">{t.name}</span>
                  <span className="text-xs opacity-50 block sm:hidden">{t.slug}</span>
                </td>
                <td className="hidden sm:table-cell text-sm opacity-60">{t.slug}</td>
                <td className="hidden md:table-cell text-sm opacity-60">{t.contactEmail}</td>
                <td>
                  <span className={`badge ${STATUS_BADGE[t.status] || ''} badge-sm`}>{t.status}</span>
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => toggleStatus(t)} className="btn btn-ghost btn-xs">
                      {t.status === 'ACTIVE' ? 'Suspender' : 'Ativar'}
                    </button>
                    <button onClick={() => openEdit(t)} className="btn btn-ghost btn-xs"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(t)} className="btn btn-ghost btn-xs text-error"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {paged.length === 0 && (
          <p className="text-center py-8 opacity-60">Nenhuma loja encontrada.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button className="btn btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button>
          <span className="text-sm opacity-60">Página {page + 1} de {totalPages}</span>
          <button className="btn btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Próxima</button>
        </div>
      )}
    </div>
  )
}
