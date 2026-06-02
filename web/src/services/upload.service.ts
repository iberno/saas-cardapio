export async function uploadImagem(tenantId: string, file: File): Promise<{ url: string; filename: string }> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`/api/tenants/${tenantId}/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  if (!res.ok) throw new Error('Upload failed')
  return res.json()
}
