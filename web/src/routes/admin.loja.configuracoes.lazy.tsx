import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../lib/auth-context'
import { getSettings, updateSettings, type StoreSettings } from '../services/settings.service'
import { StoreHoursEditor } from '../components/StoreHoursEditor'
import { ImageUpload } from '../components/ui/ImageUpload'
import { Save, MapPin, Phone, Clock, CreditCard, Star, ExternalLink, Image, FileText } from 'lucide-react'

export const Route = createLazyFileRoute('/admin/loja/configuracoes')({
  component: ConfiguracoesPage,
})

function ConfiguracoesPage() {
  const { user } = useAuth()
  const tenantId = user && 'tenantId' in user ? user.tenantId : null

  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [instagram, setInstagram] = useState('')
  const [hoursText, setHoursText] = useState('')
  const [paymentMethods, setPaymentMethods] = useState('')
  const [pointsEnabled, setPointsEnabled] = useState(false)
  const [pointsPerReais, setPointsPerReais] = useState(1)
  const [contactPhone, setContactPhone] = useState('')
  const [logoUrl, setLogoUrl] = useState('')

  useEffect(() => {
    if (!tenantId) return
    getSettings(tenantId).then((s) => {
      setSettings(s)
      setDescription(s.description)
      setAddress(s.address)
      setInstagram(s.instagram)
      setHoursText(s.hoursText)
      setPaymentMethods(s.paymentMethods)
      setPointsEnabled(s.pointsEnabled)
      setPointsPerReais(s.pointsPerReais)
      setContactPhone(s.contactPhone || '')
      setLogoUrl(s.logoUrl || '')
    }).finally(() => setLoading(false))
  }, [tenantId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId) return
    setSaving(true)
    try {
      const updated = await updateSettings(tenantId, {
        description, address, instagram, hoursText, paymentMethods,
        pointsEnabled, pointsPerReais, contactPhone, logoUrl,
      })
      setSettings(updated)
      toast.success('Configurações salvas com sucesso!')
    } catch {
      toast.error('Erro ao salvar configurações. Verifique o console.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg text-primary" /></div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Configurações da Loja</h1>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
        <div>
          <label className="label font-semibold text-sm">Nome da loja</label>
          <input value={settings?.name || ''} className="input w-full opacity-60" disabled />
        </div>

        <div>
          <label className="label font-semibold text-sm flex items-center gap-1">
            <Image size={16} /> Logo da loja
          </label>
          <ImageUpload
            tenantId={tenantId!}
            currentUrl={logoUrl}
            onUpload={(url) => setLogoUrl(url)}
            onRemove={() => setLogoUrl('')}
          />
        </div>
        <div>
          <label className="label font-semibold text-sm">Telefone de contato</label>
          <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="input w-full" placeholder="(11) 99999-9999" />
        </div>

        <div>
          <label className="label font-semibold text-sm flex items-center gap-1">
            <MapPin size={16} /> Endereço
          </label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} className="input w-full" placeholder="Rua, número, bairro" />
        </div>

        <div>
          <label className="label font-semibold text-sm flex items-center gap-1">
            <ExternalLink size={16} /> Instagram
          </label>
          <input value={instagram} onChange={(e) => setInstagram(e.target.value)} className="input w-full" placeholder="@seudominio" />
        </div>

        <div>
          <label className="label font-semibold text-sm flex items-center gap-1">
            <FileText size={16} /> Sobre a loja
          </label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="textarea w-full" rows={4} placeholder="Conte um pouco sobre sua loja..." />
        </div>

        <div>
          <label className="label font-semibold text-sm flex items-center gap-1">
            <Clock size={16} /> Horário de funcionamento
          </label>
          <StoreHoursEditor value={hoursText} onChange={setHoursText} />
        </div>

        <div>
          <label className="label font-semibold text-sm flex items-center gap-1">
            <CreditCard size={16} /> Formas de pagamento
          </label>
          <textarea value={paymentMethods} onChange={(e) => setPaymentMethods(e.target.value)} className="textarea w-full" rows={3} placeholder="Dinheiro, Cartão, Pix" />
        </div>

        <div className="border-t border-base-200 pt-4">
          <h3 className="font-bold text-base mb-3 flex items-center gap-1">
            <Star size={18} className="text-warning" /> Programa de Pontos
          </h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={pointsEnabled} onChange={(e) => setPointsEnabled(e.target.checked)} className="toggle toggle-primary" />
              <span className="text-sm">Ativar pontos</span>
            </label>
            {pointsEnabled && (
              <div>
                <label className="label font-semibold text-sm">A cada R$ ___ ganha 1 ponto</label>
                <input type="number" step="0.5" min="0.5" value={pointsPerReais} onChange={(e) => setPointsPerReais(Number(e.target.value))} className="input w-full" />
              </div>
            )}
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn btn-primary gap-1">
          {saving && <span className="loading loading-spinner loading-xs" />}
          <Save size={16} /> Salvar
        </button>
      </form>
    </div>
  )
}
