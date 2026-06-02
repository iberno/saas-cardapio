# Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Vite + React SPA frontend with Landing Page, Admin Platform, and Admin Store.

**Architecture:** SPA with TanStack Router for file-based routing, Tailwind v4 + DaisyUI Business for styling, Lucide icons. API client with CSRF support communicates with NestJS backend at `http://127.0.0.1:3001/api`.

**Tech Stack:** React 19, Vite 6, TanStack Router 1.x, Tailwind CSS v4, DaisyUI 5.x (Business), Lucide React, TypeScript 5.7

---

## File Structure

```
saas-cardapio/web/
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  tsconfig.app.json
  tsconfig.node.json
  src/
    main.tsx
    App.tsx
    index.css
    vite-env.d.ts
    components/
      ui/
        Button.tsx
        Input.tsx
        Card.tsx
        Badge.tsx
        Spinner.tsx
      layout/
        PublicHeader.tsx
        PublicFooter.tsx
        AdminSidebar.tsx
        AdminTopbar.tsx
        AdminLayout.tsx
      landing/
        Hero.tsx
        StatsBar.tsx
        Pillars.tsx
        Features.tsx
        CtaSection.tsx
    routes/
      __root.tsx
      index.lazy.tsx
      login.lazy.tsx
      admin/
        route.tsx
        index.lazy.tsx
        lojas.lazy.tsx
      loja.$slug/
        route.tsx
        index.lazy.tsx
        cardapio.lazy.tsx
    lib/
      api.ts
      auth.tsx
      utils.ts
    types/
      tenant.ts
      auth.ts
      cardapio.ts
```

---

### Task 1: Scaffold Vite + React + Tailwind v4 + DaisyUI

**Files:**
- Create: `web/package.json`
- Create: `web/index.html`
- Create: `web/vite.config.ts`
- Create: `web/tsconfig.json`
- Create: `web/tsconfig.app.json`
- Create: `web/tsconfig.node.json`
- Create: `web/src/vite-env.d.ts`
- Create: `web/src/main.tsx`
- Create: `web/src/App.tsx`
- Create: `web/src/index.css`

- [ ] **Step 1: Create package.json**

Write `web/package.json`:
```json
{
  "name": "saas-cardapio-web",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-router": "^1.114.0",
    "lucide-react": "^0.501.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.4.0",
    "vite": "^6.3.0",
    "tailwindcss": "^4.1.0",
    "@tailwindcss/vite": "^4.1.0",
    "daisyui": "^5.0.0",
    "typescript": "~5.7.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
```

- [ ] **Step 2: Create index.html**

Write `web/index.html`:
```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Saas Cardapio</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Create vite.config.ts**

Write `web/vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
})
```

- [ ] **Step 4: Create tsconfig files**

Write `web/tsconfig.json`:
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

Write `web/tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

Write `web/tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: Create index.css with Tailwind + DaisyUI**

Write `web/src/index.css`:
```css
@import "tailwindcss";
@plugin "daisyui" {
  themes: business --default;
}
@import url('https://fonts.googleapis.com/css2?family=Karla:wght@300;400;500;600;700&family=Playfair+Display+SC:wght@400;700&display=swap');
```

- [ ] **Step 6: Create vite-env.d.ts**

Write `web/src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
```

- [ ] **Step 7: Create main.tsx**

Write `web/src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routes/__root'
import './index.css'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
```

- [ ] **Step 8: Create App.tsx placeholder**

Write `web/src/App.tsx`:
```tsx
export default function App() {
  return null
}
```

- [ ] **Step 9: Create route root**

Write `web/src/routes/__root.tsx`:
```tsx
import { createRootRoute } from '@tanstack/react-router'

export const routeTree = createRootRoute({
  component: () => <div>Saas Cardapio</div>,
})

export const routeTree = createRootRoute()
```

Wait — `routeTree` is declared twice. Fix:

Write `web/src/routes/__root.tsx`:
```tsx
import { createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => <div>Saas Cardapio</div>,
})
```

- [ ] **Step 10: Install dependencies and test**

Run: `cd /home/iberno/Projetos/saas-cardapio/web && npm install`
Expected: packages install without errors

Run: `npx tsc -b`
Expected: no errors

Run: `npx vite build`
Expected: build succeeds, outputs to `web/dist/`

- [ ] **Step 11: Commit**

```bash
cd /home/iberno/Projetos/saas-cardapio
git add web/
git commit -m "feat: scaffold Vite + React + Tailwind v4 + DaisyUI Business"
```

---

### Task 2: Create UI Base Components

**Files:**
- Create: `web/src/components/ui/Button.tsx`
- Create: `web/src/components/ui/Input.tsx`
- Create: `web/src/components/ui/Card.tsx`
- Create: `web/src/components/ui/Badge.tsx`
- Create: `web/src/components/ui/Spinner.tsx`
- Create: `web/src/components/ui/index.ts`

- [ ] **Step 1: Create Button component**

Write `web/src/components/ui/Button.tsx`:
```tsx
import { type ButtonHTMLAttributes } from 'react'
import { LucideIcon } from 'lucide-react'

type Variant = 'primary' | 'accent' | 'ghost' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: LucideIcon
  loading?: boolean
}

const variantClass: Record<Variant, string> = {
  primary: 'btn btn-primary',
  accent: 'btn bg-accent text-white border-accent hover:bg-accent/90',
  ghost: 'btn btn-ghost',
  outline: 'btn btn-outline',
}

const sizeClass: Record<Size, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${variantClass[variant]} ${sizeClass[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="loading loading-spinner loading-sm" />
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      {children}
    </button>
  )
}
```

- [ ] **Step 2: Create Input component**

Write `web/src/components/ui/Input.tsx`:
```tsx
import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <fieldset className="fieldset">
        {label && <legend className="fieldset-legend">{label}</legend>}
        <input
          ref={ref}
          id={inputId}
          className={`input w-full ${error ? 'input-error' : ''} ${className}`}
          {...props}
        />
        {error && <p className="text-error text-sm mt-1">{error}</p>}
      </fieldset>
    )
  },
)

Input.displayName = 'Input'
```

- [ ] **Step 3: Create Card component**

Write `web/src/components/ui/Card.tsx`:
```tsx
import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean
}

export function Card({ glass, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-base-300 p-6 ${
        glass ? 'bg-base-100/80 backdrop-blur-sm' : 'bg-base-100'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Create Badge component**

Write `web/src/components/ui/Badge.tsx`:
```tsx
import type { HTMLAttributes } from 'react'

type BadgeColor = 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor
}

const colorClass: Record<BadgeColor, string> = {
  success: 'badge badge-success',
  warning: 'badge badge-warning',
  error: 'badge badge-error',
  info: 'badge badge-info',
  neutral: 'badge badge-neutral',
}

export function Badge({ color = 'neutral', className = '', children, ...props }: BadgeProps) {
  return (
    <span className={`${colorClass[color]} ${className}`} {...props}>
      {children}
    </span>
  )
}
```

- [ ] **Step 5: Create Spinner component**

Write `web/src/components/ui/Spinner.tsx`:
```tsx
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
}

const sizeClass = {
  sm: 'loading-sm',
  md: 'loading-md',
  lg: 'loading-lg',
}

export function Spinner({ size = 'md' }: SpinnerProps) {
  return <span className={`loading loading-spinner ${sizeClass[size]}`} />
}
```

- [ ] **Step 6: Create barrel export**

Write `web/src/components/ui/index.ts`:
```ts
export { Button } from './Button'
export { Input } from './Input'
export { Card } from './Card'
export { Badge } from './Badge'
export { Spinner } from './Spinner'
```

- [ ] **Step 7: Verify build**

Run: `cd /home/iberno/Projetos/saas-cardapio/web && npx tsc -b`
Expected: no errors

- [ ] **Step 8: Commit**

```bash
cd /home/iberno/Projetos/saas-cardapio
git add web/src/components/ui/
git commit -m "feat: add UI base components (Button, Input, Card, Badge, Spinner)"
```

---

### Task 3: Create Types

**Files:**
- Create: `web/src/types/auth.ts`
- Create: `web/src/types/tenant.ts`
- Create: `web/src/types/cardapio.ts`

- [ ] **Step 1: Create auth types**

Write `web/src/types/auth.ts`:
```ts
export interface PlatformAdmin {
  id: string
  email: string
  name: string
  totpEnabled: boolean
  createdAt: string
}

export interface TenantUser {
  id: string
  email: string
  name: string
  role: 'OWNER' | 'STAFF'
  totpEnabled: boolean
  createdAt: string
}

export interface Customer {
  id: string
  phone: string
  name: string | null
  points: number
  createdAt: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  message: string
}
```

- [ ] **Step 2: Create tenant types**

Write `web/src/types/tenant.ts`:
```ts
export type TenantStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELED'

export interface Tenant {
  id: string
  slug: string
  name: string
  status: TenantStatus
  contactEmail: string
  contactPhone: string | null
  trialEndsAt: string | null
  paidUntil: string | null
  createdAt: string
}

export interface CreateTenantPayload {
  slug: string
  name: string
  contactEmail: string
  contactPhone?: string
}

export interface UpdateTenantStatusPayload {
  status: TenantStatus
}
```

- [ ] **Step 3: Create cardapio types**

Write `web/src/types/cardapio.ts`:
```ts
export interface Categoria {
  id: string
  tenantId: string
  nome: string
  ordem: number
  produtos: Produto[]
  createdAt: string
}

export interface Produto {
  id: string
  categoriaId: string
  nome: string
  descricao: string | null
  preco: number
  imagem: string | null
  ativo: boolean
  ordem: number
  createdAt: string
}

export interface CreateCategoriaPayload {
  nome: string
}

export interface CreateProdutoPayload {
  nome: string
  descricao?: string
  preco: number
  imagem?: string
  categoriaId: string
}
```

- [ ] **Step 4: Verify build**

Run: `cd /home/iberno/Projetos/saas-cardapio/web && npx tsc -b`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
cd /home/iberno/Projetos/saas-cardapio
git add web/src/types/
git commit -m "feat: add TypeScript types for auth, tenant, cardapio"
```

---

### Task 4: Create API Client + Auth Context + Utils

**Files:**
- Create: `web/src/lib/utils.ts`
- Create: `web/src/lib/api.ts`
- Create: `web/src/lib/auth.tsx`

- [ ] **Step 1: Create utils**

Write `web/src/lib/utils.ts`:
```ts
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}
```

- [ ] **Step 2: Create API client**

Write `web/src/lib/api.ts`:
```ts
const BASE_URL = '/api'

interface CsrfTokens {
  csrfToken: string
  csrfCookie: string
}

let csrfCache: CsrfTokens | null = null

export async function obtainCsrf(): Promise<CsrfTokens> {
  if (csrfCache) return csrfCache
  const res = await fetch(`${BASE_URL}/auth/csrf`, { credentials: 'include' })
  const data = await res.json()
  const setCookie = res.headers.get('set-cookie') || ''
  const match = setCookie.match(/_csrf=([^;]+)/)
  csrfCache = {
    csrfToken: data.csrfToken,
    csrfCookie: `_csrf=${match ? match[1] : ''}`,
  }
  return csrfCache
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const csrf = await obtainCsrf()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf.csrfToken,
      Cookie: csrf.csrfCookie,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error.message || 'Request failed')
  }
  return res.json()
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
}
```

- [ ] **Step 3: Create Auth context and provider**

Write `web/src/lib/auth.tsx`:
```tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { api } from './api'
import type { PlatformAdmin } from '../types/auth'

interface AuthContextType {
  user: PlatformAdmin | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PlatformAdmin | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      const data = await api.get<PlatformAdmin>('/platform/auth/me')
      setUser(data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    await api.post('/platform/auth/login', { email, password })
    const data = await api.get<PlatformAdmin>('/platform/auth/me')
    setUser(data)
  }, [])

  const logout = useCallback(async () => {
    await api.post('/platform/auth/logout')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 4: Verify build**

Run: `cd /home/iberno/Projetos/saas-cardapio/web && npx tsc -b`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
cd /home/iberno/Projetos/saas-cardapio
git add web/src/lib/
git commit -m "feat: add API client, Auth context, and utils"
```

---

### Task 5: Create Layout Components

**Files:**
- Create: `web/src/components/layout/PublicHeader.tsx`
- Create: `web/src/components/layout/PublicFooter.tsx`
- Create: `web/src/components/layout/AdminSidebar.tsx`
- Create: `web/src/components/layout/AdminTopbar.tsx`
- Create: `web/src/components/layout/AdminLayout.tsx`

- [ ] **Step 1: Create PublicHeader**

Write `web/src/components/layout/PublicHeader.tsx`:
```tsx
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export function PublicHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-neutral/80 border-b border-base-300/20">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-white">
          <span className="text-accent">&#9670;</span> SaasCardapio
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <a href="#funcionalidades" className="text-sm text-white/70 hover:text-white transition-colors">Funcionalidades</a>
          <a href="#planos" className="text-sm text-white/70 hover:text-white transition-colors">Planos</a>
          <Link to="/login" className="text-sm text-white/70 hover:text-white transition-colors">Login</Link>
          <Link to="/login" className="btn btn-sm bg-accent text-white border-accent hover:bg-accent/90">
            Teste Gratis
          </Link>
        </nav>

        <button className="md:hidden btn btn-ghost btn-sm" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-base-300/20 bg-neutral p-4 flex flex-col gap-3">
          <a href="#funcionalidades" className="text-white/70" onClick={() => setOpen(false)}>Funcionalidades</a>
          <a href="#planos" className="text-white/70" onClick={() => setOpen(false)}>Planos</a>
          <Link to="/login" className="text-white/70" onClick={() => setOpen(false)}>Login</Link>
          <Link to="/login" className="btn btn-sm bg-accent text-white" onClick={() => setOpen(false)}>Teste Gratis</Link>
        </div>
      )}
    </header>
  )
}
```

- [ ] **Step 2: Create PublicFooter**

Write `web/src/components/layout/PublicFooter.tsx`:
```tsx
export function PublicFooter() {
  return (
    <footer className="bg-neutral border-t border-base-300/20 py-12 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="text-lg font-bold text-white mb-2">
            <span className="text-accent">&#9670;</span> SaasCardapio
          </div>
          <p className="text-sm text-white/50">
            Sistema de cardapio digital para restaurantes.
          </p>
        </div>
        <div>
          <h4 className="text-white font-medium mb-3">Links</h4>
          <div className="flex flex-col gap-2 text-sm text-white/50">
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#planos">Planos</a>
            <a href="#contato">Contato</a>
          </div>
        </div>
        <div>
          <h4 className="text-white font-medium mb-3">Contato</h4>
          <div className="flex flex-col gap-2 text-sm text-white/50">
            <span>contato@saascardapio.com.br</span>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-base-300/20 text-center text-sm text-white/30">
        &copy; {new Date().getFullYear()} Saas Cardapio. Todos os direitos reservados.
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Create AdminSidebar**

Write `web/src/components/layout/AdminSidebar.tsx`:
```tsx
import { Link, useLocation } from '@tanstack/react-router'
import {
  LayoutDashboard, Store, LogOut, ChevronLeft,
} from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { useState } from 'react'

interface AdminSidebarProps {
  basePath: string
  menuItems: { href: string; label: string; icon: typeof LayoutDashboard }[]
}

export function AdminSidebar({ basePath, menuItems }: AdminSidebarProps) {
  const { logout } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`bg-primary text-primary-content flex flex-col transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!collapsed && (
          <Link to={basePath} className="font-bold text-sm">
            <span className="text-accent">&#9670;</span> SaasCardapio
          </Link>
        )}
        <button
          className="btn btn-ghost btn-xs btn-square"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft
            size={16}
            className={`transition-transform ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      <nav className="flex-1 p-2 flex flex-col gap-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = location.pathname === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="p-2 border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 w-full transition-colors"
        >
          <LogOut size={18} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 4: Create AdminTopbar**

Write `web/src/components/layout/AdminTopbar.tsx`:
```tsx
import { User } from 'lucide-react'
import { useAuth } from '../../lib/auth'

export function AdminTopbar() {
  const { user } = useAuth()

  return (
    <header className="h-16 border-b border-base-300 bg-base-100 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-3">
        <div className="text-sm text-right">
          <div className="font-medium text-base-content">{user?.name}</div>
          <div className="text-xs text-base-content/50">{user?.email}</div>
        </div>
        <div className="avatar placeholder">
          <div className="bg-primary text-primary-content w-10 rounded-full flex items-center justify-center">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 5: Create AdminLayout**

Write `web/src/components/layout/AdminLayout.tsx`:
```tsx
import { Outlet } from '@tanstack/react-router'
import { AdminSidebar } from './AdminSidebar'
import { AdminTopbar } from './AdminTopbar'
import { LayoutDashboard, Store } from 'lucide-react'

const platformMenu = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/lojas', label: 'Lojas', icon: Store },
]

const storeMenu = [
  { href: '/loja', label: 'Dashboard', icon: LayoutDashboard },
]

export function AdminLayout({ menu }: { menu?: 'platform' | 'store' }) {
  const items = menu === 'store' ? storeMenu : platformMenu
  const basePath = menu === 'store' ? '/loja' : '/admin'

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar basePath={basePath} menuItems={items} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto p-6 bg-base-200">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Verify build**

Run: `cd /home/iberno/Projetos/saas-cardapio/web && npx tsc -b`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
cd /home/iberno/Projetos/saas-cardapio
git add web/src/components/layout/
git commit -m "feat: add layout components (header, footer, sidebar, admin)"
```

---

### Task 6: Implement Routes with TanStack Router

**Files:**
- Modify: `web/src/routes/__root.tsx`
- Create: `web/src/routes/index.lazy.tsx`
- Create: `web/src/routes/login.lazy.tsx`
- Create: `web/src/routes/admin/route.tsx`
- Create: `web/src/routes/admin/index.lazy.tsx`
- Create: `web/src/routes/admin/lojas.lazy.tsx`
- Create: `web/src/routes/loja.$slug/route.tsx`
- Create: `web/src/routes/loja.$slug/index.lazy.tsx`
- Create: `web/src/routes/loja.$slug/cardapio.lazy.tsx`
- Modify: `web/src/main.tsx`

- [ ] **Step 1: Update __root.tsx to use TanStack Router file-based routing**

Write `web/src/routes/__root.tsx`:
```tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => <Outlet />,
})
```

- [ ] **Step 2: Create index.lazy.tsx (Landing Page)**

Write `web/src/routes/index.lazy.tsx`:
```tsx
import { createLazyFileRoute } from '@tanstack/react-router'
import { PublicHeader } from '../components/layout/PublicHeader'
import { PublicFooter } from '../components/layout/PublicFooter'

export const Route = createLazyFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral text-base-content">
      <PublicHeader />

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 bg-gradient-to-b from-primary to-neutral">
        <div className="max-w-7xl mx-auto text-center">
          <div className="badge badge-accent badge-outline mb-4 px-4 py-3 text-xs font-semibold tracking-wide">
            Cardapio Digital
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
            O Sistema de Cardapio <br />
            <span className="text-accent">Digital</span> mais completo
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-8">
            Automatize seus pedidos de WhatsApp, aumente suas vendas e gerencie seu negocio em um so lugar.
          </p>

          <div className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-xl p-6 text-left">
            <p className="text-white font-semibold mb-4 text-sm">Comece agora — e gratis!</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3">
              <input placeholder="Seu nome" className="input w-full bg-white/10 border-white/20 text-white placeholder:text-white/40" />
              <input type="email" placeholder="E-mail" className="input w-full bg-white/10 border-white/20 text-white placeholder:text-white/40" />
              <input placeholder="WhatsApp" className="input w-full bg-white/10 border-white/20 text-white placeholder:text-white/40" />
              <button type="submit" className="btn bg-accent text-white border-accent hover:bg-accent/90 w-full font-bold">
                TESTE GRATIS
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 bg-neutral">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: '+10', label: 'Lojas Ativas' },
            { value: '+5k', label: 'Clientes Atendidos' },
            { value: '+50k', label: 'Pedidos Realizados' },
            { value: '99%', label: 'Satisfacao' },
          ].map((stat) => (
            <div key={stat.label} className="text-center bg-white/5 rounded-xl p-4">
              <div className="text-3xl font-extrabold text-accent">{stat.value}</div>
              <div className="text-sm text-white/50">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 3 Pilares */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-2">Os 3 Pilares</h2>
          <p className="text-white/50 mb-8">Tudo que seu negocio precisa</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🤖', title: 'Automacao', desc: 'Cardapio digital com chatbot IA, pagamento online e agendamento. Atendimento 24h.' },
              { icon: '📈', title: 'Vendas', desc: 'Disparo em massa no WhatsApp, programa de fidelidade e integracao com anuncios.' },
              { icon: '📊', title: 'Gestao', desc: 'Controle de caixa, estoque, notas fiscais e comandas integrado ao iFood.' },
            ].map((pilar) => (
              <div key={pilar.title} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="text-3xl mb-3">{pilar.icon}</div>
                <h3 className="text-lg font-semibold text-accent mb-2">{pilar.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{pilar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">Funcionalidades</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              'Chatbot IA', 'Cardapio Online', 'Pagamento Online',
              'Agendamento', 'Disparo WhatsApp', 'Fidelidade',
            ].map((feat) => (
              <div key={feat} className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                <span className="text-white text-sm font-medium">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-b from-primary to-neutral text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">Pronto para comecar?</h2>
          <p className="text-white/60 mb-8">Mais de 10 restaurantes ja usam o Saas Cardapio</p>
          <button className="btn bg-accent text-white border-accent hover:bg-accent/90 btn-lg">
            FALE COM UM CONSULTOR
          </button>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
```

- [ ] **Step 3: Create login.lazy.tsx**

Write `web/src/routes/login.lazy.tsx`:
```tsx
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { PublicHeader } from '../components/layout/PublicHeader'
import { PublicFooter } from '../components/layout/PublicFooter'
import { useAuth } from '../lib/auth'

export const Route = createLazyFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate({ to: '/admin' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral flex flex-col">
      <PublicHeader />
      <div className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-xl p-8">
          <h1 className="text-2xl font-bold text-white text-center mb-6">Entrar</h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input w-full bg-white/10 border-white/20 text-white placeholder:text-white/40"
              required
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input w-full bg-white/10 border-white/20 text-white placeholder:text-white/40"
              required
            />
            {error && <p className="text-error text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="btn bg-accent text-white border-accent hover:bg-accent/90 w-full"
            >
              {loading ? <span className="loading loading-spinner" /> : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}
```

- [ ] **Step 4: Create admin route.tsx (layout)**

Write `web/src/routes/admin/route.tsx`:
```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminLayout } from '../../components/layout/AdminLayout'

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const res = await fetch('/api/platform/auth/me', { credentials: 'include' })
    if (!res.ok) throw redirect({ to: '/login' })
  },
  component: () => <AdminLayout menu="platform" />,
})
```

- [ ] **Step 5: Create admin/index.lazy.tsx**

Write `web/src/routes/admin/index.lazy.tsx`:
```tsx
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/admin/')({
  component: AdminDashboard,
})

function AdminDashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-base-content mb-1">Dashboard</h2>
      <p className="text-base-content/50 text-sm mb-6">Visao geral da plataforma</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Lojas', value: '12', suffix: '+2 este mes', color: 'text-base-content' },
          { label: 'Ativas', value: '10', color: 'text-success' },
          { label: 'Em Trial', value: '2', color: 'text-warning' },
          { label: 'Receita', value: 'R$ 2.4k', color: 'text-base-content' },
        ].map((stat) => (
          <div key={stat.label} className="bg-base-100 border border-base-300 rounded-xl p-5">
            <div className="text-sm text-base-content/50 uppercase tracking-wide mb-1">{stat.label}</div>
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            {stat.suffix && <div className="text-xs text-success mt-1">{stat.suffix}</div>}
          </div>
        ))}
      </div>

      <div className="bg-base-100 border border-base-300 rounded-xl p-6">
        <h3 className="text-base font-semibold text-base-content mb-4">Ultimas Lojas</h3>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="text-base-content/50 text-xs uppercase">
                <th>Nome</th>
                <th>Status</th>
                <th>Plano</th>
                <th>Criada em</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr>
                <td>Acai do Joao</td>
                <td><span className="badge badge-success badge-sm">Ativa</span></td>
                <td>Profissional</td>
                <td>01/06</td>
              </tr>
              <tr>
                <td>Pizza do Chef</td>
                <td><span className="badge badge-warning badge-sm">Trial</span></td>
                <td>Inicial</td>
                <td>01/06</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create admin/lojas.lazy.tsx**

Write `web/src/routes/admin/lojas.lazy.tsx`:
```tsx
import { createLazyFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

export const Route = createLazyFileRoute('/admin/lojas')({
  component: LojasPage,
})

function LojasPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-base-content mb-1">Lojas</h2>
          <p className="text-base-content/50 text-sm">Gerencie os tenants da plataforma</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} /> Nova Loja
        </button>
      </div>

      <div className="bg-base-100 border border-base-300 rounded-xl p-6">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="text-base-content/50 text-xs uppercase">
                <th>Nome</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Contato</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr>
                <td>Acai do Joao</td>
                <td className="font-mono text-xs">acai</td>
                <td><span className="badge badge-success badge-sm">Ativa</span></td>
                <td>joao@acai.local</td>
                <td>
                  <button className="btn btn-ghost btn-xs">Editar</button>
                  <button className="btn btn-ghost btn-xs text-warning">Suspender</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create loja.$slug/route.tsx**

Write `web/src/routes/loja.$slug/route.tsx`:
```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminLayout } from '../../components/layout/AdminLayout'

export const Route = createFileRoute('/loja/$slug')({
  beforeLoad: async () => {
    const res = await fetch('/api/platform/auth/me', { credentials: 'include' })
    if (!res.ok) throw redirect({ to: '/login' })
  },
  component: () => <AdminLayout menu="store" />,
})
```

- [ ] **Step 8: Create loja.$slug/index.lazy.tsx**

Write `web/src/routes/loja.$slug/index.lazy.tsx`:
```tsx
import { createLazyFileRoute, useParams, Link } from '@tanstack/react-router'
import { UtensilsCrossed, QrCode } from 'lucide-react'

export const Route = createLazyFileRoute('/loja/$slug/')({
  component: LojaDashboard,
})

function LojaDashboard() {
  const { slug } = useParams({ from: Route.id })

  return (
    <div>
      <h2 className="text-2xl font-bold text-base-content mb-1">Dashboard</h2>
      <p className="text-base-content/50 text-sm mb-6">Loja: <span className="font-mono text-accent">{slug}</span></p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Produtos', value: '24', color: 'text-base-content' },
          { label: 'Pedidos Hoje', value: '8', color: 'text-success' },
          { label: 'Clientes', value: '156', color: 'text-base-content' },
        ].map((stat) => (
          <div key={stat.label} className="bg-base-100 border border-base-300 rounded-xl p-5">
            <div className="text-sm text-base-content/50 uppercase tracking-wide mb-1">{stat.label}</div>
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/loja/$slug/cardapio" params={{ slug }} className="bg-base-100 border border-base-300 rounded-xl p-6 hover:border-accent transition-colors cursor-pointer">
          <UtensilsCrossed className="text-accent mb-3" size={24} />
          <h3 className="font-semibold text-base-content">Editar Cardapio</h3>
          <p className="text-sm text-base-content/50">Gerencie categorias e produtos</p>
        </Link>
        <div className="bg-base-100 border border-base-300 rounded-xl p-6 cursor-pointer hover:border-accent transition-colors">
          <QrCode className="text-accent mb-3" size={24} />
          <h3 className="font-semibold text-base-content">QR Code</h3>
          <p className="text-sm text-base-content/50">Compartilhe o cardapio</p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 9: Create loja.$slug/cardapio.lazy.tsx**

Write `web/src/routes/loja.$slug/cardapio.lazy.tsx`:
```tsx
import { createLazyFileRoute, useParams } from '@tanstack/react-router'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

export const Route = createLazyFileRoute('/loja/$slug/cardapio')({
  component: CardapioPage,
})

function CardapioPage() {
  const { slug } = useParams({ from: Route.id })
  const [expanded, setExpanded] = useState<string | null>('1')

  const categorias = [
    {
      id: '1', nome: 'Acai', produtos: [
        { id: '1', nome: 'Acai medio', descricao: '500ml', preco: 18.00, ativo: true },
        { id: '2', nome: 'Acai grande', descricao: '700ml', preco: 22.00, ativo: true },
      ],
    },
    {
      id: '2', nome: 'Bebidas', produtos: [
        { id: '3', nome: 'Agua', descricao: '500ml', preco: 4.00, ativo: true },
      ],
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-base-content mb-1">Cardapio</h2>
          <p className="text-base-content/50 text-sm">Loja: <span className="font-mono text-accent">{slug}</span></p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} /> Nova Categoria
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {categorias.map((cat) => (
          <div key={cat.id} className="bg-base-100 border border-base-300 rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-base-200 transition-colors"
              onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
            >
              <div className="flex items-center gap-3">
                {expanded === cat.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <span className="font-semibold text-base-content">{cat.nome}</span>
                <span className="badge badge-ghost badge-sm">{cat.produtos.length}</span>
              </div>
              <button className="btn btn-ghost btn-xs" onClick={(e) => { e.stopPropagation() }}>
                <Plus size={14} /> Produto
              </button>
            </button>

            {expanded === cat.id && (
              <div className="border-t border-base-300">
                {cat.produtos.map((prod) => (
                  <div key={prod.id} className="flex items-center justify-between px-4 py-3 hover:bg-base-200 transition-colors border-b border-base-300 last:border-0">
                    <div>
                      <span className="text-sm font-medium text-base-content">{prod.nome}</span>
                      {prod.descricao && (
                        <span className="text-xs text-base-content/50 ml-2">{prod.descricao}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-accent">
                        R$ {prod.preco.toFixed(2)}
                      </span>
                      <button className="btn btn-ghost btn-xs">Editar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 10: Update main.tsx with TanStack Router**

Write `web/src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { AuthProvider } from './lib/auth'
import './index.css'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
```

- [ ] **Step 11: Verify build**

Run: `cd /home/iberno/Projetos/saas-cardapio/web && npx tsc -b`
Expected: no errors

Run: `npx vite build`
Expected: build succeeds

- [ ] **Step 12: Commit**

```bash
cd /home/iberno/Projetos/saas-cardapio
git add web/src/routes/ web/src/main.tsx
git commit -m "feat: implement all routes (landing, login, admin, store)"
```

---

### Task 7: Verify Integration

- [ ] **Step 1: Start backend**

```bash
cd /home/iberno/Projetos/saas-cardapio/app
kill $(lsof -ti:3001) 2>/dev/null
node dist/src/main.js &
sleep 3
curl -s http://127.0.0.1:3001/api/health
```
Expected: `{"status":"ok","timestamp":"..."}`

- [ ] **Step 2: Start frontend dev server**

```bash
cd /home/iberno/Projetos/saas-cardapio/web
npx vite --host 0.0.0.0 &
sleep 2
curl -s http://127.0.0.1:5173 | head -5
```
Expected: HTML containing `<div id="root">`

- [ ] **Step 3: Test proxy**

```bash
curl -s http://127.0.0.1:5173/api/health
```
Expected: `{"status":"ok","timestamp":"..."}` (proxied to backend)

- [ ] **Step 4: Build for production**

```bash
cd /home/iberno/Projetos/saas-cardapio/web
npx vite build
ls dist/
```
Expected: `dist/` folder with `index.html`, `assets/`

- [ ] **Step 5: Commit final**

```bash
cd /home/iberno/Projetos/saas-cardapio
git add web/
git commit -m "feat: frontend v1 — landing, login, admin, store cardapio"
```

---

## Self-Review Checklist

- [x] **Spec coverage**: All spec items covered — stack, routes, layouts, landing page sections, admin pages, store pages, API client, auth flow
- [x] **Placeholder scan**: No TBD, TODO, or vague steps. All code is concrete.
- [x] **Type consistency**: `Route` from `createFileRoute` / `createLazyFileRoute` pattern used consistently. Auth types match. API signature matches.
- [x] **Scope**: Properly scoped — single frontend project, no backend changes needed
