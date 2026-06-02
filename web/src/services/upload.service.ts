import { obtainCsrf } from '../lib/api-client'

export async function uploadImagem(tenantId: string, file: File): Promise<{ url: string; filename: string }> {
  const formData = new FormData()
  formData.append('file', file)
  const csrfToken = await obtainCsrf()
  const res = await fetch(`/api/tenants/${tenantId}/upload`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-CSRF-Token': csrfToken },
    body: formData,
  })
  if (!res.ok) throw new Error('Upload failed')
  return res.json()
}
