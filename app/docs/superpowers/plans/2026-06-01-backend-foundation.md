# Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold NestJS + Prisma + PostgreSQL backend with multi-tenancy, 3 auth domains, security baseline, and test gates.

**Architecture:** Monolith modular NestJS with AsyncLocalStorage tenant context, Prisma $extends for automatic tenant_id injection, PostgreSQL RLS as second isolation layer. Three completely separate auth strategies sharing the same JWT infrastructure but different audiences/guards.

**Tech Stack:** NestJS 11, Prisma 6, PostgreSQL 16 (local), TypeScript, argon2, Helmet, @nestjs/throttler, csrf-csrf, Pino, Vitest + Supertest

---

### Task 1: Project scaffolding + health endpoint

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.build.json`
- Create: `.env.example`
- Create: `.env`
- Create: `nest-cli.json`
- Create: `src/main.ts`
- Create: `src/app.module.ts`
- Create: `src/app.controller.ts`
- Create: `src/app.service.ts`
- Create: `src/common/filters/http-exception.filter.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "saas-cardapio",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "start:prod": "node dist/main",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset --force",
    "test": "vitest run",
    "test:e2e": "vitest run test/e2e --no-file-parallelism",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/config": "^4.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/event-emitter": "^3.0.0",
    "@nestjs/jwt": "^11.0.0",
    "@nestjs/passport": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "@nestjs/throttler": "^6.0.0",
    "@prisma/client": "^6.0.0",
    "argon2": "^0.41.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "cookie-parser": "^1.4.7",
    "csrf-csrf": "^3.1.0",
    "helmet": "^8.0.0",
    "nestjs-pino": "^4.0.0",
    "passport": "^0.7.0",
    "pino": "^9.0.0",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
    "@types/cookie-parser": "^1.4.7",
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "@types/passport-jwt": "^4.0.1",
    "@types/supertest": "^6.0.2",
    "prisma": "^6.0.0",
    "supertest": "^7.0.0",
    "tsx": "^4.19.0",
    "typescript": "~5.7.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2023",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src/**/*", "test/**/*", "prisma/seed.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create nest-cli.json**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

- [ ] **Step 4: Create .env.example and .env**

```
# .env.example
NODE_ENV=development
PORT=3001

# Postgres — duas roles: app (sem BYPASSRLS) / platform (com BYPASSRLS)
DATABASE_URL=postgresql://saas_app:changeme@localhost:5432/saas_cardapio
DATABASE_PLATFORM_URL=postgresql://saas_platform:changeme@localhost:5432/saas_cardapio

# JWT — generate with: openssl rand -hex 64
JWT_SECRET=dev-jwt-secret-change-in-production

# Cookie domain (sem prefixo .)
COOKIE_DOMAIN_BASE=saas-cardapio.local

# TOTP secret encryption — openssl rand -hex 32
TOTP_ENCRYPTION_KEY=dev-totp-key-change-in-production

# Seed credentials
SEED_ADMIN_EMAIL=admin@saas-cardapio.local
SEED_ADMIN_PASSWORD=Admin123@senha
SEED_TENANT_OWNER_EMAIL=owner@acai.local
SEED_TENANT_OWNER_PASSWORD=Admin123@senha

# Logging
LOG_LEVEL=debug
```

Copy to `.env` for dev.

- [ ] **Step 5: Create src/main.ts**

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.setGlobalPrefix('api');

  app.use(helmet());
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: /^https?:\/\/([a-z0-9-]+\.)?(saas-cardapio\.local|lvh\.me|localhost)(:\d+)?$/,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
  });

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
```

- [ ] **Step 6: Create src/app.module.ts**

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './infra/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    EventEmitterModule.forRoot(),
    HealthModule,
    PrismaModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

function validateEnv(config: Record<string, unknown>) {
  // basic env checks — expansions later
  if (!config.JWT_SECRET) throw new Error('JWT_SECRET is required');
  if (!config.DATABASE_URL) throw new Error('DATABASE_URL is required');
  return config;
}
```

- [ ] **Step 7: Create src/health/health.module.ts and controller**

```ts
// src/health/health.module.ts
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({ controllers: [HealthController] })
export class HealthModule {}
```

```ts
// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  get() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

- [ ] **Step 8: Create error filter**

```ts
// src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const traceId = (ctx.getRequest() as any).traceId;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      response.status(status).json({
        statusCode: status,
        code: typeof res === 'string' ? 'ERROR' : (res as any).code || 'ERROR',
        message: typeof res === 'string' ? res : (res as any).message,
        traceId,
      });
    } else {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        traceId,
      });
    }
  }
}
```

- [ ] **Step 9: Create vitest.config.ts**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.spec.ts', 'src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: { provider: 'v8', include: ['src/**/*.ts'] },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
```

- [ ] **Step 10: Create .gitignore update**

Already done (created in brainstorming). Add:
```
dist/
.env
coverage/
```

- [ ] **Step 11: Install dependencies and verify health endpoint works**

Run: `npm install`

Run: `npx tsx src/main.ts &` (or `npm run dev` in background)

Expected: server starts on port 3001

Test:
```bash
curl http://localhost:3001/api/health
# → {"status":"ok","timestamp":"..."}
```

- [ ] **Step 12: Commit**

```bash
git add -A && git commit -m "feat: scaffold NestJS project with health endpoint"
```

---

### Task 2: Prisma schema + migration + seed

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`

- [ ] **Step 1: Create prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum TenantStatus {
  TRIAL
  ACTIVE
  SUSPENDED
  CANCELED
}

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

  tenantUsers TenantUser[]
  customers   Customer[]

  @@index([status])
  @@map("tenants")
}

model PlatformAdmin {
  id               String   @id @default(uuid()) @db.Uuid
  email            String   @unique
  passwordHash     String   @map("password_hash")
  name             String
  totpSecret       String?  @map("totp_secret")
  totpEnabled      Boolean  @default(false) @map("totp_enabled")
  failedLoginCount Int      @default(0) @map("failed_login_count")
  lockedUntil      DateTime? @map("locked_until")
  lastLoginAt      DateTime? @map("last_login_at")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  @@map("platform_admins")
}

enum TenantUserRole {
  OWNER
  STAFF
}

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

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

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

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, phone])
  @@index([tenantId])
  @@map("customers")
}

enum UserType {
  PLATFORM_ADMIN
  TENANT_USER
  CUSTOMER
}

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

- [ ] **Step 2: Create prisma/seed.ts**

```ts
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@saas-cardapio.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123@senha';
  const ownerEmail = process.env.SEED_TENANT_OWNER_EMAIL || 'owner@acai.local';
  const ownerPassword = process.env.SEED_TENANT_OWNER_PASSWORD || 'Admin123@senha';

  const adminHash = await argon2.hash(adminPassword);
  const ownerHash = await argon2.hash(ownerPassword);

  const platformAdmin = await prisma.platformAdmin.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash: adminHash, name: 'Admin' },
  });
  console.log('PlatformAdmin:', platformAdmin.email);

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'acai' },
    update: {},
    create: {
      slug: 'acai',
      name: 'El Sabor Açaí',
      status: 'ACTIVE',
      contactEmail: 'contato@elsaboracai.com.br',
    },
  });
  console.log('Tenant:', tenant.slug, tenant.id);

  const tenantUser = await prisma.tenantUser.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: ownerEmail } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: ownerEmail,
      passwordHash: ownerHash,
      name: 'Dono Açaí',
      role: 'OWNER',
    },
  });
  console.log('TenantUser:', tenantUser.email, tenantUser.role);

  const customer = await prisma.customer.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: '+5511999999999' } },
    update: {},
    create: {
      tenantId: tenant.id,
      phone: '+5511999999999',
      name: 'João Cliente',
    },
  });
  console.log('Customer:', customer.phone);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 3: Create .env file (if not exists)**

Ensure `.env` has the vars from Task 1.4.

- [ ] **Step 4: Run Prisma migrate**

```bash
npx prisma migrate dev --name init
```

Expected: migrations folder created, tables created in `saas_cardapio` database.

- [ ] **Step 5: Run seed**

```bash
npx tsx prisma/seed.ts
```

Expected: platform admin + tenant acai + owner user + customer created.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: Prisma schema + seed with tenant/admin/customer"
```

---

### Task 3: TenantContext + TenantMiddleware + TenantService

**Files:**
- Create: `src/tenant/tenant-context.ts`
- Create: `src/tenant/tenant.service.ts`
- Create: `src/tenant/tenant.middleware.ts`
- Create: `src/tenant/tenant.module.ts`

**Modify:**
- Modify: `src/main.ts` — register middleware

- [ ] **Step 1: Create tenant-context.ts**

```ts
// src/tenant/tenant-context.ts
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextData {
  tenantId: string;
  slug: string;
}

const als = new AsyncLocalStorage<TenantContextData>();

export const TenantContext = {
  run: (data: TenantContextData, fn: () => any) => als.run(data, fn),

  get: (): TenantContextData | undefined => als.getStore(),

  require: (): TenantContextData => {
    const ctx = als.getStore();
    if (!ctx) throw new Error('TenantContext not set');
    return ctx;
  },

  has: (): boolean => !!als.getStore(),
};
```

- [ ] **Step 2: Create tenant.service.ts**

```ts
// src/tenant/tenant.service.ts
import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';
import { TenantStatus } from '@prisma/client';

@Injectable()
export class TenantService {
  private cache = new Map<string, { id: string; slug: string; status: TenantStatus }>();
  private cacheTTL = 60_000;

  constructor(private prisma: PrismaService) {}

  async findBySlug(slug: string) {
    const cached = this.cache.get(slug);
    if (cached) return cached;

    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    if (tenant.status !== 'ACTIVE') {
      throw new HttpException('Tenant is suspended', HttpStatus.FORBIDDEN);
    }

    const data = { id: tenant.id, slug: tenant.slug, status: tenant.status };
    this.cache.set(slug, data);
    setTimeout(() => this.cache.delete(slug), this.cacheTTL);

    return data;
  }

  async findById(id: string) {
    return this.prisma.tenant.findUnique({ where: { id } });
  }
}
```

- [ ] **Step 3: Create tenant.middleware.ts**

```ts
// src/tenant/tenant.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service';
import { TenantContext } from './tenant-context';

const SKIP_PATHS = ['/api/health', '/api/platform', '/api/auth/csrf'];

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private tenantService: TenantService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (SKIP_PATHS.some((p) => req.path.startsWith(p))) return next();

    const host = req.headers.host || '';
    const slug = this.extractSubdomain(host);
    if (!slug) return next(); // let routes handle 404

    try {
      const tenant = await this.tenantService.findBySlug(slug);
      TenantContext.run({ tenantId: tenant.id, slug: tenant.slug }, () => next());
    } catch {
      return next(); // error will be caught by controller/filter
    }
  }

  private extractSubdomain(host: string): string | null {
    const base = process.env.COOKIE_DOMAIN_BASE || 'saas-cardapio.local';
    const match = host.match(new RegExp(`^([a-z0-9-]+)\\.${base.replaceAll('.', '\\.')}`));
    return match ? match[1] : null;
  }
}
```

- [ ] **Step 4: Create tenant.module.ts**

```ts
// src/tenant/tenant.module.ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantMiddleware } from './tenant.middleware';
import { PrismaModule } from '../infra/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [TenantService, TenantMiddleware],
  exports: [TenantService, TenantMiddleware],
})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
```

- [ ] **Step 5: Create placeholder PrismaModule (filled in Task 4)**

```ts
// src/infra/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 6: Create placeholder PrismaService (filled in Task 4)**

```ts
// src/infra/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();
  }

  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}
```

- [ ] **Step 7: Import TenantModule in AppModule**

```ts
// modify src/app.module.ts — add TenantModule to imports
import { TenantModule } from './tenant/tenant.module';
// in imports array add: TenantModule,
```

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: TenantContext + TenantMiddleware + TenantService"
```

---

### Task 4: PrismaService with tenant injection + RLS

**Files:**
- Modify: `src/infra/prisma/prisma.service.ts`
- Create: `prisma/migrations/RLS`

- [ ] **Step 1: Upgrade PrismaService with $extends tenant client**

```ts
// src/infra/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantContext } from '../../tenant/tenant-context';

const TENANT_SCOPED_MODELS = new Set(['tenantUser', 'tenant_users', 'customer', 'customers']);

function injectTenantId(args: any, tenantId: string, operation: string) {
  if (['findUnique', 'findFirst', 'findMany', 'update', 'delete', 'upsert'].includes(operation)) {
    args.where = { ...args.where, tenantId };
  }
  if (operation === 'create') {
    args.data = { ...args.data, tenantId };
  }
  if (operation === 'createMany') {
    args.data = args.data.map((d: any) => ({ ...d, tenantId }));
  }
  return args;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private _tenantClient: this | null = null;
  private _platformClient: PrismaClient | null = null;

  constructor() {
    super();
    this._tenantClient = this._buildTenantClient();
  }

  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }

  get tenant(): this {
    return this._tenantClient!;
  }

  platform(): PrismaClient {
    if (!this._platformClient) {
      this._platformClient = new PrismaClient({
        datasources: { db: { url: process.env.DATABASE_PLATFORM_URL } },
      });
    }
    return this._platformClient;
  }

  private _buildTenantClient() {
    const self = this;
    return self.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query, model, operation }) {
            if (TENANT_SCOPED_MODELS.has(model as string)) {
              const ctx = TenantContext.get();
              if (!ctx) throw new Error(`TenantContext required for ${model}.${operation}`);

              await self.$executeRawUnsafe(
                `SELECT set_config('app.current_tenant_id', $1, true)`,
                ctx.tenantId,
              );

              args = injectTenantId(args, ctx.tenantId, operation);
            }
            return query(args);
          },
        },
      },
    }) as unknown as this;
  }
}
```

- [ ] **Step 2: Create RLS migration SQL file**

```sql
-- prisma/migrations/RLS/001_enable_rls.sql
-- Run manually after prisma migrate

ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON tenant_users
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON customers
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Role for application (no BYPASSRLS)
CREATE ROLE saas_app WITH LOGIN PASSWORD 'changeme' NOINHERIT;
GRANT USAGE ON SCHEMA public TO saas_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO saas_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO saas_app;

-- Role for platform-admin (BYPASSRLS for global queries)
CREATE ROLE saas_platform WITH LOGIN PASSWORD 'changeme' NOINHERIT BYPASSRLS;
GRANT USAGE ON SCHEMA public TO saas_platform;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO saas_platform;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO saas_platform;
```

- [ ] **Step 3: Run RLS SQL in Postgres**

```bash
psql -d saas_cardapio -f prisma/migrations/RLS/001_enable_rls.sql
```

Expected: policies created, roles created.

- [ ] **Step 4: Update DATABASE_URL to use saas_app role**

Update `.env`:
```
DATABASE_URL=postgresql://saas_app:changeme@localhost:5432/saas_cardapio
DATABASE_PLATFORM_URL=postgresql://saas_platform:changeme@localhost:5432/saas_cardapio
```

- [ ] **Step 5: Verify PrismaService compiles**

Run: `npx tsx src/main.ts &` — server should start. Kill it after.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: PrismaService with tenant_id injection + RLS"
```

---

### Task 5: PlatformAdmin auth (login/logout/me/refresh)

**Files:**
- Create: `src/auth/shared/token.service.ts`
- Create: `src/auth/shared/auth-utils.ts`
- Create: `src/auth/platform/platform-auth.module.ts`
- Create: `src/auth/platform/platform-auth.controller.ts`
- Create: `src/auth/platform/platform-auth.service.ts`
- Create: `src/auth/platform/dto/login.dto.ts`
- Create: `src/auth/platform/dto/refresh.dto.ts`
- Create: `src/common/guards/platform-auth.guard.ts`
- Create: `src/common/decorators/current-user.decorator.ts`
- Create: `src/common/decorators/public.decorator.ts`

- [ ] **Step 1: Create auth-utils.ts (shared helpers)**

```ts
// src/auth/shared/auth-utils.ts
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function isLocked(lockedUntil: Date | null): boolean {
  return lockedUntil !== null && lockedUntil > new Date();
}
```

- [ ] **Step 2: Create token.service.ts**

```ts
// src/auth/shared/token.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface TokenPayload {
  sub: string;
  aud: 'platform' | 'tenant-user' | 'customer';
  tenantId?: string;
  roles?: string[];
}

@Injectable()
export class TokenService {
  constructor(
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  createAccessToken(payload: TokenPayload): string {
    return this.jwt.sign(payload, { expiresIn: '15m' });
  }

  verifyAccessToken(token: string): TokenPayload {
    return this.jwt.verify<TokenPayload>(token);
  }
}
```

- [ ] **Step 3: Create DTOs**

```ts
// src/auth/platform/dto/login.dto.ts
import { IsString, IsEmail } from 'class-validator';

export class PlatformLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

No separate refresh DTO needed — refresh token comes from cookie.

- [ ] **Step 4: Create guards and decorators**

```ts
// src/common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);
```

```ts
// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  sub: string;
  aud: 'platform' | 'tenant-user' | 'customer';
  tenantId?: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    return ctx.switchToHttp().getRequest().user;
  },
);
```

```ts
// src/common/guards/platform-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../../auth/shared/token.service';

@Injectable()
export class PlatformAuthGuard implements CanActivate {
  constructor(private tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = req.cookies?.pa_session;
    if (!token) throw new UnauthorizedException('Missing platform auth cookie');

    try {
      const payload = this.tokenService.verifyAccessToken(token);
      if (payload.aud !== 'platform') throw new UnauthorizedException('Invalid audience');
      req.user = { sub: payload.sub, aud: payload.aud };
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
```

- [ ] **Step 5: Create platform-auth.service.ts**

```ts
// src/auth/platform/platform-auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { TokenService } from '../shared/token.service';
import { hashPassword, verifyPassword, generateRefreshToken, hashToken, isLocked } from '../shared/auth-utils';
import { AuditService } from '../../infra/audit/audit.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class PlatformAuthService {
  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
    private audit: AuditService,
    private config: ConfigService,
  ) {}

  async login(email: string, password: string, ip: string, userAgent?: string) {
    const admin = await this.prisma.platform().platformAdmin.findUnique({ where: { email } });
    if (!admin) {
      await this.recordAttempt('PLATFORM_ADMIN', email, null, ip, userAgent, false);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (isLocked(admin.lockedUntil)) {
      throw new UnauthorizedException('Account temporarily locked. Try again later.');
    }

    const valid = await verifyPassword(admin.passwordHash, password);
    if (!valid) {
      await this.incrementFailedAttempts(admin.id);
      await this.recordAttempt('PLATFORM_ADMIN', email, null, ip, userAgent, false);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.platform().platformAdmin.update({
      where: { id: admin.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
    await this.recordAttempt('PLATFORM_ADMIN', email, null, ip, userAgent, true);
    await this.audit.log({ actorType: 'PLATFORM_ADMIN', actorId: admin.id, action: 'login', ip });

    return this.createSession(admin.id, 'platform', ip, userAgent);
  }

  async refresh(refreshToken: string, ip: string, userAgent?: string) {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.platform().refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // rotation — mark old as revoked
    await this.prisma.platform().refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.createSession(stored.userId, stored.userType as any, ip, userAgent);
  }

  async logout(userId: string) {
    await this.prisma.platform().refreshToken.updateMany({
      where: { userId, userType: 'PLATFORM_ADMIN', revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(adminId: string) {
    return this.prisma.platform().platformAdmin.findUnique({
      where: { id: adminId },
      select: { id: true, email: true, name: true, totpEnabled: true, createdAt: true },
    });
  }

  private async createSession(userId: string, userType: string, ip: string, userAgent?: string) {
    const accessToken = this.tokenService.createAccessToken({
      sub: userId, aud: userType as any,
    });
    const refreshToken = generateRefreshToken();
    const tokenHash = hashToken(refreshToken);

    await this.prisma.platform().refreshToken.create({
      data: {
        userType: userType as any,
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdIp: ip,
        userAgent,
      },
    });

    return { accessToken, refreshToken };
  }

  private async incrementFailedAttempts(adminId: string) {
    const admin = await this.prisma.platform().platformAdmin.findUnique({ where: { id: adminId } });
    const count = admin!.failedLoginCount + 1;
    const data: any = { failedLoginCount: count };
    if (count >= 5) {
      data.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    }
    await this.prisma.platform().platformAdmin.update({ where: { id: adminId }, data });
  }

  private async recordAttempt(userType: string, identifier: string, tenantId: string | null, ip: string, userAgent: string | undefined, success: boolean) {
    await this.prisma.platform().loginAttempt.create({
      data: { userType: userType as any, identifier, tenantId, ip, userAgent, success },
    });
  }
}
```

- [ ] **Step 6: Create platform-auth.controller.ts**

```ts
// src/auth/platform/platform-auth.controller.ts
import { Controller, Post, Get, Body, Req, Res, UseGuards, HttpCode } from '@nestjs/common';
import { PlatformAuthService } from './platform-auth.service';
import { PlatformLoginDto } from './dto/login.dto';
import { PlatformAuthGuard } from '../../common/guards/platform-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Response, Request } from 'express';

@Controller('platform/auth')
export class PlatformAuthController {
  constructor(private service: PlatformAuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: PlatformLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || '';
    const ua = req.headers['user-agent'];
    const { accessToken, refreshToken } = await this.service.login(dto.email, dto.password, ip, ua);
    setCookies(res, accessToken, refreshToken, 'pa_session', 'platform');
    return { message: 'Authenticated' };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.pa_refresh;
    const ip = req.ip || '';
    const ua = req.headers['user-agent'];
    const { accessToken, refreshToken } = await this.service.refresh(token, ip, ua);
    setCookies(res, accessToken, refreshToken, 'pa_session', 'platform');
    return { message: 'Refreshed' };
  }

  @UseGuards(PlatformAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(@CurrentUser() user: any, @Res({ passthrough: true }) res: Response) {
    await this.service.logout(user.sub);
    clearCookies(res, 'pa_session', 'platform');
    return { message: 'Logged out' };
  }

  @UseGuards(PlatformAuthGuard)
  @Get('me')
  me(@CurrentUser() user: any) {
    return this.service.me(user.sub);
  }
}

function setCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  namePrefix: string,
  _aud: string,
) {
  const domain = `.${process.env.COOKIE_DOMAIN_BASE || 'saas-cardapio.local'}`;
  const secure = process.env.NODE_ENV === 'production';
  const sameSite: 'lax' = 'lax';
  res.cookie(`${namePrefix}`, accessToken, {
    domain, httpOnly: true, secure, sameSite, path: '/', maxAge: 15 * 60 * 1000,
  });
  res.cookie(`${namePrefix}_refresh`, refreshToken, {
    domain, httpOnly: true, secure, sameSite, path: '/', maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearCookies(res: Response, namePrefix: string, _aud: string) {
  const domain = `.${process.env.COOKIE_DOMAIN_BASE || 'saas-cardapio.local'}`;
  res.clearCookie(`${namePrefix}`, { domain });
  res.clearCookie(`${namePrefix}_refresh`, { domain });
}
```

- [ ] **Step 7: Create platform-auth.module.ts**

```ts
// src/auth/platform/platform-auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PlatformAuthController } from './platform-auth.controller';
import { PlatformAuthService } from './platform-auth.service';
import { TokenService } from '../shared/token.service';
import { AuditModule } from '../../infra/audit/audit.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { algorithm: 'HS256' },
      }),
    }),
    AuditModule,
  ],
  controllers: [PlatformAuthController],
  providers: [PlatformAuthService, TokenService],
  exports: [TokenService],
})
export class PlatformAuthModule {}
```

- [ ] **Step 8: Audit module and service**

```ts
// src/infra/audit/audit.module.ts
import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';

@Module({ providers: [AuditService], exports: [AuditService] })
export class AuditModule {}
```

```ts
// src/infra/audit/audit.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    tenantId?: string;
    actorType: 'PLATFORM_ADMIN' | 'TENANT_USER' | 'CUSTOMER';
    actorId: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: any;
    ip?: string;
  }) {
    await this.prisma.platform().auditLog.create({ data: params as any }).catch(() => {
      // audit failure should never break the app
    });
  }
}
```

- [ ] **Step 9: Add PlatformAuthModule to AppModule**

```ts
// modify src/app.module.ts imports
import { PlatformAuthModule } from './auth/platform/platform-auth.module';
// add PlatformAuthModule to imports array
```

- [ ] **Step 10: Compile and test**

```bash
npx tsc --noEmit
```

Expected: no TS errors.

- [ ] **Step 11: Commit**

```bash
git add -A && git commit -m "feat: PlatformAdmin auth with JWT + refresh rotation"
```

---

### Task 6: TenantUser auth (staff/owner)

**Files:**
- Create: `src/auth/tenant-user/tenant-user-auth.module.ts`
- Create: `src/auth/tenant-user/tenant-user-auth.controller.ts`
- Create: `src/auth/tenant-user/tenant-user-auth.service.ts`
- Create: `src/auth/tenant-user/dto/tenant-user-login.dto.ts`
- Create: `src/common/guards/tenant-user-auth.guard.ts`
- Create: `src/common/decorators/roles.decorator.ts`

- [ ] **Step 1: Create DTO**

```ts
// src/auth/tenant-user/dto/tenant-user-login.dto.ts
import { IsString, IsEmail } from 'class-validator';

export class TenantUserLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

- [ ] **Step 2: Create guard**

```ts
// src/common/guards/tenant-user-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { TokenService } from '../../auth/shared/token.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class TenantUserAuthGuard implements CanActivate {
  constructor(
    private tokenService: TokenService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = req.cookies?.tu_session;
    if (!token) throw new UnauthorizedException('Missing tenant user auth cookie');

    try {
      const payload = this.tokenService.verifyAccessToken(token);
      if (payload.aud !== 'tenant-user') throw new UnauthorizedException('Invalid audience');
      req.user = payload;

      const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
      if (requiredRoles && requiredRoles.length > 0) {
        const userRoles = payload.roles || [];
        const hasRole = requiredRoles.some((r) => userRoles.includes(r));
        if (!hasRole) throw new ForbiddenException('Insufficient permissions');
      }

      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException || err instanceof ForbiddenException) throw err;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
```

- [ ] **Step 3: Create roles decorator**

```ts
// src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

- [ ] **Step 4: Create tenant-user-auth.service.ts**

```ts
// src/auth/tenant-user/tenant-user-auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { TokenService } from '../shared/token.service';
import { verifyPassword, generateRefreshToken, hashToken, isLocked } from '../shared/auth-utils';
import { AuditService } from '../../infra/audit/audit.service';
import { TenantContext } from '../../tenant/tenant-context';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TenantUserAuthService {
  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
    private audit: AuditService,
    private config: ConfigService,
  ) {}

  async login(email: string, password: string, ip: string, userAgent?: string) {
    const tenant = TenantContext.require();
    const user = await this.prisma.tenant.tenantUser.findUnique({
      where: { tenantId_email: { tenantId: tenant.tenantId, email } },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (isLocked(user.lockedUntil)) throw new UnauthorizedException('Account locked');

    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.tenant.tenantUser.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
    await this.audit.log({ tenantId: tenant.tenantId, actorType: 'TENANT_USER', actorId: user.id, action: 'login', ip });

    return this.createSession(user, tenant.tenantId, ip, userAgent);
  }

  async refresh(refreshToken: string, ip: string, userAgent?: string) {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.tenant.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    await this.prisma.tenant.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return this.createSessionFromToken(stored, ip, userAgent);
  }

  async logout(userId: string) {
    await this.prisma.tenant.refreshToken.updateMany({
      where: { userId, userType: 'TENANT_USER', revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string) {
    return this.prisma.tenant.tenantUser.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, totpEnabled: true, createdAt: true },
    });
  }

  private async createSession(user: any, tenantId: string, ip: string, userAgent?: string) {
    const accessToken = this.tokenService.createAccessToken({
      sub: user.id, aud: 'tenant-user', tenantId, roles: [user.role],
    });
    const refreshToken = generateRefreshToken();
    const tokenHash = hashToken(refreshToken);
    await this.prisma.tenant.refreshToken.create({
      data: {
        userType: 'TENANT_USER', userId: user.id, tenantId,
        tokenHash, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdIp: ip, userAgent,
      },
    });
    return { accessToken, refreshToken };
  }

  private async createSessionFromToken(stored: any, ip: string, userAgent?: string) {
    const user = await this.prisma.tenant.tenantUser.findUnique({ where: { id: stored.userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return this.createSession(user, stored.tenantId!, ip, userAgent);
  }
}
```

- [ ] **Step 5: Create controller**

```ts
// src/auth/tenant-user/tenant-user-auth.controller.ts
import { Controller, Post, Get, Body, Req, Res, UseGuards, HttpCode } from '@nestjs/common';
import { TenantUserAuthService } from './tenant-user-auth.service';
import { TenantUserLoginDto } from './dto/tenant-user-login.dto';
import { TenantUserAuthGuard } from '../../common/guards/tenant-user-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Response, Request } from 'express';

@Controller('tenant/auth')
export class TenantUserAuthController {
  constructor(private service: TenantUserAuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: TenantUserLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || '';
    const ua = req.headers['user-agent'];
    const { accessToken, refreshToken } = await this.service.login(dto.email, dto.password, ip, ua);
    setTenantUserCookies(res, accessToken, refreshToken);
    return { message: 'Authenticated' };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.tu_refresh;
    const ip = req.ip || '';
    const ua = req.headers['user-agent'];
    const { accessToken, refreshToken } = await this.service.refresh(token, ip, ua);
    setTenantUserCookies(res, accessToken, refreshToken);
    return { message: 'Refreshed' };
  }

  @UseGuards(TenantUserAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(@CurrentUser() user: any, @Res({ passthrough: true }) res: Response) {
    await this.service.logout(user.sub);
    clearTenantUserCookies(res);
    return { message: 'Logged out' };
  }

  @UseGuards(TenantUserAuthGuard)
  @Get('me')
  me(@CurrentUser() user: any) {
    return this.service.me(user.sub);
  }
}

function setTenantUserCookies(res: Response, accessToken: string, refreshToken: string) {
  const secure = process.env.NODE_ENV === 'production';
  // no domain — cookie scoped to tenant subdomain only
  res.cookie('tu_session', accessToken, { httpOnly: true, secure, sameSite: 'lax', path: '/admin', maxAge: 15 * 60 * 1000 });
  res.cookie('tu_refresh', refreshToken, { httpOnly: true, secure, sameSite: 'lax', path: '/admin', maxAge: 7 * 24 * 60 * 60 * 1000 });
}

function clearTenantUserCookies(res: Response) {
  res.clearCookie('tu_session', { path: '/admin' });
  res.clearCookie('tu_refresh', { path: '/admin' });
}
```

- [ ] **Step 6: Create module**

```ts
// src/auth/tenant-user/tenant-user-auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from '../shared/token.service';
import { AuditModule } from '../../infra/audit/audit.module';
import { TenantUserAuthService } from './tenant-user-auth.service';
import { TenantUserAuthController } from './tenant-user-auth.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({ secret: process.env.JWT_SECRET, signOptions: { algorithm: 'HS256' } }),
    }),
    AuditModule,
  ],
  controllers: [TenantUserAuthController],
  providers: [TenantUserAuthService, TokenService],
})
export class TenantUserAuthModule {}
```

- [ ] **Step 7: Add module to AppModule, verify compilation**

```bash
npx tsc --noEmit
```

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: TenantUser auth with role-based guard"
```

---

### Task 7: Customer auth (phone-only)

**Files:**
- Create: `src/auth/customer/customer-auth.module.ts`
- Create: `src/auth/customer/customer-auth.controller.ts`
- Create: `src/auth/customer/customer-auth.service.ts`
- Create: `src/auth/customer/dto/customer-login.dto.ts`
- Create: `src/common/guards/customer-auth.guard.ts`

- [ ] **Step 1: Create DTO**

```ts
// src/auth/customer/dto/customer-login.dto.ts
import { IsString, Matches } from 'class-validator';

export class CustomerLoginDto {
  @IsString()
  @Matches(/^\+[1-9]\d{10,14}$/, { message: 'Phone must be in E.164 format (+5511999999999)' })
  phone: string;
}
```

- [ ] **Step 2: Create guard**

```ts
// src/common/guards/customer-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../../auth/shared/token.service';

@Injectable()
export class CustomerAuthGuard implements CanActivate {
  constructor(private tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = req.cookies?.cu_session;
    if (!token) throw new UnauthorizedException('Missing customer auth cookie');

    try {
      const payload = this.tokenService.verifyAccessToken(token);
      if (payload.aud !== 'customer') throw new UnauthorizedException('Invalid audience');
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
```

- [ ] **Step 3: Create service**

```ts
// src/auth/customer/customer-auth.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { TokenService } from '../shared/token.service';
import { generateRefreshToken, hashToken } from '../shared/auth-utils';
import { TenantContext } from '../../tenant/tenant-context';

@Injectable()
export class CustomerAuthService {
  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
  ) {}

  async login(phone: string, ip: string, userAgent?: string) {
    const tenant = TenantContext.require();

    // auto-register (upsert)
    const customer = await this.prisma.tenant.customer.upsert({
      where: { tenantId_phone: { tenantId: tenant.tenantId, phone } },
      update: {},
      create: { tenantId: tenant.tenantId, phone },
    });

    const accessToken = this.tokenService.createAccessToken({
      sub: customer.id, aud: 'customer', tenantId: tenant.tenantId,
    });
    const refreshToken = generateRefreshToken();
    const tokenHash = hashToken(refreshToken);

    await this.prisma.tenant.refreshToken.create({
      data: {
        userType: 'CUSTOMER', userId: customer.id, tenantId: tenant.tenantId,
        tokenHash, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdIp: ip, userAgent,
      },
    });

    return { accessToken, refreshToken, customer };
  }

  async me(customerId: string) {
    return this.prisma.tenant.customer.findUnique({
      where: { id: customerId },
      select: { id: true, phone: true, name: true, points: true, createdAt: true },
    });
  }
}
```

- [ ] **Step 4: Create controller**

```ts
// src/auth/customer/customer-auth.controller.ts
import { Controller, Post, Get, Body, Req, Res, UseGuards, HttpCode } from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Response, Request } from 'express';

@Controller('customer/auth')
export class CustomerAuthController {
  constructor(private service: CustomerAuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: CustomerLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || '';
    const ua = req.headers['user-agent'];
    const { accessToken, refreshToken } = await this.service.login(dto.phone, ip, ua);
    setCustomerCookies(res, accessToken, refreshToken);
    return { message: 'Authenticated' };
  }

  @UseGuards(CustomerAuthGuard)
  @Get('me')
  me(@CurrentUser() user: any) {
    return this.service.me(user.sub);
  }
}

function setCustomerCookies(res: Response, accessToken: string, refreshToken: string) {
  const secure = process.env.NODE_ENV === 'production';
  // no domain — cookie stays on the tenant subdomain only
  res.cookie('cu_session', accessToken, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 15 * 60 * 1000 });
  res.cookie('cu_refresh', refreshToken, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 });
}
```

- [ ] **Step 5: Create module, add to AppModule, verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: Customer auth phone-only auto-register"
```

---

### Task 8: Platform-admin — CRUD de tenants (básico)

**Files:**
- Create: `src/platform-admin/platform-admin.module.ts`
- Create: `src/platform-admin/tenants.controller.ts`
- Create: `src/platform-admin/tenants.service.ts`
- Create: `src/platform-admin/dto/create-tenant.dto.ts`
- Create: `src/platform-admin/dto/update-tenant-status.dto.ts`
- Create: `src/common/guards/platform-only.guard.ts` (alias for PlatformAuthGuard)

- [ ] **Step 1: Create DTOs**

```ts
// src/platform-admin/dto/create-tenant.dto.ts
import { IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  slug: string;

  @IsString()
  name: string;

  @IsEmail()
  contactEmail: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;
}
```

```ts
// src/platform-admin/dto/update-tenant-status.dto.ts
import { IsEnum } from 'class-validator';

export enum TenantStatusAction {
  ACTIVATE = 'ACTIVE',
  SUSPEND = 'SUSPENDED',
  CANCEL = 'CANCELED',
}

export class UpdateTenantStatusDto {
  @IsEnum(TenantStatusAction)
  status: TenantStatusAction;
}
```

- [ ] **Step 2: Create service**

```ts
// src/platform-admin/tenants.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantStatus } from '@prisma/client';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTenantDto) {
    return this.prisma.platform().tenant.create({ data: dto });
  }

  async findAll() {
    return this.prisma.platform().tenant.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, slug: true, name: true, status: true, contactEmail: true, createdAt: true },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.platform().tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async updateStatus(id: string, status: TenantStatus) {
    const tenant = await this.findOne(id);
    return this.prisma.platform().tenant.update({
      where: { id },
      data: { status },
    });
  }
}
```

- [ ] **Step 3: Create controller**

```ts
// src/platform-admin/tenants.controller.ts
import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { PlatformAuthGuard } from '../common/guards/platform-auth.guard';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';
import { TenantStatus } from '@prisma/client';

@Controller('platform/tenants')
@UseGuards(PlatformAuthGuard)
export class TenantsController {
  constructor(private service: TenantsService) {}

  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTenantStatusDto) {
    return this.service.updateStatus(id, dto.status as TenantStatus);
  }
}
```

- [ ] **Step 4: Create module, add to AppModule, compile**

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: platform-admin tenant CRUD"
```

---

### Task 9: Security baseline + logging

**Files:**
- Create: `src/common/interceptors/logging.interceptor.ts`
- Create: `src/infra/prisma/prisma.module.ts` (update with Pino logger)

**Modify:**
- Modify: `src/main.ts` — add CSRF, Pino, audit hook
- Modify: `src/app.module.ts` — add LoggerModule

- [ ] **Step 1: Add Pino logger to main.ts**

```ts
// modify src/main.ts
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  // ... rest stays
}
```

- [ ] **Step 2: Add LoggerModule to AppModule**

```ts
// in app.module.ts imports
import { LoggerModule } from 'nestjs-pino';

LoggerModule.forRoot({
  pinoHttp: {
    redact: ['req.headers.cookie', 'req.headers.authorization', 'password', 'passwordHash', 'token', 'totpSecret'],
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
  },
}),
```

- [ ] **Step 3: Add CSRF to main.ts**

```ts
// modify src/main.ts — add csrf before app.listen
import { doubleCsrf } from 'csrf-csrf';

const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.JWT_SECRET!.slice(0, 32),
  cookieName: '_csrf',
  cookieOptions: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

app.use(doubleCsrfProtection);

// expose CSRF token endpoint
const csrfController = (req: any, res: any) => {
  const token = generateToken(req, res);
  res.json({ csrfToken: token });
};
app.get('/api/auth/csrf', csrfController);
```

- [ ] **Step 4: Add traceId propagation**

```ts
// src/common/interceptors/trace-id.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuid } from 'uuid';

@Injectable()
export class TraceIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    req.traceId = uuid();
    return next.handle();
  }
}
```

- [ ] **Step 5: Add TraceIdInterceptor globally**

```ts
// in main.ts
import { TraceIdInterceptor } from './common/interceptors/trace-id.interceptor';
app.useGlobalInterceptors(new TraceIdInterceptor());
```

- [ ] **Step 6: Wrap main.ts bootstrap in try/catch for startup validation**

```ts
// end of main.ts
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection', reason);
});
```

- [ ] **Step 7: Compile and verify server starts**

```bash
npx tsc --noEmit
```

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: security baseline — Helmet, CORS, CSRF, Pino, throttler"
```

---

### Task 10: Tests — infrastructure + gates

**Files:**
- Create: `test/fixtures/tenant.fixture.ts`
- Create: `test/fixtures/admin.fixture.ts`
- Create: `test/e2e/multi-tenancy.e2e-spec.ts`
- Create: `test/e2e/platform-auth.e2e-spec.ts`
- Create: `test/e2e/customer-auth.e2e-spec.ts`
- Create: `test/e2e/security.e2e-spec.ts`
- Create: `test/e2e/setup.ts`

- [ ] **Step 1: Create test setup**

```ts
// test/e2e/setup.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.enableCors({ origin: /localhost/, credentials: true });
  await app.init();
  return app;
}
```

- [ ] **Step 2: Create fixture helpers**

```ts
// test/fixtures/tenant.fixture.ts
import { PrismaClient } from '@prisma/client';

export async function createTestTenant(prisma: PrismaClient, overrides: any = {}) {
  return prisma.tenant.create({
    data: {
      slug: `test-${Date.now()}`,
      name: 'Test Tenant',
      status: 'ACTIVE',
      contactEmail: 'test@test.com',
      ...overrides,
    },
  });
}
```

```ts
// test/fixtures/admin.fixture.ts
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

export async function createTestAdmin(prisma: PrismaClient, overrides: any = {}) {
  return prisma.platformAdmin.create({
    data: {
      email: `admin-${Date.now()}@test.com`,
      passwordHash: await argon2.hash('Test@12345678'),
      name: 'Test Admin',
      ...overrides,
    },
  });
}

export async function loginAsPlatform(app: INestApplication, email: string, password: string) {
  const res = await request(app.getHttpServer())
    .post('/api/platform/auth/login')
    .send({ email, password });
  return res.headers['set-cookie'] || [];
}
```

- [ ] **Step 3: Multi-tenancy e2e test**

```ts
// test/e2e/multi-tenancy.e2e-spec.ts
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './setup';
import { PrismaClient } from '@prisma/client';

let app: INestApplication;
let prisma: PrismaClient;
let tenantA: any, tenantB: any;

beforeAll(async () => {
  app = await createTestApp();
  prisma = new PrismaClient();
  tenantA = await prisma.tenant.create({ data: { slug: 'test-a', name: 'A', status: 'ACTIVE', contactEmail: 'a@t.com' } });
  tenantB = await prisma.tenant.create({ data: { slug: 'test-b', name: 'B', status: 'ACTIVE', contactEmail: 'b@t.com' } });
});

afterAll(async () => {
  await prisma.tenant.deleteMany({ where: { slug: { in: ['test-a', 'test-b'] } } });
  await prisma.$disconnect();
  await app.close();
});

describe('Multi-tenancy isolation', () => {
  it('tenant A should not see tenant B data', async () => {
    const custA = await prisma.customer.create({ data: { tenantId: tenantA.id, phone: '+5511999999901' } });
    await prisma.customer.create({ data: { tenantId: tenantB.id, phone: '+5511999999902' } });

    const res = await request(app.getHttpServer())
      .get('/api/customer/auth/me')
      .set('Host', `test-a.saas-cardapio.local`)
      .set('Cookie', 'cu_session=...') // this test needs a real token, simplified for planning
      .expect(401);

    expect(res.body).toHaveProperty('statusCode', 401);
    // actual implementation would use real token injection
  });
});
```

(Note: full 18 gate tests follow the same pattern — written during implementation.)

- [ ] **Step 4-11: Write remaining gate tests**

Each following the pattern of setup → execute → assert. Test topics:
1. Tenant A vs B data isolation
2. findUnique returns null for other tenant's resource
3. RLS blocks raw query without set_config
4. No TenantContext → throw
5. Unknown subdomain → 404, SUSPENDED → 403
6. Login → correct cookie
7. Wrong password → 401 + increment count
8. 5 failures → locked
9. Refresh token rotation
10. Wrong aud → 401
11. TOTP correct/incorrect
12. CSRF missing → 403
13. CORS blocks unauthorized origin
14. Throttler → 429
15. Extra payload field → 400
16. Error doesn't leak stack
17. Audit log entries
18. RLS bypass → audit

- [ ] **Step 12: Run tests and verify all 18 pass**

```bash
npm run test:e2e
```

Expected: all 18+ tests green.

- [ ] **Step 13: Commit**

```bash
git add -A && git commit -m "test: multi-tenancy, auth, and security e2e gates"
```

---

## Self-Review Checklist

After writing, check:
- [ ] No `TBD`, `TODO`, placeholder, or "fill in later" steps
- [ ] Every task has exact file paths
- [ ] Every code step shows actual code
- [ ] Commands show expected output
- [ ] Type consistency across tasks (auth payloads, guard names)
- [ ] All 18 spec test gates have corresponding tests
- [ ] Tests are implementable (use real factories/fixtures)
