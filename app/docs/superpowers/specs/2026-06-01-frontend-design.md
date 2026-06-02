# Frontend — Saas Cardapio

**Data:** 2026-06-01
**Status:** Aprovado
**Tags:** frontend, react, vite, tailwind, daisyui

---

## 1. Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | React 19.x |
| Build | Vite 6.x |
| Router | TanStack Router 1.x |
| CSS | Tailwind CSS v4 |
| Component Library | DaisyUI 5.x (tema: Business) |
| Icons | Lucide React |
| HTTP | fetch nativo |

## 2. Estrutura do Projeto

```
saas-cardapio/
  app/                          # Backend NestJS (existente)
  web/                          # Frontend Vite + React (novo)
    index.html
    package.json
    vite.config.ts
    tsconfig.json
    src/
      main.tsx
      App.tsx
      index.css                 # @import "tailwindcss"; @plugin "daisyui";
      routes/                   # TanStack Router
        __root.tsx              # Layout raiz
        index.lazy.tsx          # Landing Page
        login.lazy.tsx          # Login
        admin/
          route.ts              # Layout admin (sidebar + topbar)
          index.lazy.tsx        # Dashboard plataforma
          lojas.lazy.tsx        # CRUD lojas (tenants)
        loja.$slug/
          route.ts              # Layout loja (sidebar + topbar)
          index.lazy.tsx        # Dashboard loja
          cardapio.lazy.tsx     # Gerenciar cardapio
      components/
        ui/                     # Button, Input, Card, Modal, Badge, Table
        layout/                 # Header, Footer, Sidebar, Topbar
        landing/                # Hero, Features, Pricing, Stats, CTA
      lib/
        api.ts                  # HTTP client + CSRF
        auth.ts                 # AuthProvider + hooks
        utils.ts                # Helpers (cn, format)
      types/
        tenant.ts
        auth.ts
        cardapio.ts
    public/
      favicon.svg
```

## 3. Design System

### 3.1 Tema — DaisyUI Business

| Variavel | Valor | Uso |
|----------|-------|-----|
| primary | `#1c4e80` | Azul escuro corporativo |
| secondary | `#7c909a` | Cinza azulado |
| accent | `#ea6947` | Laranja CTAs e destaques |
| neutral | `#23282e` | Background escuro |
| base-100 | `#ffffff` | Superficies claras |

### 3.2 Tipografia

- **Titulos**: Playfair Display SC (landing page)
- **Corpo**: Karla (landing page)
- **Admin**: Inter / system-ui

### 3.3 Icones

Lucide React — todos SVG consistentes, viewBox 24x24.

### 3.4 Componentes Base (ui/)

| Componente | Descricao |
|-----------|-----------|
| Button | Variantes: primary, accent, ghost, outline. Size: sm, md, lg |
| Input | Com label, erro, placeholder |
| Card | Container com padding, border, glass effect |
| Modal | Overlay + content + fechar |
| Badge | Status: success, warning, error, info |
| Table | Tabela responsiva com scroll horizontal |
| Select | Select estilizado DaisyUI |
| Spinner | Loading spinner |

## 4. Rotas (TanStack Router)

| Rota | Pagina | Auth | Layout |
|------|--------|------|--------|
| `/` | Landing Page | Nao | Publico |
| `/login` | Login | Nao | Publico |
| `/admin` | Dashboard Plataforma | Sim | Admin |
| `/admin/lojas` | Lista/Criar Lojas | Sim | Admin |
| `/loja/:slug` | Dashboard Loja | Sim | Admin Loja |
| `/loja/:slug/cardapio` | Gerenciar Cardapio | Sim | Admin Loja |

### Guardas de Rota

- `beforeLoad` do TanStack Router verifica cookie de autenticacao
- Se nao autenticado -> redirect `/login`

## 5. Layouts

### 5.1 Publico (Landing + Login)

```
+------------------------------+
|           Header             |
|   Logo    [Login] [Teste]    |
+------------------------------+
|                              |
|        Page Content           |
|                              |
+------------------------------+
|           Footer             |
+------------------------------+
```

- Header fixo no topo com backdrop-blur
- Mobile: hamburger menu
- Footer com links + copyright

### 5.2 Admin (Plataforma + Loja)

```
+------+-----------------------+
|      |      Topbar           |
| Side |  [Busca]  [Avatar]    |
| bar  +-----------------------+
|      |                       |
| Menu |    Page Content        |
|      |                       |
+------+-----------------------+
```

- Sidebar retratil (hamburger em mobile)
- Sidebar colapsa para icones em tablet
- Topbar com breadcrumb + avatar

## 6. Landing Page

### 6.1 Hero
- Headline principal + subtitle "O Sistema de Cardapio Digital mais completo"
- Lead capture form (nome, email, whatsapp)
- CTA "Teste Gratis" (accent #ea6947)
- Background: gradiente primary -> dark

### 6.2 Stats Bar
- Grid 2x2 (mobile) / 4 colunas (desktop)
- Numeros grandes com accent color
- Metricas: lojas ativas, clientes, pedidos, satisfacao

### 6.3 Os 3 Pilares
- Tabs ou cards: Automacao, Vendas, Gestao
- Cada pilar com descricao e icone
- Mobile empilhado / desktop grid 3 colunas

### 6.4 Funcionalidades
- Grid 2 colunas (mobile) / 3-4 colunas (desktop)
- Cards com icone + nome
- Chatbot IA, Cardapio Online, Pagamento, Agendamento, Disparo WhatsApp, Fidelidade

### 6.5 CTA Final
- Fundo gradiente
- Texto persuasivo + botao accent

### 6.6 Footer
- Logo + descricao, Links rapidos, Redes sociais, Copyright

## 7. Admin Plataforma

### 7.1 Dashboard (`/admin`)
- Cards de estatisticas (total lojas, ativas, trial, receita)
- Tabela "Ultimas Lojas" com status e acoes

### 7.2 Lojas (`/admin/lojas`)
- Botao "Nova Loja" abre modal/form
- Tabela com paginacao
- Colunas: nome, slug, status, plano, acoes (editar, suspender)

## 8. Admin Loja

### 8.1 Dashboard Loja (`/loja/:slug`)
- Cards: total produtos, pedidos hoje, clientes
- Atalhos: editar cardapio, ver QR Code

### 8.2 Cardapio (`/loja/:slug/cardapio`)
- Lista de categorias (expansivel)
- Cada categoria com lista de produtos
- Produto: nome, descricao, preco, imagem, ativo/inativo
- CRUD: criar/editar categoria e produto

## 9. API Client

```typescript
// lib/api.ts
// Fetch wrapper com:
// - Base URL (VITE_API_URL)
// - CSRF automatico (GET /auth/csrf -> cookie + header)
// - Error handling
// - CORS (credentials: 'include')
```

### Auth Flow
1. Login -> POST `/api/platform/auth/login`
2. Server seta cookie `pa_session` (httpOnly)
3. TanStack Router `beforeLoad` verifica cookie
4. Logout -> POST `/api/platform/auth/logout`

## 10. Dependencias (package.json)

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-router": "^1.0.0",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^6.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "daisyui": "^5.0.0",
    "typescript": "~5.7.0"
  }
}
```

## 11. Ordem de Implementacao

1. Scaffold Vite + React + Tailwind v4 + DaisyUI
2. Configurar tema Business + tipografia + Lucide
3. Criar componentes base (ui/)
4. Criar layouts (Header, Footer, Sidebar, Topbar)
5. Implementar Landing Page (Hero, Stats, Pilares, Features, CTA, Footer)
6. Implementar Login
7. Implementar Admin Plataforma (Dashboard + Lojas CRUD)
8. Implementar Admin Loja (Dashboard + Cardapio CRUD)
9. Integrar API client + CSRF + Auth flow
