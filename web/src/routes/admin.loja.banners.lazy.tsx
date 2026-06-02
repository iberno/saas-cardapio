import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../lib/auth-context'
import { listarBanners, criarBanner, atualizarBanner, excluirBanner } from '../services/banners.service'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { ImageUpload } from '../components/ui/ImageUpload'
import type { Banner, TenantUser } from '../types'

export const Route = createLazyFileRoute('/admin/loja/banners')({
  component: BannersPage,
})

function BannersPage() {
  const { user } = useAuth()
  const tenantId = user && 'tenantId' in user ? (user as TenantUser).tenantId : ''

  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<{ imagemUrl: string; titulo: string; linkUrl: string }>({ imagemUrl: '', titulo: '', linkUrl: '' })
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null)

  const modalRef = useRef<HTMLDialogElement>(null)
  const delRef = useRef<HTMLDialogElement>(null)

  const load = () => {
    if (!tenantId) return
    setLoading(true)
    listarBanners(tenantId)
      .then(setBanners)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [tenantId])

  const openCreate = () => {
    setEditId(null)
    setForm({ imagemUrl: '', titulo: '', linkUrl: '' })
    setError('')
    modalRef.current?.showModal()
  }

  const closeModal = () => {
    modalRef.current?.close()
    setEditId(null)
  }

  const openEdit = (b: Banner) => {
    setEditId(b.id)
    setForm({ imagemUrl: b.imagemUrl, titulo: b.titulo || '', linkUrl: b.linkUrl || '' })
    setError('')
    modalRef.current?.showModal()
  }

  const handleSave = async () => {
    if (!tenantId) return
    setSaving(true)
    setError('')
    try {
      if (editId) {
        await atualizarBanner(tenantId, editId, {
          imagemUrl: form.imagemUrl || undefined,
          titulo: form.titulo || undefined,
          linkUrl: form.linkUrl || undefined,
        })
      } else {
        await criarBanner(tenantId, {
          imagemUrl: form.imagemUrl,
          titulo: form.titulo || undefined,
          linkUrl: form.linkUrl || undefined,
        })
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
    await excluirBanner(tenantId, deleteTarget.id)
    setDeleteTarget(null)
    delRef.current?.close()
    load()
  }

  const toggleAtivo = async (b: Banner) => {
    if (!tenantId) return
    await atualizarBanner(tenantId, b.id, { ativo: !b.ativo })
    load()
  }

  const sorted = [...banners].sort((a, b) => a.ordem - b.ordem)

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
          <h1 className="text-2xl font-bold">Banners</h1>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} />Novo Banner
          </button>
        </div>

        {loading ? (
          <span className="loading loading-spinner loading-lg" />
        ) : banners.length === 0 ? (
          <div className="rounded-xl border border-base-300 p-6 bg-base-100">
            <p className="opacity-60 text-center">Nenhum banner. Crie o primeiro!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((b) => (
              <div key={b.id} className="rounded-xl border border-base-300 bg-base-100 overflow-hidden">
                <div className="h-32 bg-base-200 overflow-hidden">
                  {b.imagemUrl ? (
                    <img src={b.imagemUrl} alt={b.titulo || ''} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-30">Sem imagem</div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {b.titulo && <p className="font-medium truncate">{b.titulo}</p>}
                      {b.linkUrl && (
                        <p className="text-xs opacity-50 truncate" title={b.linkUrl}>{b.linkUrl}</p>
                      )}
                    </div>
                    <span className="badge badge-sm">#{b.ordem}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-base-300">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="toggle toggle-sm"
                        checked={b.ativo}
                        onChange={() => toggleAtivo(b)}
                      />
                      {b.ativo ? 'Ativo' : 'Inativo'}
                    </label>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(b)} className="btn btn-ghost btn-xs"><Pencil size={14} /></button>
                      <button
                        onClick={() => { setDeleteTarget(b); delRef.current?.showModal() }}
                        className="btn btn-ghost btn-xs text-error"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
          <h3 className="font-bold text-lg mb-4">{editId ? 'Editar' : 'Novo'} Banner</h3>

          <div className="space-y-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Imagem</legend>
              <ImageUpload
                tenantId={tenantId}
                currentUrl={form.imagemUrl || null}
                onUpload={(url) => setForm({ ...form, imagemUrl: url })}
                onRemove={() => setForm({ ...form, imagemUrl: '' })}
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Título</legend>
              <input
                className="input w-full"
                placeholder="Título (opcional)"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Link</legend>
              <input
                className="input w-full"
                placeholder="URL (opcional)"
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
              />
            </fieldset>
          </div>

          {error && <div className="alert alert-error mt-4"><span>{error}</span></div>}

          <div className="flex gap-2 mt-6">
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
          <h3 className="font-bold text-lg mb-2">Excluir Banner</h3>
          <p className="mb-4">Tem certeza que deseja excluir este banner?</p>
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
