import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth-context'
import { setupTotp, enableTotp, disableTotp } from '../services/auth.service'
import { Shield, Smartphone, Copy, CheckCircle2, AlertTriangle, Loader2, QrCode } from 'lucide-react'

export const Route = createLazyFileRoute('/admin/loja/seguranca')({
  component: SegurancaPage,
})

function SegurancaPage() {
  const { user, isPlatform, logout } = useAuth()
  const authType = isPlatform ? 'platform' : 'tenant'
  const [step, setStep] = useState<'idle' | 'setup' | 'verify' | 'done'>('idle')
  const [qrUrl, setQrUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const totpEnabled = user && 'totpEnabled' in user ? (user as any).totpEnabled : false

  const handleSetup = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await setupTotp(authType)
      setSecret(res.secret)
      setQrUrl(res.url)
      setStep('setup')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao configurar 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleEnable = async () => {
    if (code.length < 6) return
    setLoading(true)
    setError('')
    try {
      await enableTotp(authType, code)
      setStep('done')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Código inválido')
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async () => {
    setLoading(true)
    try {
      await disableTotp(authType)
      setStep('idle')
      setQrUrl('')
      setSecret('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao desativar 2FA')
    } finally {
      setLoading(false)
    }
  }

  if (totpEnabled && step !== 'done') {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Shield size={24} className="text-success" />
          <h1 className="text-2xl font-bold">Segurança</h1>
        </div>
        <div className="rounded-xl border border-base-300 p-6 bg-base-100 max-w-lg">
          <div className="flex items-center gap-3 text-success mb-4">
            <CheckCircle2 size={20} />
            <span className="font-semibold">Autenticação de dois fatores ativa</span>
          </div>
          <p className="text-sm opacity-60 mb-4">Sua conta está protegida com 2FA. Ao fazer login, você precisará informar um código do seu aplicativo autenticador.</p>
          <button onClick={handleDisable} className="btn btn-outline btn-error btn-sm" disabled={loading}>
            {loading ? <span className="loading loading-spinner loading-xs" /> : null}
            Desativar 2FA
          </button>
          {error && <p className="text-error text-sm mt-2">{error}</p>}
        </div>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Shield size={24} className="text-success" />
          <h1 className="text-2xl font-bold">Segurança</h1>
        </div>
        <div className="rounded-xl border border-base-300 p-6 bg-base-100 max-w-lg text-center">
          <CheckCircle2 size={48} className="mx-auto text-success mb-4" />
          <h2 className="text-xl font-bold mb-2">2FA ativado com sucesso!</h2>
          <p className="text-sm opacity-60 mb-4">Sua conta agora está protegida com autenticação de dois fatores.</p>
          <p className="text-xs opacity-40">Na próxima vez que fizer login, você precisará informar um código do seu aplicativo autenticador.</p>
        </div>
      </div>
    )
  }

  if (step === 'setup') {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Shield size={24} />
          <h1 className="text-2xl font-bold">Configurar 2FA</h1>
        </div>
        <div className="rounded-xl border border-base-300 p-6 bg-base-100 max-w-lg space-y-6">
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-xl">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}`} alt="QR Code" className="w-48 h-48" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Ou insira manualmente:</p>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-base-200 p-2 rounded flex-1 break-all font-mono">{secret}</code>
              <button onClick={() => navigator.clipboard.writeText(secret)} className="btn btn-ghost btn-xs" title="Copiar">
                <Copy size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Verificar código</p>
            <p className="text-xs opacity-60">Digite o código de 6 dígitos do seu aplicativo autenticador</p>
            <div className="flex gap-2">
              <input className="input flex-1 font-mono text-center text-lg tracking-widest" placeholder="000000" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
              <button className="btn btn-primary" onClick={handleEnable} disabled={code.length !== 6 || loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
                Verificar
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-error text-sm">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Shield size={24} />
        <h1 className="text-2xl font-bold">Segurança</h1>
      </div>
      <div className="rounded-xl border border-base-300 p-6 bg-base-100 max-w-lg">
        <div className="flex items-center gap-3 mb-4">
          <Smartphone size={20} className="opacity-60" />
          <div>
            <h2 className="font-semibold">Autenticação de dois fatores</h2>
            <p className="text-sm opacity-60">Adicione uma camada extra de segurança à sua conta</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSetup} disabled={loading}>
          {loading ? <span className="loading loading-spinner loading-xs" /> : <Shield size={16} />}
          Configurar 2FA
        </button>
        {error && <p className="text-error text-sm mt-2">{error}</p>}
      </div>
    </div>
  )
}
