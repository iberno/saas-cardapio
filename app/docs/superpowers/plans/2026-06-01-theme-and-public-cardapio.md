# Theme System + Public Cardápio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add global light/dark theme toggle, per-store color customization, and public cardápio page.

**Architecture:** Frontend ThemeContext for global toggle (DaisyUI `business`/`corporate`), Prisma JSON field on Tenant for per-store colors, new REST endpoints for theme CRUD, public routes without auth.

**Tech Stack:** DaisyUI 5 themes, CSS custom properties, Prisma JSON field, TanStack Router

---

### Task 1: Global Theme Toggle (Light/Dark)

**Files:**
- Modify: `web/src/index.css`
- Create: `web/src/lib/theme-context.tsx`
- Create: `web/src/components/ui/ThemeToggle.tsx`
- Modify: `web/src/routes/__root.tsx`
- Modify: `web/src/components/PublicHeader.tsx`
- Modify: `web/src/components/AdminSidebar.tsx`

- [ ] **Step 1: Add `corporate` theme to DaisyUI config**

Edit `web/src/index.css`:
```css
@plugin "daisyui" {
  themes: business --default, corporate;
}
```

- [ ] **Step 2: Create ThemeContext**

Create `web/src/lib/theme-context.tsx`:
```tsx
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

type Theme = 'business' | 'corporate'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'business'
  return (localStorage.getItem('theme') as Theme) || 'business'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'business' ? 'corporate' : 'business'))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
```

- [ ] **Step 3: Create ThemeToggle component**

Create `web/src/components/ui/ThemeToggle.tsx`:
```tsx
import { useTheme } from '../../lib/theme-context'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button onClick={toggleTheme} className="btn btn-ghost btn-sm btn-square" title={theme === 'business' ? 'Tema claro' : 'Tema escuro'}>
      {theme === 'business' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
```

- [ ] **Step 4: Wrap app with ThemeProvider**

Edit `web/src/routes/__root.tsx` — import `ThemeProvider` and wrap `RootComponent` children:
```tsx
import { ThemeProvider } from '../lib/theme-context'
...
<ThemeProvider><Outlet /></ThemeProvider>
```

- [ ] **Step 5: Add toggle to PublicHeader and AdminSidebar**

`PublicHeader`: import `ThemeToggle` and add it next to the "Teste Grátis" button.

`AdminSidebar`: import `ThemeToggle` and add it at the bottom of the sidebar, after the nav links.

- [ ] **Step 6: Build & verify**

```bash
cd web && npx vite build
```


### Task 2: Backend — Theme Field + Endpoint

**Files:**
- Modify: `app/prisma/schema.prisma`
- Modify: `app/src/app.module.ts`
- Create: `app/src/tenant/theme/theme.module.ts`
- Create: `app/src/tenant/theme/theme.controller.ts`
- Create: `app/src/tenant/theme/theme.service.ts`
- Create: `app/src/tenant/theme/dto/update-theme.dto.ts`

- [ ] **Step 1: Add `theme` JSON field to Tenant model**

Edit `app/prisma/schema.prisma` — add after `status`:
```
theme    Json?    @map("theme")
```

Run:
```bash
cd app && npx prisma db push
```

- [ ] **Step 2: Create UpdateThemeDto**

Create `app/src/tenant/theme/dto/update-theme.dto.ts`:
```ts
import { IsOptional, IsString } from 'class-validator';

export class UpdateThemeDto {
  @IsOptional() @IsString() primary?: string;
  @IsOptional() @IsString() primaryContent?: string;
  @IsOptional() @IsString() secondary?: string;
  @IsOptional() @IsString() secondaryContent?: string;
  @IsOptional() @IsString() accent?: string;
  @IsOptional() @IsString() accentContent?: string;
  @IsOptional() @IsString() neutral?: string;
  @IsOptional() @IsString() neutralContent?: string;
  @IsOptional() @IsString() base100?: string;
  @IsOptional() @IsString() base200?: string;
  @IsOptional() @IsString() base300?: string;
  @IsOptional() @IsString() baseContent?: string;
}
```

- [ ] **Step 3: Create ThemeService**

Create `app/src/tenant/theme/theme.service.ts`:
```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class ThemeService {
  constructor(private prisma: PrismaService) {}

  async getTheme(tenantId: string) {
    const tenant = await this.prisma.platform().tenant.findUnique({
      where: { id: tenantId },
      select: { theme: true },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant.theme || {};
  }

  async updateTheme(tenantId: string, theme: Record<string, string>) {
    const tenant = await this.prisma.platform().tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return this.prisma.platform().tenant.update({
      where: { id: tenantId },
      data: { theme },
      select: { theme: true },
    });
  }
}
```

- [ ] **Step 4: Create ThemeController**

Create `app/src/tenant/theme/theme.controller.ts`:
```ts
import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ThemeService } from './theme.service';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { TenantUserAuthGuard } from '../../common/guards/tenant-user-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ForbiddenException } from '@nestjs/common';

@Controller('tenants/:tenantId/theme')
export class ThemeController {
  constructor(private service: ThemeService) {}

  @Get()
  get(@Param('tenantId') tenantId: string) {
    return this.service.getTheme(tenantId);
  }

  @UseGuards(TenantUserAuthGuard)
  @Put()
  async update(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateThemeDto,
    @CurrentUser() user: any,
  ) {
    if (user.tenantId !== tenantId) throw new ForbiddenException();
    return this.service.updateTheme(tenantId, dto as Record<string, string>);
  }
}
```

- [ ] **Step 5: Create ThemeModule**

Create `app/src/tenant/theme/theme.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { ThemeController } from './theme.controller';
import { ThemeService } from './theme.service';

@Module({
  controllers: [ThemeController],
  providers: [ThemeService],
})
export class ThemeModule {}
```

- [ ] **Step 6: Register in AppModule**

Add to `app/src/app.module.ts`:
```ts
import { ThemeModule } from './tenant/theme/theme.module';
...
imports: [..., ThemeModule, ...]
```

- [ ] **Step 7: Rebuild & test**

```bash
cd app && npx nest build
```
Restart server, test:
```bash
curl -s -b /tmp/scookies.txt "http://127.0.0.1:3001/api/tenants/$TENANT_ID/theme"
```


### Task 3: Frontend — Theme Settings Page

**Files:**
- Create: `web/src/types/theme.ts`
- Create: `web/src/services/theme.service.ts`
- Create: `web/src/routes/admin.loja.aparencia.lazy.tsx`
- Modify: `web/src/routes/__root.tsx` — add route
- Modify: `web/src/components/AdminSidebar.tsx` — add "Aparência" link

- [ ] **Step 1: Create Theme type**

Create `web/src/types/theme.ts`:
```ts
export interface StoreTheme {
  primary?: string
  primaryContent?: string
  secondary?: string
  secondaryContent?: string
  accent?: string
  accentContent?: string
  neutral?: string
  neutralContent?: string
  base100?: string
  base200?: string
  base300?: string
  baseContent?: string
}
```

Export from `web/src/types/index.ts`.

- [ ] **Step 2: Create theme service**

Create `web/src/services/theme.service.ts`:
```ts
import { api } from '../lib/api-client'
import type { StoreTheme } from '../types'

export async function getTheme(tenantId: string): Promise<StoreTheme> {
  return api.get<StoreTheme>(`/tenants/${tenantId}/theme`)
}

export async function updateTheme(tenantId: string, theme: StoreTheme): Promise<{ theme: StoreTheme }> {
  return api.put<{ theme: StoreTheme }>(`/tenants/${tenantId}/theme`, theme)
}
```

- [ ] **Step 3: Create theme settings page**

Create `web/src/routes/admin.loja.aparencia.lazy.tsx` with:
- Fetch current theme via `getTheme(tenantId)`
- Color inputs for each token (using `<input type="color">`)
- Preview section showing colors
- Save button calling `updateTheme`

Full content:
```tsx
import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth-context'
import { getTheme, updateTheme } from '../services/theme.service'
import { Card, Button, Spinner } from '../components/ui'
import { Save } from 'lucide-react'
import type { StoreTheme, TenantUser } from '../types'

const COLOR_FIELDS: { key: keyof StoreTheme; label: string }[] = [
  { key: 'primary', label: 'Primária' },
  { key: 'primaryContent', label: 'Texto na Primária' },
  { key: 'secondary', label: 'Secundária' },
  { key: 'secondaryContent', label: 'Texto na Secundária' },
  { key: 'accent', label: 'Destaque' },
  { key: 'accentContent', label: 'Texto no Destaque' },
  { key: 'neutral', label: 'Neutra' },
  { key: 'neutralContent', label: 'Texto na Neutra' },
  { key: 'base100', label: 'Fundo' },
  { key: 'base200', label: 'Fundo 2' },
  { key: 'base300', label: 'Fundo 3' },
  { key: 'baseContent', label: 'Texto Principal' },
]

export const Route = createLazyFileRoute('/admin/loja/aparencia')({
  component: AppearancePage,
})

function AppearancePage() {
  const { user } = useAuth()
  const tenantId = user && 'tenantId' in user ? (user as TenantUser).tenantId : ''
  const [theme, setTheme] = useState<StoreTheme>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!tenantId) return
    getTheme(tenantId)
      .then(setTheme)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tenantId])

  const handleSave = async () => {
    if (!tenantId) return
    setSaving(true)
    try {
      await updateTheme(tenantId, theme)
    } catch {}
    setSaving(false)
  }

  const setColor = (key: keyof StoreTheme, value: string) => {
    setTheme((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) return <Spinner size="lg" />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Aparência da Loja</h1>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COLOR_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <label className="text-sm text-white/60 block mb-1">{label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme[key] || '#000000'}
                  onChange={(e) => setColor(key, e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-white/10"
                />
                <input
                  type="text"
                  value={theme[key] || ''}
                  onChange={(e) => setColor(key, e.target.value)}
                  className="input input-sm w-full"
                  placeholder="#000000"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Button onClick={handleSave} loading={saving} icon={Save}>Salvar</Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-white font-semibold mb-4">Pré-visualização</h3>
        <div
          className="rounded-xl p-6 space-y-3"
          style={{
            backgroundColor: theme.base100 || '#1e1e2d',
            color: theme.baseContent || '#cdd2da',
          }}
        >
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-lg text-sm font-medium" style={{ backgroundColor: theme.primary || '#763d6e', color: theme.primaryContent || '#fff' }}>Botão</span>
            <span className="px-3 py-1 rounded-lg text-sm font-medium" style={{ backgroundColor: theme.secondary || '#d4555a', color: theme.secondaryContent || '#fff' }}>Secundário</span>
            <span className="px-3 py-1 rounded-lg text-sm font-medium" style={{ backgroundColor: theme.accent || '#2d865b', color: theme.accentContent || '#fff' }}>Destaque</span>
          </div>
          <p className="text-sm">Texto de exemplo com a cor <span style={{ color: theme.primary }}>primária</span> e <span style={{ color: theme.accent }}>destaque</span>.</p>
        </div>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Register route**

In `web/src/routes/__root.tsx`, import and add to the admin/loja group:
```ts
import { Route as aparenciaRoute } from './admin.loja.aparencia.lazy'
```
Under the `/admin/loja/` group:
```tsx
new Route({ getParentRoute: () => lojaRoute, path: 'aparencia', component: aparenciaRoute }),
```

- [ ] **Step 5: Add sidebar link**

In `web/src/components/AdminSidebar.tsx`, add after the cardápio link:
```tsx
<SidebarLink to="/admin/loja/aparencia" icon={Palette}>Aparência</SidebarLink>
```
Import `Palette` from `lucide-react`.

- [ ] **Step 6: Build & verify**

```bash
cd web && npx vite build
```


### Task 4: Public Cardápio Endpoints

**Files:**
- Create: `app/src/cardapio/public-cardapio.controller.ts`
- Modify: `app/src/cardapio/cardapio.module.ts`

- [ ] **Step 1: Create public controller**

Create `app/src/cardapio/public-cardapio.controller.ts`:
```ts
import { Controller, Get, Param } from '@nestjs/common';
import { CardapioService } from './cardapio.service';
import { PrismaService } from '../infra/prisma/prisma.service';

@Controller('public')
export class PublicCardapioController {
  constructor(
    private cardapio: CardapioService,
    private prisma: PrismaService,
  ) {}

  @Get(':slug/produtos')
  async getProdutos(@Param('slug') slug: string) {
    const tenant = await this.prisma.platform().tenant.findUnique({ where: { slug }, select: { id: true } });
    if (!tenant) return { data: [], total: 0, page: 1, limit: 50, totalPages: 0 };
    return this.cardapio.findAll(tenant.id, {});
  }

  @Get(':slug/loja')
  async getLoja(@Param('slug') slug: string) {
    return this.prisma.platform().tenant.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, theme: true, contactEmail: true },
    });
  }
}
```

- [ ] **Step 2: Register in CardapioModule**

Edit `app/src/cardapio/cardapio.module.ts`:
```ts
import { PublicCardapioController } from './public-cardapio.controller';
...
controllers: [CardapioController, PublicCardapioController],
```

- [ ] **Step 3: Rebuild & test**

```bash
cd app && npx nest build
```
Restart server, test:
```bash
curl -s "http://127.0.0.1:3001/api/public/acai/produtos" | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'Produtos: {d[\"total\"]}')"
curl -s "http://127.0.0.1:3001/api/public/acai/loja" | python3 -m json.tool
```


### Task 5: Public Cardápio Page

**Files:**
- Create: `web/src/routes/loja.$slug.lazy.tsx`
- Modify: `web/src/routes/__root.tsx` — add route

- [ ] **Step 1: Create public cardápio page**

Create `web/src/routes/loja.$slug.lazy.tsx`:
```tsx
import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { api } from '../lib/api-client'
import { Spinner } from '../components/ui'
import type { Produto, StoreTheme } from '../types'
import { CATEGORIAS, CATEGORIA_LABEL } from '../types'
import { Phone, MapPin, Clock, Instagram } from 'lucide-react'

interface LojaInfo {
  id: string
  name: string
  slug: string
  theme: StoreTheme | null
  contactEmail: string | null
}

export const Route = createLazyFileRoute('/loja/$slug')({
  component: PublicCardapioPage,
})

function PublicCardapioPage() {
  const { slug } = Route.useParams()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loja, setLoja] = useState<LojaInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<{ data: Produto[] }>(`/public/${slug}/produtos`),
      api.get<LojaInfo | null>(`/public/${slug}/loja`),
    ])
      .then(([p, l]) => {
        setProdutos(p.data)
        setLoja(l)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  const t = loja?.theme || {}

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ backgroundColor: t.base100 || '#faf5f0' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (!loja) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ backgroundColor: t.base100 || '#faf5f0' }}>
        <p style={{ color: t.baseContent }}>Loja não encontrada</p>
      </div>
    )
  }

  return (
    <div
      className="min-h-dvh"
      style={{
        backgroundColor: t.base100 || '#faf5f0',
        color: t.baseContent || '#2c1810',
        '--color-primary': t.primary || '#763d6e',
        '--color-primary-content': t.primaryContent || '#ffffff',
        '--color-accent': t.accent || '#2d865b',
      } as React.CSSProperties}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-30 shadow-sm"
        style={{ backgroundColor: t.base100 || '#faf5f0', borderBottom: `1px solid ${t.base200 || '#f0e8e0'}` }}
      >
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-xl font-bold" style={{ color: t.primary }}>{loja.name}</h1>
        </div>
      </header>

      {/* Products */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {produtos.length === 0 ? (
          <p className="text-center text-sm" style={{ opacity: 0.6 }}>Cardápio em breve</p>
        ) : (
          CATEGORIAS.map((cat) => {
            const items = produtos.filter((p) => p.categoria === cat && p.disponivel)
            if (items.length === 0) return null
            return (
              <div key={cat}>
                <h2 className="font-bold text-lg mb-3 flex items-center gap-2" style={{ color: t.primary }}>
                  <span className="w-1 h-5 rounded-full" style={{ backgroundColor: t.accent }} />
                  {CATEGORIA_LABEL[cat]}
                </h2>
                <div className="space-y-2">
                  {items.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl p-4 flex items-center justify-between"
                      style={{ backgroundColor: t.base200 || '#f0e8e0' }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium" style={{ color: t.baseContent }}>{p.nome}</p>
                        {p.descricao && <p className="text-xs mt-0.5" style={{ opacity: 0.6 }}>{p.descricao}</p>}
                      </div>
                      <span className="font-bold text-sm ml-3" style={{ color: t.accent }}>
                        R$ {Number(p.preco).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </main>

      {/* WhatsApp button */}
      {loja.contactEmail && (
        <div className="sticky bottom-0 p-4">
          <a
            href={`https://wa.me/${loja.contactEmail.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn w-full max-w-lg mx-auto flex items-center gap-2 shadow-lg rounded-xl text-white font-semibold"
            style={{ backgroundColor: t.primary || '#25D366' }}
          >
            <Phone size={18} />
            Pedir pelo WhatsApp
          </a>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Register route**

In `web/src/routes/__root.tsx`, add:
```ts
import { Route as lojaSlugRoute } from './loja.$slug.lazy'
...
new Route({ path: '/loja/$slug', component: lojaSlugRoute }),
```

- [ ] **Step 3: Build & verify**

```bash
cd web && npx vite build
```


### Task 6: End-to-End Verification

- [ ] **Step 1: Restart backend, run e2e tests**

```bash
kill $(lsof -ti:3001) 2>/dev/null; sleep 1
cd app && node dist/src/main.js &
sleep 3
npx vitest run test/e2e --no-file-parallelism
```

Expected: 33/33 passing.

- [ ] **Step 2: Full frontend build**

```bash
cd web && npx vite build
```

Expected: Build completes without errors.

- [ ] **Step 3: Test public cardápio via curl**

```bash
curl -s "http://127.0.0.1:3001/api/public/acai/produtos" | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'OK: {d[\"total\"]} produtos')"
curl -s "http://127.0.0.1:3001/api/public/acai/loja" | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'OK: loja {d[\"name\"]}')"
```

- [ ] **Step 4: Commit**

```bash
cd /home/iberno/Projetos/saas-cardapio
git add -A
git commit -m "feat: theme system + public cardapio page

- Light/dark toggle com ThemeContext (business/corporate)
- Store theme colors via Prisma JSON field + API endpoint
- Theme settings page /admin/loja/aparencia com color pickers
- Public cardapio page /loja/:slug com cores da loja
- Public API endpoints GET /api/public/:slug/{produtos,loja}
"
```
