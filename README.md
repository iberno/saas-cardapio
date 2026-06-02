# SaaS Cardápio

Plataforma SaaS para cardápios digitais multi-loja. Cada loja tem seu próprio cardápio online com tema customizável, gestão de produtos e pedidos.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | NestJS 11 + TypeScript |
| Frontend | React 19 + Vite 6 + TanStack Router |
| Banco | PostgreSQL via Prisma ORM |
| UI | Tailwind CSS 4 + DaisyUI 5 |
| Auth | JWT em cookies httpOnly + double-submit CSRF |
| Testes | Vitest + Supertest |

> **Referência:** O projeto foi inspirado no [elSaborAçai](/home/iberno/Projetos/elSaborAçai), um cardápio digital single-store que serviu como base para esta versão multi-loja.

## Estrutura

```
saas-cardapio/
├── app/                    # Backend NestJS
│   ├── prisma/            # Schema + migrations
│   ├── src/
│   │   ├── auth/          # Auth: platform, tenant, customer
│   │   ├── cardapio/      # CRUD de produtos + público
│   │   ├── platform-admin/ # Admin: tenants, dashboard
│   │   ├── tenant/        # Tenant context, theme
│   │   ├── infra/         # Prisma, audit, logger
│   │   └── common/        # Guards, decorators, filters
│   └── test/              # Testes e2e
│
├── web/                    # Frontend React
│   ├── src/
│   │   ├── components/    # UI components (Button, Card, etc.)
│   │   ├── lib/           # API client, auth context, theme context
│   │   ├── routes/        # TanStack Router pages
│   │   ├── services/      # API service wrappers
│   │   └── types/         # TypeScript types
│   └── dist/              # Build output
│
└── README.md
```

## Funcionalidades

### Administrativo (Plataforma)
- [x] Dashboard com estatísticas (lojas ativas, produtos)
- [x] Gerenciamento de lojas (criar, ativar/suspender)
- [x] Login com cookie + CSRF

### Administrativo (Loja)
- [x] Dashboard da loja
- [x] CRUD de produtos (nome, descrição, preço, categoria, disponível)
- [x] Produtos agrupados por categoria
- [ ] Customização de cores (primária, secundária, fundo, etc.)
- [ ] Troca de tema claro/escuro

### Público
- [ ] Cardápio online por slug (`/loja/:slug`)
- [ ] Tema customizado da loja aplicado automaticamente

## Como Rodar

### Requisitos
- Node.js 22+
- PostgreSQL 16+
- GitHub CLI (`gh`) — opcional

### Backend

```bash
cd app
cp .env.example .env   # configurar DATABASE_URL
npm install
npx prisma db push     # criar schema no banco
npm run build
node dist/src/main.js  # :3001
```

### Frontend

```bash
cd web
npm install
npx vite               # :5173 (proxy /api → :3001)
```

### Scripts úteis

```bash
# Backend (app/)
npm run build          # compilar TypeScript
npx vitest run test/e2e --no-file-parallelism  # testes e2e

# Frontend (web/)
npx vite build         # build produção
npx vite               # dev server
```

### Credenciais de Teste

```
# Admin da plataforma
admin@saas-cardapio.local / Admin123@senha

# Dono da loja (El Sabor Açaí)
owner@acai.local / Admin123@senha   (slug: acai)
```

## Testes

33 testes e2e que cobrem:

- **Auth (17):** Login/logout/refresh/me para platform, tenant e customer
- **Segurança (10):** CSRF validation, rate limiting, brute-force lockout
- **Multi-tenancy (6):** Isolamento entre tenants, rotas SKIP_PATHS

```bash
cd app
# Requer servidor rodando em :3001
npx vitest run test/e2e --no-file-parallelism
```

## Licença

Projeto privado.
