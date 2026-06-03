import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../lib/auth-context'
import { listarStaff, criarStaff, atualizarStaff, excluirStaff, type CreateStaffRequest, type UpdateStaffRequest } from '../services/staff.service'
import type { TenantUser } from '../types'
import { Users, Pencil, Trash2, X } from 'lucide-react'

export const Route = createLazyFileRoute('/admin/loja/equipe')({
  component: EquipePage,
})

const ROLE_LABEL: Record<string, string> = { OWNER: 'Proprietário', STAFF: 'Equipe' }

function EquipePage() {
  const { user } = useAuth()
  const tenantId = user && 'tenantId' in user ? (user as TenantUser).tenantId : null

  const [staff, setStaff] = useState<TenantUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [editId, setEditId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'OWNER' | 'STAFF'>('STAFF')

  const [deleteTarget, setDeleteTarget] = useState<TenantUser | null>(null)

  const modalRef = useRef<HTMLDialogElement>(null)
  const delRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (!tenantId) return
    setLoading(true)
    listarStaff(tenantId).then(setStaff).finally(() => setLoading(false))
  }, [tenantId])

  function openCreate() {
    setEditId(null)
    setEmail('')
    setName('')
    setPassword('')
    setRole('STAFF')
    setError('')
    modalRef.current?.showModal()
  }

  function openEdit(staffMember: TenantUser) {
    setEditId(staffMember.id)
    setEmail(staffMember.email)
    setName(staffMember.name)
    setPassword('')
    setRole(staffMember.role)
    setError('')
    modalRef.current?.showModal()
  }

  function closeModal() {
    modalRef.current?.close()
  }

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    setError('')
    try {
      if (editId) {
        const data: UpdateStaffRequest = { email, name, role }
        if (password) data.password = password
        const updated = await atualizarStaff(tenantId, editId, data)
        setStaff((prev) => prev.map((s) => (s.id === editId ? updated : s)))
        toast.success('Membro atualizado')
      } else {
        const created = await criarStaff(tenantId, { email, password, name, role })
        setStaff((prev) => [...prev, created])
        toast.success('Membro adicionado')
      }
      closeModal()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!tenantId || !deleteTarget) return
    try {
      await excluirStaff(tenantId, deleteTarget.id)
      setStaff((prev) => prev.filter((s) => s.id !== deleteTarget.id))
      toast.success('Membro removido')
      setDeleteTarget(null)
      delRef.current?.close()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao remover')
      toast.error(err instanceof Error ? err.message : 'Erro ao remover')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Equipe</h1>
          <p className="text-sm opacity-60">Gerencie os usuários da sua loja</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Users size={16} /> Novo Membro
        </button>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setError('')}>X</button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-base-300 bg-base-100">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Função</th>
              <th>2FA</th>
              <th>Criado em</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id}>
                <td className="font-medium">{member.name}</td>
                <td className="text-sm opacity-70">{member.email}</td>
                <td>
                  <span className={`badge ${member.role === 'OWNER' ? 'badge-accent' : 'badge-ghost'}`}>
                    {ROLE_LABEL[member.role]}
                  </span>
                </td>
                <td>{member.totpEnabled ? <span className="badge badge-success">Ativo</span> : <span className="badge badge-ghost">Inativo</span>}</td>
                <td className="text-sm opacity-70">{new Date(member.createdAt).toLocaleDateString('pt-BR')}</td>
                <td className="text-right">
                  <button onClick={() => openEdit(member)} className="btn btn-ghost btn-xs mr-1" title="Editar">
                    <Pencil size={14} />
                  </button>
                  {member.role !== 'OWNER' && (
                    <button
                      onClick={() => { setDeleteTarget(member); delRef.current?.showModal() }}
                      className="btn btn-ghost btn-xs text-error"
                      title="Remover"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-sm opacity-60">
                  Nenhum membro encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <dialog ref={modalRef} className="modal" onClick={(e) => { if (e.target === modalRef.current) closeModal() }}>
        <div className="modal-box">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={closeModal}>
            <X size={16} />
          </button>
          <h3 className="font-bold text-lg mb-4">{editId ? 'Editar' : 'Novo'} Membro</h3>
          <div className="space-y-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nome</legend>
              <input className="input w-full" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Email</legend>
              <input className="input w-full" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Função</legend>
              <select className="select w-full" value={role} onChange={(e) => setRole(e.target.value as 'OWNER' | 'STAFF')}>
                <option value="STAFF">Equipe</option>
                <option value="OWNER">Proprietário</option>
              </select>
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{editId ? 'Nova senha (deixe em branco para manter)' : 'Senha'}</legend>
              <input className="input w-full" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required={!editId} minLength={6} />
            </fieldset>
            {error && <div className="alert alert-error"><span>{error}</span></div>}
            <div className="flex gap-2 justify-end">
              <button className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !name || !email || (!editId && !password)}>
                {saving ? <span className="loading loading-spinner" /> : null}
                Salvar
              </button>
            </div>
          </div>
        </div>
      </dialog>

      <dialog ref={delRef} className="modal" onClick={(e) => { if (e.target === delRef.current) { setDeleteTarget(null); delRef.current?.close() } }}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-2">Remover membro</h3>
          <p className="mb-4 text-sm opacity-70">
            Tem certeza que deseja remover <strong>{deleteTarget?.name}</strong>?
          </p>
          <div className="flex gap-2 justify-end">
            <button className="btn btn-ghost" onClick={() => { setDeleteTarget(null); delRef.current?.close() }}>Cancelar</button>
            <button className="btn btn-error" onClick={handleDelete}>Remover</button>
          </div>
        </div>
      </dialog>
    </div>
  )
}
