# SaaS Cardápio Digital — Backend Foundation

> **Data**: 2026-06-01 · **Status**: Design aprovado · **Próximo passo**: Implementation plan

## 1. Contexto

O SaaS é uma plataforma multi-tenant de cardápio digital com pedidos via WhatsApp, construída do zero em nova pasta separada do projeto original "El Sabor Açaí" (que será o primeiro tenant quando o SaaS estiver pronto).

**Stack**: NestJS + Prisma ORM + PostgreSQL + TypeScript

**MVP** (mínimo): multi-tenant + auth + cardápio + pedidos + WhatsApp (envio). Cobrança manual (sem billing automático). Sem pontos, banners, PWA, dashboard avançado.

## 2. Decisões de design

| Decisão | Escolha |
|---|---|
| Estratégia | Novo SaaS do zero; Açaí vira primeiro tenant |
| MVP | Multi-tenant + auth + cardápio + pedidos + WhatsApp; cobrança manual |
| Isolamento multi-tenant | Pool (DB único + `tenant_id` + RLS Postgres) |
| Identificação tenant | Subdomínio (`acai.saas-cardapio.com.br`) |
| WhatsApp | Baileys self-hosted |
| Usuários | 3 tabelas separadas: `platform_admins`, `tenant_users`, `customers` |
| Onboarding | Manual via super-admin |
| Mensagens WhatsApp | Bilateral: notifica staff + cliente recebe do número da loja |
| Upload | Local disk com pasta por tenant |
| Arquitetura | Monolito NestJS modular; Postgres local sem Docker pro MVP; sem Redis / BullMQ |
| Frontend | Tailwind v4 + DaisyUI 5 (registrado para os subprojetos de frontend) |

## 3. Decomposição macro do projeto

```
[1] Backend Foundation        ← ESTE DOCUMENTO
[2] Catalog Module
[3] Orders Module
[4] WhatsApp Module
[5] Super-Admin API
[6] Storefront frontend
[7] Tenant Dashboard frontend
[8] Super-Admin frontend
```

Cada subprojeto terá seu próprio ciclo spec → plano → implementação.

## 4. Arquitetura

### 4.1 Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 22 LTS + TypeScript |
| Framework | NestJS 11 |
| ORM | Prisma 6 |
| DB | PostgreSQL 16 (RLS obrigatório) |
| Validação | class-validator + class-transformer |
| Auth | @nestjs/jwt + cookies httpOnly + argon2 |
| Segurança | Helmet, CORS estrito, @nestjs/throttler, CSRF double-submit |
| Logs | Pino (JSON estruturado) |
| Testes | Vitest + Supertest |

### 4.2 Estrutura de pastas

```
saas-cardapio/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── common/
│   │   ├── decorators/          # @CurrentUser, @CurrentTenant, @Public
│   │   ├── guards/              # JwtAuthGuard, RolesGuard, TenantGuard
│   │   ├── interceptors/        # logging, response transform
│   │   ├── filters/             # error filter padronizado
│   │   └── pipes/               # ValidationPipe custom
│   │
│   ├── infra/
│   │   ├── prisma/              # PrismaService + client extension + bypass
│   │   ├── storage/             # StorageService + LocalDiskStorage
│   │   └── audit/               # AuditLog service
│   │
│   ├── tenant/
│   │   ├── tenant.module.ts
│   │   ├── tenant.service.ts    # resolve tenant por subdomínio
│   │   ├── tenant.middleware.ts  # extrai subdomínio → injeta no request
│   │   └── tenant-context.ts    # AsyncLocalStorage com tenant atual
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── platform/            # platform-admin (você)
│   │   ├── tenant-user/         # staff/owner da loja
│   │   └── customer/            # cliente final (telefone-only)
│   │
│   ├── platform-admin/          # CRUD básico de tenants
│   │
│   └── health/                  # /healthz
│
├── test/
│   ├── e2e/
│   └── fixtures/
│
└── package.json
```

### 4.3 Comunicação interna

Módulos futuros (catalog, orders, whatsapp) comunicam-se via eventos (`@nestjs/event-emitter`), não chamadas diretas. Ex: `OrderPlaced` é emitido por orders, consumido por WhatsApp. Mantém fronteiras limpas pra permitir extração futura do WhatsApp como processo separado.

## 5. Multi-tenancy

### 5.1 Fluxo de requisição

```
acai.saas-cardapio.com.br/api/products
  │
  ▼
TenantMiddleware extrai subdomínio: "acai"
  │
  ▼
TenantService.findBySlug("acai") → cache em memória (TTL 60s)
  │
  ▼
Tenant encontrado + ACTIVE?
  ├─ não → 404 / 403
  └─ sim → injeta no AsyncLocalStorage (TenantContext)
            │
            ▼
       Prisma usa TenantContext.require().tenantId
```

### 5.2 AsyncLocalStorage (TenantContext)

```ts
const tenantStore = new AsyncLocalStorage<{ tenantId: string; slug: string }>();

export const TenantContext = {
  run: (ctx, fn) => tenantStore.run(ctx, fn),
  get: () => tenantStore.getStore(),
  require: () => {
    const ctx = tenantStore.getStore();
    if (!ctx) throw new Error('TenantContext not set');
    return ctx;
  },
};
```

### 5.3 Prisma client extension (camada A)

`$extends` injeta `tenant_id` em `where`, `data`, `create` automaticamente. Aplicado a todos os modelos listados em `TENANT_SCOPED_MODELS`. Erro se TenantContext estiver vazio.

### 5.4 PostgreSQL RLS (camada B)

Tabelas tenant-scoped têm `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY` + policy:
```sql
CREATE POLICY tenant_isolation ON tenant_users
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

PrismaService seta `app.current_tenant_id` antes de cada query. Conexão de app usa role `saas_app` (sem `BYPASSRLS`). Platform-admin usa `saas_platform` (com `BYPASSRLS`).

### 5.5 Modelos NÃO escopados

`tenants`, `platform_admins`, `audit_logs` — sem tenant_id, sem RLS.

## 6. Autenticação

### 6.1 Três domínios independentes

| Domínio | Subdomínio | Identificador | Cookie |
|---|---|---|---|
| PlatformAdmin | `admin.saas-cardapio.com.br` | email + senha (+ TOTP obrigatório) | `pa_session` |
| TenantUser | `<loja>.saas-cardapio.com.br/admin` | email + senha (+ TOTP opcional) | `tu_session` |
| Customer | `<loja>.saas-cardapio.com.br` | telefone (auto-registro, sem OTP no MVP) | `cu_session` |

### 6.2 JWT + refresh tokens

- Access token: JWT 15min, `aud` distinto por domínio.
- Refresh token: opaco 32 bytes, 7 dias, hash SHA-256 em `refresh_tokens`.
- Rotation: cada refresh emite novo par e invalida o anterior. Detecção de reuso revoga família.
- Cookie: `Domain=<subdomínio>.<base>; Path=/; SameSite=Lax; Secure; HttpOnly`. Sem prefixo `.`.

### 6.3 Cookie scoping multi-subdomínio

- `pa_session`: apenas em `admin.saas-cardapio.com.br`
- `tu_session`: apenas em `<loja>.saas-cardapio.com.br/admin`
- `cu_session`: apenas em `<loja>.saas-cardapio.com.br/`

Nunca com Domain prefixado — cada subdomínio é seu próprio silo.

### 6.4 CSRF

Rotas mutáveis exigem header `X-CSRF-Token` proveniente de cookie `_csrf` (double-submit pattern). Endpoint `GET /auth/csrf` expõe o token.

### 6.5 Senhas e brute force

- Hash: argon2id `m=64MB, t=3, p=4` (lib: `argon2`).
- Lockout: 5 falhas em 15min → `locked_until` = now + 30min.
- Login throttle: 10 req/min/IP em rotas de auth (via `@nestjs/throttler`).
- Password policy (admins): mínimo 12 chars, 1 minúscula + 1 maiúscula + 1 número + 1 símbolo.

### 6.6 Customer auth (MVP)

Phone-only auto-registro. **Dívida de segurança**: adicionar OTP via WhatsApp quando WhatsApp Module estiver pronto.

## 7. Modelo de dados (Prisma schema)

```prisma
enum TenantStatus { TRIAL, ACTIVE, SUSPENDED, CANCELED }

model Tenant {
  id           String       @id @default(uuid()) @db.Uuid
  slug         String       @unique
  name         String
  status       TenantStatus @default(TRIAL)
  contactEmail String       @map("contact_email")
  contactPhone String?      @map("contact_phone")
  trialEndsAt  DateTime?    @map("trial_ends_at")
  paidUntil    DateTime?    @map("paid_until")
  createdAt    DateTime     @default(now()) @map("created_at")
  updatedAt    DateTime     @updatedAt @map("updated_at")
  tenantUsers  TenantUser[]
  customers    Customer[]
  @@index([status])
  @@map("tenants")
}

model PlatformAdmin {
  id               String    @id @default(uuid()) @db.Uuid
  email            String    @unique
  passwordHash     String    @map("password_hash")
  name             String
  totpSecret       String?   @map("totp_secret")
  totpEnabled      Boolean   @default(false) @map("totp_enabled")
  failedLoginCount Int       @default(0) @map("failed_login_count")
  lockedUntil      DateTime? @map("locked_until")
  lastLoginAt      DateTime? @map("last_login_at")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")
  @@map("platform_admins")
}

enum TenantUserRole { OWNER, STAFF }

model TenantUser {
  id               String         @id @default(uuid()) @db.Uuid
  tenantId         String         @map("tenant_id") @db.Uuid
  email            String
  passwordHash     String         @map("password_hash")
  name             String
  role             TenantUserRole @default(STAFF)
  totpSecret       String?        @map("totp_secret")
  totpEnabled      Boolean        @default(false) @map("totp_enabled")
  failedLoginCount Int            @default(0) @map("failed_login_count")
  lockedUntil      DateTime?      @map("locked_until")
  lastLoginAt      DateTime?      @map("last_login_at")
  createdAt        DateTime       @default(now()) @map("created_at")
  updatedAt        DateTime       @updatedAt @map("updated_at")
  tenant           Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  @@unique([tenantId, email])
  @@index([tenantId])
  @@map("tenant_users")
}

model Customer {
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  phone     String
  name      String?
  address   String?
  points    Int      @default(0)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  @@unique([tenantId, phone])
  @@index([tenantId])
  @@map("customers")
}

enum UserType { PLATFORM_ADMIN, TENANT_USER, CUSTOMER }

model RefreshToken {
  id           String   @id @default(uuid()) @db.Uuid
  userType     UserType @map("user_type")
  userId       String   @map("user_id") @db.Uuid
  tenantId     String?  @map("tenant_id") @db.Uuid
  tokenHash    String   @unique @map("token_hash")
  expiresAt    DateTime @map("expires_at")
  revokedAt    DateTime? @map("revoked_at")
  replacedById String?  @map("replaced_by_id") @db.Uuid
  createdIp    String?  @map("created_ip")
  userAgent    String?  @map("user_agent")
  createdAt    DateTime @default(now()) @map("created_at")
  @@index([userType, userId])
  @@index([expiresAt])
  @@map("refresh_tokens")
}

model PasswordResetToken {
  id        String   @id @default(uuid()) @db.Uuid
  userType  UserType @map("user_type")
  userId    String   @map("user_id") @db.Uuid
  tokenHash String   @unique @map("token_hash")
  expiresAt DateTime @map("expires_at")
  usedAt    DateTime? @map("used_at")
  createdAt DateTime @default(now()) @map("created_at")
  @@map("password_reset_tokens")
}

model LoginAttempt {
  id         String   @id @default(uuid()) @db.Uuid
  userType   UserType @map("user_type")
  identifier String
  tenantId   String?  @map("tenant_id") @db.Uuid
  ip         String
  userAgent  String?  @map("user_agent")
  success    Boolean
  createdAt  DateTime @default(now()) @map("created_at")
  @@index([identifier, createdAt])
  @@index([ip, createdAt])
  @@map("login_attempts")
}

model AuditLog {
  id           String   @id @default(uuid()) @db.Uuid
  tenantId     String?  @map("tenant_id") @db.Uuid
  actorType    UserType @map("actor_type")
  actorId      String   @map("actor_id") @db.Uuid
  action       String
  resourceType String?  @map("resource_type")
  resourceId   String?  @map("resource_id")
  metadata     Json?
  ip           String?
  createdAt    DateTime @default(now()) @map("created_at")
  @@index([tenantId, createdAt])
  @@index([action])
  @@map("audit_logs")
}
```

### 7.1 Migrations RLS

Rodam após `prisma migrate`. Script em `prisma/migrations/RLS.sql`:

- `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY` em `tenant_users` e `customers`.
- Role `saas_app` (app, sem BYPASSRLS) e `saas_platform` (admin, com BYPASSRLS).
- PRÓXIMOS MÓDULOS adicionarão suas próprias políticas nas tabelas de catalog/orders/etc.

### 7.2 Seed

`prisma/seed.ts`: 1 PlatformAdmin, 1 Tenant `acai` (ACTIVE), 1 TenantUser owner.

## 8. Segurança (baseline)

### 8.1 HTTP
- Helmet com CSP, HSTS, referrer policy, cross-origin policies.
- CORS: somente origens `*.saas-cardapio.com.br` + `*.localhost`/`*.lvh.me`.

### 8.2 Rate limiting
- Global: 120 req/60s/IP.
- Auth endpoints: 10 req/60s/IP. Password reset: 5 req/60m/IP.

### 8.3 Validação
- `ValidationPipe` global com `whitelist`, `forbidNonWhitelisted`, `transform`.
- `ParseUUIDPipe` em parâmetros de URL com ID.
- DTOs em todos os endpoints (class-validator).

### 8.4 Audit log
Escrito em: login (sucesso/falha), logout, criação/update/lock de admins, mudança de senha, tenant criado/suspenso/cancelado, bypass de RLS, acesso de PlatformAdmin a recurso tenant.

### 8.5 Logging
- Pino com redact de password, token, cookie, totpSecret.
- `traceId` por request (AsyncLocalStorage).

### 8.6 Error handling
- Exception filter global: shape padronizado `{ statusCode, code, message, traceId }`.
- Nunca vaza stack trace ou query SQL em produção.

### 8.7 Secrets
- `.env.example` documentado. App não sobe sem variáveis obrigatórias (config validation via Joi/Zod).
- `TOTP_ENCRYPTION_KEY` criptografa `totp_secret` no DB (AES-256-GCM).

## 9. Testes

### 9.1 Stack
- Vitest + Supertest.
- Postgres dedicado (`saas_test`). E2E serial (sem paralelismo entre arquivos de teste).
- Fixtures: `createTenant`, `createPlatformAdmin`, `createTenantUser`, `createCustomer`, `loginAs`.

### 9.2 Testes obrigatórios (gates)

**Multi-tenancy:**
1. Tenant A não enxerga dados de Tenant B (e2e).
2. `findUnique` de recurso de outro tenant retorna null.
3. `$queryRawUnsafe` sem `set_config` bloqueado por RLS.
4. Job sem `TenantContext.run` → throw.
5. Subdomínio inexistente → 404. Tenant SUSPENDED → 403.

**Auth:**
6. Login feliz emite cookie correto.
7. Senha errada → 401 + incrementa `failed_login_count`.
8. 5 falhas em 15min → `locked_until` + audit log.
9. Refresh token rotation.
10. JWT com `aud` errado → 401.
11. TOTP: correto loga, errado → 401.
12. CSRF: POST sem token → 403.

**Segurança HTTP:**
13. CORS rejeita Origin estranho.
14. Throttler → 429 no 11º request em auth.
15. Payload extra → 400.
16. Erro em prod não vaza stack trace.

**Audit:**
17. Eventos chave → entrada no audit_logs.
18. Bypass de RLS → audit.

### 9.3 Scripts
```
npm run test          # vitest run
npm run test:e2e      # vitest run test/e2e --no-file-parallelism
npm run test:watch    # vitest --watch
npm run test:coverage # vitest run --coverage
```

## 10. Fora do escopo deste subprojeto

- CRUD de produtos, categorias, adicionais → Catalog Module [2]
- Pedidos, status flow, cancelamento → Orders Module [3]
- WhatsApp (Baileys, sessões, envio de mensagens) → WhatsApp Module [4]
- Dashboard de stats / mais vendidos → Dashboard Module
- Pontos, banners, PWA → subprojetos futuros
- Billing automático → post-MVP
- Docker, CI/CD → post-MVP

## 11. Riscos e dívidas técnicas documentadas

1. **OTP via WhatsApp**: customer auth atual é phone-only (sem senha). Segurança fraca. Resolver quando WhatsApp Module estiver no ar.
2. **Sem fila assíncrona**: mensagens WhatsApp serão síncronas no MVP. Perda possível se serviço cair durante envio. BullMQ + Redis serão adicionados com WhatsApp Module.
3. **Sem Redis**: refresh token blacklist usa Postgres. Tolerável até ~10k refreshes/dia.
4. **Frontend não definido**: Storefront, Tenant Dashboard e Super-Admin serão subprojetos separados com seus próprios specs. Restrição conhecida: Tailwind v4 + DaisyUI 5.
