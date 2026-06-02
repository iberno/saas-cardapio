import { createLazyFileRoute } from '@tanstack/react-router'
import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../lib/auth-context'
import { Upload, Copy, Trash2, Loader2, ImageIcon } from 'lucide-react'
import { api } from '../lib/api-client'
import { uploadImagem } from '../services/upload.service'
import type { TenantUser } from '../types'

export const Route = createLazyFileRoute('/admin/loja/galeria')({
  component: GaleriaPage,
})

interface GaleriaImage {
  filename: string
  url: string
  size: number
  lastModified: string
}

async function listarGaleria(tenantId: string): Promise<GaleriaImage[]> {
  return api.get(`/tenants/${tenantId}/galeria`)
}

async function excluirImagem(tenantId: string, filename: string): Promise<void> {
  return api.delete(`/tenants/${tenantId}/uploads/${filename}`)
}

function GaleriaPage() {
  const { user } = useAuth()
  const tenantId = user && 'tenantId' in user ? (user as TenantUser).tenantId : ''

  const [images, setImages] = useState<GaleriaImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!tenantId) return
    setLoading(true)
    listarGaleria(tenantId)
      .then(setImages)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tenantId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !tenantId) return
    setUploading(true)
    try {
      await uploadImagem(tenantId, file)
      const updated = await listarGaleria(tenantId)
      setImages(updated)
    } catch { /* ignore */ }
    setUploading(false)
  }

  const handleDelete = async (filename: string) => {
    if (!tenantId) return
    try {
      await excluirImagem(tenantId, filename)
      setImages((prev) => prev.filter((i) => i.filename !== filename))
    } catch { /* ignore */ }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(window.location.origin + url)
  }

  if (!tenantId) {
    return <div className="text-base-content/60 p-8 text-center">Selecione uma loja primeiro</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Galeria de Imagens</h1>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="btn btn-accent btn-sm gap-2"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Upload
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-base-content/40 gap-3">
          <ImageIcon size={48} />
          <p>Nenhuma imagem enviada ainda</p>
          <button onClick={() => inputRef.current?.click()} className="btn btn-ghost btn-sm">
            Enviar primeira imagem
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((img) => (
            <div key={img.filename} className="group relative aspect-square rounded-lg overflow-hidden border border-base-300 bg-base-100">
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => handleCopyUrl(img.url)}
                  className="btn btn-xs btn-ghost text-white"
                  title="Copiar URL"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => handleDelete(img.filename)}
                  className="btn btn-xs btn-ghost text-white"
                  title="Excluir"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
