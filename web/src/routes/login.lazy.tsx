import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth-context'
import { LogIn } from 'lucide-react'

export const Route = createLazyFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || undefined,
  }),
  component: LoginPage,
})

function LoginPage() {
  const { login, user, isPlatform } = useAuth()
  const navigate = useNavigate()
  const { redirect: redirectUrl } = Route.useSearch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [slug, setSlug] = useState('')
  const [type, setType] = useState<'platform' | 'tenant'>('platform')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    navigate({ to: redirectUrl || (isPlatform ? '/admin' : '/admin/loja') })
  }, [user, navigate, isPlatform, redirectUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password, type, slug || undefined)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao autenticar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="rounded-xl border border-base-300 p-6 bg-base-100 w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Entrar</h1>
          <p className="text-sm opacity-60 mt-1">Acesse sua conta</p>
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
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Senha</legend>
            <input className="input w-full" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </fieldset>
          {type === 'tenant' && (
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Loja (slug)</legend>
              <input className="input w-full" placeholder="ex: acai" value={slug} onChange={(e) => setSlug(e.target.value)} required />
            </fieldset>
          )}
          {error && <p className="text-error text-sm">{error}</p>}
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? <span className="loading loading-spinner" /> : <LogIn size={16} />}
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}
