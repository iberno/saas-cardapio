import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth-context'
import { listarAuditLogs, type AuditLog } from '../services/audit.service'
import type { TenantUser } from '../types'
import { History, ChevronLeft, ChevronRight } from 'lucide-react'

export const Route = createLazyFileRoute('/admin/loja/auditoria')({
  component: AuditoriaPage,
})

const ACTOR_LABEL: Record<string, string> = {
  PLATFORM_ADMIN: 'Admin',
  TENANT_USER: 'Usuário',
  CUSTOMER: 'Cliente',
}

const ACTION_LABEL: Record<string, string> = {
  login: 'Login',
  create_order: 'Pedido criado',
  update_order_status: 'Status alterado',
  create: 'Criação',
  update: 'Atualização',
  delete: 'Remoção',
}

const ACTIONS = ['login', 'create_order', 'update_order_status', 'create', 'update', 'delete']

function AuditoriaPage() {
  const { user } = useAuth()
  const tenantId = user && 'tenantId' in user ? (user as TenantUser).tenantId : null

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const limit = 30

  useEffect(() => {
    if (!tenantId) return
    setLoading(true)
    listarAuditLogs(tenantId, { page, limit, action: actionFilter || undefined })
      .then((res) => { setLogs(res.data); setTotal(res.total) })
      .finally(() => setLoading(false))
  }, [tenantId, page, actionFilter])

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Auditoria</h1>
          <p className="text-sm opacity-60">Registro de atividades da loja</p>
        </div>
        <History className="text-accent" size={24} />
      </div>

      <div className="flex gap-2 mb-4">
        <select
          className="select w-full max-w-xs"
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
        >
          <option value="">Todas as ações</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{ACTION_LABEL[a] || a}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-base-300 bg-base-100">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Ação</th>
                  <th>Tipo</th>
                  <th>IP</th>
                  <th>Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-sm whitespace-nowrap">{new Date(log.createdAt).toLocaleString('pt-BR')}</td>
                    <td><span className="badge badge-ghost">{ACTION_LABEL[log.action] || log.action}</span></td>
                    <td className="text-sm">{ACTOR_LABEL[log.actorType] || log.actorType}</td>
                    <td className="text-sm opacity-60 font-mono">{log.ip || '-'}</td>
                    <td className="text-sm opacity-70 max-w-xs truncate">
                      {log.resourceType && `${log.resourceType}`}
                      {log.metadata && ` ${JSON.stringify(log.metadata).slice(0, 60)}`}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-sm opacity-60">
                      Nenhum registro encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="opacity-60">{total} registro{total !== 1 ? 's' : ''}</span>
              <div className="flex gap-1">
                <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft size={16} />
                </button>
                <span className="flex items-center px-3 text-sm">
                  {page} / {totalPages}
                </span>
                <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
