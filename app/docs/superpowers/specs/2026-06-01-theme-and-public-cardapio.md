# Theme System + Public Cardápio

## 1. Global Theme Toggle (Light/Dark)

### Frontend-only feature

**DaisyUI config** (`web/src/index.css`):
- Add `corporate` as a second theme alongside `business --default`
- Both themes ship with DaisyUI, zero extra CSS

**ThemeContext** (`web/src/lib/theme-context.tsx`):
- Reads `data-theme` from `<html>`, default `"business"`
- `toggleTheme()` switches between `"business"` and `"corporate"`
- Persists choice to `localStorage` key `"theme"`
- On mount, checks localStorage → applies to `<html>`

**ThemeToggle component** (`web/src/components/ui/ThemeToggle.tsx`):
- Lucide `Sun`/`Moon` icon button
- Calls `toggleTheme()` from context
- Used in: `PublicHeader` (landing) and `AdminLayout` sidebar/topbar

**No backend changes needed.**

## 2. Per-Store Theme Colors

### Backend

**Prisma** — add JSON field to Tenant:
```
model Tenant {
  ...
  theme  Json?   @map("theme")  // stores DaisyUI color overrides
}
```

Run `prisma db push` + grant permissions for default privileges (already set).

**Theme endpoint** — new `ThemeController` in `app/src/tenant/theme/`:
- `GET /api/tenants/:tenantId/theme` — returns current theme JSON
- `PUT /api/tenants/:tenantId/theme` — updates theme JSON
- Guarded by `TenantUserAuthGuard` (only tenant owner/staff can change)
- No `TenantContext` dependency — `:tenantId` comes from URL param
- The guard's `CurrentUser` decorator provides `user.tenantId` for authorization check

**Theme shape (JSON)**:
```json
{
  "primary": "#763d6e",
  "primaryContent": "#ffffff",
  "secondary": "#d4555a",
  "secondaryContent": "#ffffff",
  "accent": "#2d865b",
  "accentContent": "#ffffff",
  "neutral": "#3d2c3a",
  "neutralContent": "#f5e8f0",
  "base100": "#faf5f0",
  "base200": "#f0e8e0",
  "base300": "#e0d5cc",
  "baseContent": "#2c1810"
}
```

All fields optional — missing keys fall through to the DaisyUI theme defaults.

### Frontend

**Types** (`web/src/types/tenant.ts`):
- `StoreTheme` interface matching the JSON shape above
- `DEFAULT_THEME` constant with the elSaborAçai theme as reference

**Service** (`web/src/services/theme.service.ts`):
- `getTheme(tenantId)` → `GET /api/tenants/:tenantId/theme`
- `updateTheme(tenantId, theme)` → `PUT /api/tenants/:tenantId/theme`

**Route** (`/admin/loja/aparencia`):
- Color picker form with DaisyUI color tokens
- Uses native `<input type="color">` for each color
- Preview section showing how the colors look
- Save button that calls `updateTheme`

**Sidebar** — add "Aparência" link to the store admin sidebar.

## 3. Public Cardápio Page

### Backend

**Public endpoints** (no auth required):
- `GET /api/public/:slug/produtos` — list all available products for a store
- `GET /api/public/:slug/theme` — get store theme + basic store info

Reuses existing `CardapioService` but without auth checks.

### Frontend

**Route** (`/loja/:slug`):
- Fetches store produtos + theme
- Renders cardápio grouped by categoria
- Applies store theme via CSS custom properties on a wrapper div
- Fully responsive, mobile-first
- No cart/checkout in v1 — just viewing the menu
- "Pedir pelo WhatsApp" button with store's phone number

## 4. Implementation Order

1. DaisyUI theme config + ThemeContext + ThemeToggle (frontend-only)
2. Prisma schema update + db push + theme endpoint (backend)
3. Theme settings page /admin/loja/aparencia (frontend)
4. Public cardápio route /loja/:slug (frontend + backend)

## Files Changed/Created

### Backend:
- `app/prisma/schema.prisma` — add `theme` field
- `app/src/tenant/theme/theme.controller.ts` — new
- `app/src/tenant/theme/theme.service.ts` — new
- `app/src/tenant/theme/theme.module.ts` — new
- `app/src/tenant/theme/dto/update-theme.dto.ts` — new
- `app/src/app.module.ts` — register ThemeModule

### Frontend:
- `web/src/index.css` — add corporate theme
- `web/src/lib/theme-context.tsx` — new
- `web/src/components/ui/ThemeToggle.tsx` — new
- `web/src/components/PublicHeader.tsx` — add toggle
- `web/src/components/AdminSidebar.tsx` — add toggle + link
- `web/src/types/tenant.ts` — add StoreTheme
- `web/src/services/theme.service.ts` — new
- `web/src/routes/admin.loja.aparencia.lazy.tsx` — new
- `web/src/routes/loja.$slug.lazy.tsx` — new
- `web/src/routes/__root.tsx` — wrap with ThemeProvider
