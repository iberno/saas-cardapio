import { createLazyFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { resetPassword } from '../services/auth.service'
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react'

export const Route = createLazyFileRoute('/resetar-senha')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || '',
    type: (search.type as 'platform' | 'tenant') || 'platform',
  }),
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { token, type } = Route.useSearch()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, newPassword, type)
      setSuccess(true)
      setTimeout(() => navigate({ to: '/login' }), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao redefinir senha')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="rounded-xl border border-base-300 p-6 bg-base-100 w-full max-w-sm text-center">
          <CheckCircle2 size={40} className="mx-auto text-success mb-4" />
          <h1 className="text-xl font-bold mb-2">Senha redefinida!</h1>
          <p className="text-sm opacity-60 mb-4">Redirecionando para o login...</p>
          <Link to="/login" className="link text-sm">Ir para o login</Link>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="rounded-xl border border-base-300 p-6 bg-base-100 w-full max-w-sm text-center">
          <AlertCircle size={40} className="mx-auto text-warning mb-4" />
          <h1 className="text-xl font-bold mb-2">Link inválido</h1>
          <p className="text-sm opacity-60 mb-4">Nenhum token de redefinição foi fornecido.</p>
          <Link to="/esqueci-senha" className="link text-sm">Solicitar novo link</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="rounded-xl border border-base-300 p-6 bg-base-100 w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Nova senha</h1>
          <p className="text-sm opacity-60 mt-1">Escolha uma nova senha para sua conta</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Nova senha</legend>
            <input className="input w-full" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Confirmar senha</legend>
            <input className="input w-full" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} required />
          </fieldset>
          {error && <p className="text-error text-sm">{error}</p>}
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? <span className="loading loading-spinner" /> : <Lock size={16} />}
            Redefinir senha
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link to="/login" className="link text-sm">Voltar ao login</Link>
        </div>
      </div>
    </div>
  )
}
