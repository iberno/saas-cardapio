# Front/Back Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align frontend with existing backend: galeria, `exibirPrecoAPartirDe`, preço auto-calculado, categoria objeto completo, DTO categoria opcional.

**Architecture:** Backend changes in upload + cardapio modules; frontend changes in new galeria route + existing cardapio form + sidebar nav.

**Tech Stack:** NestJS, Prisma, React, TanStack Router, Tailwind v4, DaisyUI, Lucide

---

### Task 1: Galeria — Backend (GET list + reuse DELETE)

**Files:**
- Modify: `app/src/cardapio/upload/upload.service.ts`
- Modify: `app/src/cardapio/upload/upload.controller.ts`

- [ ] **Step 1: Add `listar` method to UploadService**

```typescript
// Add to UploadService after `delete()`
async listar(tenantSlug: string) {
  const dir = join(this.uploadDir, tenantSlug);
  if (!existsSync(dir)) return [];
  const files = await readdir(dir);
  const entries = await Promise.all(
    files.map(async (filename) => {
      const filepath = join(dir, filename);
      const stat = await statAsync(filepath);
      if (!stat.isFile()) return null;
      return {
        filename,
        url: `/uploads/${tenantSlug}/${filename}`,
        size: stat.size,
        lastModified: stat.mtime.toISOString(),
      };
    }),
  );
  return entries.filter(Boolean).sort(
    (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime(),
  );
}
```

Add the necessary imports at top:
```typescript
import { readdir, stat as statAsync } from 'fs/promises';
```

- [ ] **Step 2: Add GET galeria endpoint to UploadController**

```typescript
// Add after delete() method
@Get('galeria')
async listar(@Param('tenantId') tenantId: string) {
  const tenant = await this.tenantService.findById(tenantId);
  if (!tenant) throw new BadRequestException('Tenant not found');
  return this.service.listar(tenant.slug);
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add galeria endpoint GET /tenants/:id/galeria"
```

---

### Task 2: Galeria — Frontend (service + route + sidebar)

**Files:**
- Create: `web/src/services/galeria.service.ts`
- Create: `web/src/routes/admin.loja.galeria.lazy.tsx`
- Modify: `web/src/components/layout/AdminSidebar.tsx`

- [ ] **Step 1: Create galeria service**

```typescript
// web/src/services/galeria.service.ts
import { api } from '../lib/api-client'

export interface GaleriaImage {
  filename: string
  url: string
  size: number
  lastModified: string
}

export async function listarGaleria(tenantId: string): Promise<GaleriaImage[]> {
  return api.get(`/tenants/${tenantId}/galeria`)
}

export async function excluirImagemGaleria(tenantId: string, filename: string): Promise<void> {
  return api.delete(`/tenants/${tenantId}/uploads/${filename}`)
}
```

Export `GaleriaImage` type from index:
```typescript
// Add to web/src/types/index.ts
export type { GaleriaImage } from '../services/galeria.service'
```

- [ ] **Step 2: Create galeria route page**

```tsx
// web/src/routes/admin.loja.galeria.lazy.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '../lib/auth-context'
import { useEffect, useState, useRef } from 'react'
import { Upload, Copy, Trash2, Loader2, ImageIcon } from 'lucide-react'
import { listarGaleria, excluirImagemGaleria, uploadImagem } from '../services'
import type { GaleriaImage } from '../services'

export const Route = createFileRoute('/admin/loja/galeria')({
  component: GaleriaPage,
})

function GaleriaPage() {
  const { tenantId } = useAuth()
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
      await excluirImagemGaleria(tenantId, filename)
      setImages((prev) => prev.filter((i) => i.filename !== filename))
    } catch { /* ignore */ }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
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
          <Loader2 size={32} className="animate-spin text-base-content/40" />
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
```

- [ ] **Step 3: Add "Galeria" to sidebar**

```typescript
// In AdminSidebar.tsx imports, add: Images (from lucide-react)
// Add after Banners nav item:
{
  label: 'Galeria',
  path: '/admin/loja/galeria',
  icon: Images,
  showFor: 'tenant',
},
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add galeria frontend page and sidebar nav"
```

---

### Task 3: `exibirPrecoAPartirDe` — Backend DTOs

**Files:**
- Modify: `app/src/cardapio/dto/create-produto.dto.ts`
- Modify: `app/src/cardapio/dto/update-produto.dto.ts`

- [ ] **Step 1: Add field to CreateProdutoDto**

```typescript
// Add after imagemUrl:
@IsOptional()
@IsBoolean()
exibirPrecoAPartirDe?: boolean;
```

- [ ] **Step 2: Add field to UpdateProdutoDto**

```typescript
// Add after imagemUrl:
@IsOptional()
@IsBoolean()
exibirPrecoAPartirDe?: boolean;
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add exibirPrecoAPartirDe to produto DTOs"
```

---

### Task 4: `exibirPrecoAPartirDe` — Frontend types + form

**Files:**
- Modify: `web/src/types/cardapio.ts`
- Modify: `web/src/routes/admin.loja.cardapio.lazy.tsx`

- [ ] **Step 1: Add field to types**

```typescript
// In CreateProdutoRequest, add:
exibirPrecoAPartirDe?: boolean
// In UpdateProdutoRequest, add:
exibirPrecoAPartirDe?: boolean
```

- [ ] **Step 2: Add checkbox to product form**

In `admin.loja.cardapio.lazy.tsx`, in the modal form section (around the preco field), add:
```tsx
<label className="flex items-center gap-2 cursor-pointer">
  <input
    type="checkbox"
    checked={form.exibirPrecoAPartirDe ?? true}
    onChange={(e) => setForm((f) => ({ ...f, exibirPrecoAPartirDe: e.target.checked }))}
    className="checkbox checkbox-sm"
  />
  <span className="text-sm">Exibir "a partir de"</span>
</label>
```

Also initialize in `blank()` factory:
```typescript
const blank = (): FState => ({
  // ...existing fields
  exibirPrecoAPartirDe: true,
})
```

Also update the edit handler to populate the field from existing produto:
```typescript
// In openEdit, add:
exibirPrecoAPartirDe: p.exibirPrecoAPartirDe,
```

Also pass to save handler:
```typescript
// In handleSave, add to data:
exibirPrecoAPartirDe: form.exibirPrecoAPartirDe,
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add exibirPrecoAPartirDe to frontend form"
```

---

### Task 5: Preço auto-calculado via variantes

**Files:**
- Modify: `app/src/cardapio/cardapio.service.ts`

- [ ] **Step 1: Add variantes include and preço calculation**

In `findAll`, modify the `findMany` call:
```typescript
const [data, total] = await Promise.all([
  this.prisma.platform().produto.findMany({
    where, skip, take: limit, orderBy,
    include: { variantes: true },
  }),
  this.prisma.platform().produto.count({ where }),
]);

// Calculate preco as min variant price
const dataWithPreco = data.map((produto) => {
  if (produto.variantes.length > 0) {
    const minPreco = Math.min(...produto.variantes.map((v) => Number(v.preco)));
    return { ...produto, preco: new Prisma.Decimal(minPreco) };
  }
  return produto;
});

return { data: dataWithPreco, total, page, limit, totalPages: Math.ceil(total / limit) };
```

In `findOne`, modify:
```typescript
const produto = await this.prisma.platform().produto.findFirst({
  where: { id, tenantId },
  include: { variantes: true },
});
if (!produto) throw new NotFoundException('Produto not found');
if (produto.variantes.length > 0) {
  const minPreco = Math.min(...produto.variantes.map((v) => Number(v.preco)));
  return { ...produto, preco: new Prisma.Decimal(minPreco) };
}
return produto;
```

Remove unused imports: `Categoria` from Prisma import if no longer needed.

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: auto-calculate preco as min variant price"
```

---

### Task 6: Categoria objeto completo

**Files:**
- Modify: `app/src/cardapio/cardapio.service.ts`

- [ ] **Step 1: Add categoriaCardapio include**

In `findAll`, add `categoriaCardapio` to the include:
```typescript
include: {
  variantes: true,
  categoriaCardapio: true,
},
```

In `findOne`, add to include:
```typescript
include: {
  variantes: true,
  categoriaCardapio: true,
},
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: include categoriaCardapio full object in produto response"
```

---

### Task 7: DTO categoria opcional

**Files:**
- Modify: `app/src/cardapio/dto/create-produto.dto.ts`
- Modify: `app/src/cardapio/cardapio.service.ts`
- Modify: `web/src/types/cardapio.ts`
- Modify: `web/src/routes/admin.loja.cardapio.lazy.tsx`

- [ ] **Step 1: Make categoria optional in CreateProdutoDto**

```typescript
// Change from:
@IsEnum(Categoria)
categoria: Categoria;
// To:
@IsOptional()
@IsEnum(Categoria)
categoria?: Categoria;
```

- [ ] **Step 2: Default categoria in service if not provided**

In `CardapioService.create`:
```typescript
create(tenantId: string, dto: CreateProdutoDto) {
  const data: any = {
    ...dto,
    tenantId,
    preco: new Prisma.Decimal(dto.preco),
    categoria: dto.categoria ?? 'BEBIDAS',
  };
  return this.prisma.platform().produto.create({ data });
}
```

- [ ] **Step 3: Update frontend types**

```typescript
// In CreateProdutoRequest, make categoria optional:
categoria?: CategoriaEnum
```

- [ ] **Step 4: Remove categoria enum select from form**

In `admin.loja.cardapio.lazy.tsx`, remove the `categoria` (enum) select field from the form. Keep only `categoriaId` (select from CategoriaCardapio list).

Also remove `categoria` from the `blank()` factory's initial state (keep only `categoriaId: null`).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: make categoria enum optional in DTO and frontend"
```

---

### Task 8: Verify everything works

**Files:** N/A

- [ ] **Step 1: Rebuild backend**

```bash
cd app && npm run build
```

- [ ] **Step 2: Restart server with JWT_SECRET**

```bash
kill $(lsof -ti :3001) 2>/dev/null; sleep 1; JWT_SECRET="dev-jwt-secret-change-in-production" node dist/src/main > /tmp/server.log 2>&1 &
```

- [ ] **Step 3: Run e2e tests**

```bash
cd app && npx vitest run test/e2e --no-file-parallelism
```
Expected: 56/56 passing

- [ ] **Step 4: Check TypeScript on frontend**

```bash
cd web && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 5: Final commit**

```bash
git add -A && git commit -m "feat: align frontend with backend specs"
```
