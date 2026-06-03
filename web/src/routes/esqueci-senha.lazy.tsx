import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { forgotPassword } from '../services/auth.service'
import { Mail, ArrowLeft, CheckCircle2, Copy } from 'lucide-react'

export const Route = createLazyFileRoute('/esqueci-senha')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [type, setType] = useState<'platform' | 'tenant'>('platform')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ message: string; devToken?: string; devUrl?: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await forgotPassword(email, type)
      setResult(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao solicitar redefinição')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="rounded-xl border border-base-300 p-6 bg-base-100 w-full max-w-sm text-center">
          <CheckCircle2 size={40} className="mx-auto text-success mb-4" />
          <h1 className="text-xl font-bold mb-2">Email enviado!</h1>
          <p className="text-sm opacity-60 mb-4">{result.message}</p>
          {result.devToken && (
            <div className="bg-base-200 rounded-lg p-4 text-left space-y-2 mb-4">
              <p className="text-xs font-bold opacity-60">MODO DESENVOLVIMENTO</p>
              <p className="text-xs break-all font-mono bg-base-300 p-2 rounded">{result.devToken}</p>
              <button
                onClick={() => navigator.clipboard.writeText(result.devUrl || result.devToken!)}
                className="btn btn-ghost btn-xs gap-1"
              >
                <Copy size={12} /> Copiar link
              </button>
            </div>
          )}
          <Link to="/login" className="link text-sm">Voltar ao login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="rounded-xl border border-base-300 p-6 bg-base-100 w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Redefinir senha</h1>
          <p className="text-sm opacity-60 mt-1">Digite seu email para receber o link</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <button type="button" className={`btn btn-sm flex-1 ${type === 'platform' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setType('platform')}>Plataforma</button>
            <button type="button" className={`btn btn-sm flex-1 ${type === 'tenant' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setType('tenant')}>Loja</button>
          </div>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Email</legend>
            <input className="input w-full" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </fieldset>
          {error && <p className="text-error text-sm">{error}</p>}
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? <span className="loading loading-spinner" /> : <Mail size={16} />}
            Enviar link
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link to="/login" className="link text-sm inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  )
}
