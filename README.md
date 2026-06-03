# SaaS Cardápio

Plataforma SaaS para cardápios digitais multi-loja. Cada loja tem seu próprio cardápio online com tema customizável, gestão de produtos, categorias, variantes, adicionais, banners e pedidos.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | NestJS 11 + TypeScript |
| Frontend | React 19 + Vite 6 + TanStack Router |
| Banco | PostgreSQL via Prisma ORM |
| UI | Tailwind CSS 4 + DaisyUI 5 |
| Auth | JWT em cookies httpOnly + double-submit CSRF |
| Testes | Vitest + Supertest |

> Projeto inspirado no [elSaborAçai](/home/iberno/Projetos/elSaborAçai), cardápio digital single-store que serviu de base para esta versão multi-loja.

## Estrutura

```
saas-cardapio/
├── app/                    # Backend NestJS
│   ├── prisma/            # Schema + migrations + seed
│   ├── src/
│   │   ├── auth/          # Auth: platform, tenant, customer
│   │   ├── cardapio/      # Produtos, categorias, variantes, grupos, banners, upload, público
│   │   ├── platform-admin/ # Admin: CRUD de tenants + dashboard
│   │   ├── tenant/        # Tenant context service
│   │   ├── infra/         # Prisma, audit, logger
│   │   └── common/        # Guards, decorators, filters, interceptors
│   └── test/              # Testes e2e
│
├── web/                    # Frontend React
│   ├── src/
│   │   ├── components/    # Layout (Header, Footer, AdminSidebar) + UI (ImageUpload, ThemeToggle)
│   │   ├── lib/           # API client, auth context, theme context, store-hours, utils
│   │   ├── routes/        # TanStack Router (17 páginas)
│   │   ├── services/      # API service wrappers (14 serviços)
│   │   └── types/         # TypeScript types (9 arquivos)
│   └── dist/              # Build output
│
├── dev.sh                 # Script dev一键 (instala deps, sincroniza DB, seed, sobe servidores)
├── package.json           # Scripts raiz (dev, build, test, setup)
└── README.md
```

## Funcionalidades

### Administrativo (Plataforma) — `/admin`
- [x] Dashboard com estatísticas (lojas ativas, total de produtos)
- [x] Gerenciamento de lojas (criar, editar, ativar/suspender, excluir) com paginação e busca
- [x] Login com cookie httpOnly + CSRF + rate limiting + brute-force lockout

### Administrativo (Loja) — `/admin/loja`
- [x] Dashboard da loja
- [x] CRUD de produtos (nome, descrição, preço, categoria editável, imagem, disponível, destaque)
- [x] Produtos agrupados por categoria
- [x] Variantes de produto (tamanhos com preço individual — ex: 300ml, 500ml)
- [x] Grupos de adicionais configuráveis com itens e limite de seleção (ex: "Complementos" com "Granola" +R$2, "Paçoca" +R$3)
- [x] Categorias editáveis com reordenação (proteção ao excluir com produtos vinculados)
- [x] Banners promocionais com upload, reordenação e toggle ativo/inativo
- [x] Galeria de imagens (upload, grid, copiar URL, excluir)
- [x] Customização de cores (12 campos: primary, secondary, accent, neutral, base, conteúdo)
- [x] Troca de tema claro/escuro (toggle global)
- [x] Configurações (nome, telefone, endereço, Instagram, horários, pagamento, programa de pontos)
- [x] Gestão de pedidos com polling, som de novo pedido, avanço de status, cancelamento, impressão de cupom, **export CSV**
- [x] **Dashboard** com total/today orders, revenue, produtos, categorias, staff, pedidos recentes
- [x] **Gestão de Equipe** — CRUD de staff (OWNER-only), roles OWNER/STAFF
- [x] **Histórico de Auditoria** — Log de ações com paginação e filtro
- [x] **2FA/TOTP** — Setup via QR code, enable/disable, login em 2 passos
- [x] **Password Reset** — Fluxo completo de recuperação de senha
- [x] **Sonner Toaster** + **Skeleton loading** em toda UI admin

### Público — `/loja/:slug`
- [x] Cardápio online com tema customizado da loja aplicado automaticamente
- [x] Indicador aberto/fechado (baseado nos horários configurados)
- [x] Busca por nome/descrição e filtro por categoria (pílulas)
- [x] Banner carrossel
- [x] Card de produto lado a lado com imagem (placeholder SVG se sem foto)
- [x] Modal bottom-sheet com variantes (radio), adicionais (checkbox com limite), observação, quantidade
- [x] Carrinho lateral (drawer) com editar, +/- quantidade, observação geral, finalizar
- [x] Finalização via WhatsApp + API de pedidos
- [x] Login por telefone (auto-cadastro)
- [x] Histórico de pedidos com status
- [x] Footer com dados da loja (endereço, telefone, Instagram, horários, pagamento)
- [x] Programa de fidelidade (acumula pontos automaticamente)

### API Pública — `/api/public/:slug`
- `GET /produtos` — produtos disponíveis com variantes, grupos e categorias
- `GET /loja` — dados da loja (nome, tema, telefone)
- `GET /banners` — banners ativos
- `POST /orders` — criar pedido com itens e adicionais
- `GET /orders` — listar pedidos por telefone
- `GET /orders/:id` — detalhe do pedido

## Como Rodar

### Desenvolvimento (rápido)

```bash
./dev.sh
```

Isso instala dependências, sincroniza o banco, popula dados iniciais e sobe os servidores.

### Manual

```bash
# 1. Configurar banco PostgreSQL e criar .env
cp app/.env.example app/.env
# Editar DATABASE_URL em app/.env

# 2. Instalar dependências
cd app && npm install
cd web && npm install

# 3. Sincronizar schema + seed
cd app
npx prisma db push
npx tsx prisma/seed.ts

# 4. Iniciar servidores (terminais separados)
cd app && npm run dev     # :3001
cd web && npx vite        # :5173
```

### Credenciais de Teste

```
# Admin da plataforma  → /admin
admin@saas-cardapio.local / Admin123@senha

# Dono da loja         → /admin/loja
owner@acai.local / Admin123@senha   (slug: acai)

# Cliente              → /loja/acai
Login por telefone no modal
```

## Testes

75 testes e2e no backend:

| Grupo | Qtd | Cobre |
|-------|-----|-------|
| Auth | 17 | Login/logout/refresh/me — platform, tenant, customer |
| Segurança | 10 | CSRF, rate limiting, brute-force lockout |
| Multi-tenancy | 6 | Isolamento entre tenants, SKIP_PATHS |
| Store Content | 20 | Produtos, categorias, variantes, grupos, banners, upload |
| Pedidos (Orders) | 8 | CRUD, status, cancelamento, auth |
| Staff | 8 | CRUD, email duplicado, auth |
| Settings | 3 | Get, put, reflect |
| Platform Tenants | 3 | Criação de tenant com/sem owner |

```bash
cd app
npx vitest run test/e2e --no-file-parallelism
```

## Licença

Projeto privado.
