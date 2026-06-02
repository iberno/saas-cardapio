import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { uploadImagem } from '../../services/upload.service'

interface ImageUploadProps {
  tenantId: string
  currentUrl?: string | null
  onUpload: (url: string) => void
  onRemove?: () => void
}

export function ImageUpload({ tenantId, currentUrl, onUpload, onRemove }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { url } = await uploadImagem(tenantId, file)
      onUpload(url)
    } catch {
      // silently fail — could add error toast later
    }
    setUploading(false)
  }

  return (
    <div className="flex items-center gap-3">
      {currentUrl ? (
        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-base-300">
          <img src={currentUrl} alt="" className="w-full h-full object-cover" />
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-0.5 right-0.5 btn btn-xs btn-circle btn-ghost bg-base-100/80"
            >
              <X size={12} />
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="w-20 h-20 rounded-lg border-2 border-dashed border-base-300 flex items-center justify-center cursor-pointer hover:border-accent"
        >
          {uploading ? <span className="loading loading-spinner" /> : <Upload size={20} className="opacity-40" />}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
    </div>
  )
}
