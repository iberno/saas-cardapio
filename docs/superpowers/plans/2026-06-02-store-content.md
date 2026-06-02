# Store Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement categorias editáveis, variantes de produto com preço, grupos/itens configuráveis, banners promocionais e upload de imagens.

**Architecture:** Backend NestJS modular (cada feature um módulo) + frontend React com rotas e serviços dedicados. Upload salvo localmente em `app/uploads/:tenantSlug/`. Prisma schema com 5 novos modelos. Migração de dados do enum `Categoria` para tabela `categorias`.

**Tech Stack:** NestJS, Prisma, PostgreSQL, Multer, Vite, TanStack Router, DaisyUI

---

## File Structure

```
Backend (app/src/):
  ├── cardapio/
  │   ├── cardapio.module.ts          MODIFY — importar novos módulos
  │   ├── produtos.service.ts           MODIFY — categoria FK, preco from variantes
  │   ├── produtos.controller.ts        MODIFY — categoriaId no DTO
  │   ├── public-cardapio.controller.ts MODIFY — retornar variantes+grupos
  │   ├── upload/
  │   │   ├── upload.module.ts          CREATE
  │   │   ├── upload.controller.ts      CREATE
  │   │   └── upload.service.ts         CREATE
  │   ├── categorias/
  │   │   ├── categorias.module.ts      CREATE
  │   │   ├── categorias.controller.ts  CREATE
  │   │   └── categorias.service.ts     CREATE
  │   ├── variantes/
  │   │   ├── variantes.module.ts       CREATE
  │   │   ├── variantes.controller.ts   CREATE
  │   │   └── variantes.service.ts      CREATE
  │   ├── grupos/
  │   │   ├── grupos.module.ts          CREATE
  │   │   ├── grupos.controller.ts      CREATE
  │   │   └── grupos.service.ts         CREATE
  │   └── banners/
  │       ├── banners.module.ts         CREATE
  │       ├── banners.controller.ts     CREATE
  │       └── banners.service.ts        CREATE
  ├── infra/prisma/prisma.service.ts    MODIFY — .platform() inclui novos modelos
  └── prisma/schema.prisma              MODIFY — 5 novos modelos

Frontend (web/src/):
  ├── types/
  │   ├── categoria.ts                  CREATE
  │   ├── variante.ts                   CREATE
  │   ├── grupo.ts                      CREATE
  │   ├── banner.ts                     CREATE
  │   ├── product-form.ts               CREATE (tipos compostos)
  │   └── index.ts                      MODIFY — novos exports
  ├── services/
  │   ├── categorias.service.ts         CREATE
  │   ├── variantes.service.ts          CREATE
  │   ├── grupos.service.ts             CREATE
  │   ├── banners.service.ts            CREATE
  │   └── upload.service.ts             CREATE
  ├── components/
  │   └── ui/
  │       └── ImageUpload.tsx           CREATE (dropzone + preview)
  ├── routes/
  │   ├── admin.loja.cardapio.lazy.tsx  MODIFY — form c/ variantes+grupos
  │   ├── admin.loja.categorias.lazy.tsx CREATE
  │   ├── admin.loja.banners.lazy.tsx    CREATE
  │   └── loja.$slug.lazy.tsx           MODIFY — modal c/ variantes+grupos
  └── route-tree.ts                     MODIFY — novas rotas

Tests (app/test/):
  └── test/e2e/
      ├── categorias.spec.ts            CREATE
      ├── variantes.spec.ts             CREATE
      ├── grupos.spec.ts                CREATE
      └── banners.spec.ts               CREATE
```

---

### Task 1: Prisma Schema — novos modelos + migração

**Files:**
- Modify: `app/prisma/schema.prisma`

- [ ] **Adicionar modelos Categoria, ProdutoVariante, Grupo, GrupoItem, Banner ao schema**

Adicionar no schema.prisma antes do model RefreshToken (ou após Produto):

```prisma
model Categoria {
  id       String   @id @default(uuid()) @db.Uuid
  tenantId String   @map("tenant_id") @db.Uuid
  nome     String
  ordem    Int      @default(0)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  produtos Produto[]
  tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, nome])
  @@index([tenantId, ordem])
  @@map("categorias")
}

model ProdutoVariante {
  id        String   @id @default(uuid()) @db.Uuid
  produtoId String   @map("produto_id") @db.Uuid
  nome      String
  preco     Decimal  @db.Decimal(10, 2)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  produto Produto @relation(fields: [produtoId], references: [id], onDelete: Cascade)

  @@index([produtoId])
  @@map("produto_variantes")
}

model Grupo {
  id        String   @id @default(uuid()) @db.Uuid
  produtoId String   @map("produto_id") @db.Uuid
  nome      String
  maxSelect Int      @default(1)
  ordem     Int      @default(0)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  produto Produto    @relation(fields: [produtoId], references: [id], onDelete: Cascade)
  itens   GrupoItem[]

  @@index([produtoId, ordem])
  @@map("grupos")
}

model GrupoItem {
  id      String   @id @default(uuid()) @db.Uuid
  grupoId String   @map("grupo_id") @db.Uuid
  nome    String
  preco   Decimal  @default(0) @db.Decimal(10, 2)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  grupo Grupo @relation(fields: [grupoId], references: [id], onDelete: Cascade)

  @@index([grupoId])
  @@map("grupo_itens")
}

model Banner {
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  imagemUrl String   @map("imagem_url")
  linkUrl   String?  @map("link_url")
  titulo    String?
  ordem     Int      @default(0)
  ativo     Boolean  @default(true)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId, ordem])
  @@map("banners")
}
```

- [ ] **Modificar model Produto**: adicionar `categoriaId` + `exibirPrecoAPartirDe`

```prisma
model Produto {
  id                   String             @id @default(uuid()) @db.Uuid
  tenantId             String             @map("tenant_id") @db.Uuid
  nome                 String
  descricao            String?
  preco                Decimal            @db.Decimal(10, 2)
  categoria            Categoria          @default(BEBIDAS) // mantido como fallback
  categoriaId          String?            @map("categoria_id") @db.Uuid
  disponivel           Boolean            @default(true)
  destaque             Boolean            @default(false)
  imagemUrl            String?            @map("imagem_url")
  exibirPrecoAPartirDe Boolean            @default(true) @map("exibir_preco_a_partir_de")
  createdAt            DateTime           @default(now()) @map("created_at")
  updatedAt            DateTime           @updatedAt @map("updated_at")

  tenant    Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  categoriaRel Categoria?    @relation(fields: [categoriaId], references: [id])
  variantes ProdutoVariante[]
  grupos    Grupo[]

  @@index([tenantId])
  @@index([tenantId, categoria])
  @@map("produtos")
}
```

- [ ] **Rodar migração Prisma**

Run: `npx prisma migrate dev --name store-content` (from `app/`)
Expected: migration created and applied

- [ ] **Commit**

```bash
git add app/prisma/
git commit -m "feat: add models for categorias, variantes, grupos, banners"
```

---

### Task 2: Upload Module (Backend)

**Files:**
- Create: `app/src/cardapio/upload/upload.module.ts`
- Create: `app/src/cardapio/upload/upload.controller.ts`
- Create: `app/src/cardapio/upload/upload.service.ts`
- Modify: `app/src/cardapio/cardapio.module.ts`
- Modify: `app/src/main.ts` (registrar static files)

- [ ] **UploadService** — salvar arquivo em `app/uploads/:tenantSlug/`, validar tipo/tamanho

```typescript
import { Injectable } from '@nestjs/common';
import { extname, join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { v4 as uuid } from 'uuid';

@Injectable()
export class UploadService {
  private uploadDir = join(process.cwd(), 'uploads');

  async upload(file: Express.Multer.File, tenantSlug: string): Promise<string> {
    const dir = join(this.uploadDir, tenantSlug);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const ext = extname(file.originalname);
    const filename = `${uuid()}${ext}`;
    const filepath = join(dir, filename);
    // file.buffer is available with memory storage
    return filename;
  }

  delete(filename: string, tenantSlug: string): void {
    const filepath = join(this.uploadDir, tenantSlug, filename);
    if (existsSync(filepath)) unlinkSync(filepath);
  }
}
```

- [ ] **UploadController** — `POST /tenants/:tenantId/upload` (multipart), `DELETE /uploads/:tenantSlug/:filename`

```typescript
import { Controller, Post, Delete, Param, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { TenantAuthGuard } from '../../common/guards/tenant-auth.guard';
import { UploadService } from './upload.service';

@Controller('tenants/:tenantId/upload')
@UseGuards(TenantAuthGuard)
export class UploadController {
  constructor(private service: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
        cb(new BadRequestException('Only jpg, png, webp allowed'), false);
      } else cb(null, true);
    },
  }))
  async upload(@Param('tenantId') tenantId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File required');
    const tenant = await this.tenantService.findById(tenantId);
    const filename = await this.service.upload(file, tenant.slug);
    return { url: `/uploads/${tenant.slug}/${filename}` };
  }
}
```

- [ ] **UploadModule** — register UploadController + UploadService + MulterModule

```typescript
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
```

- [ ] **CardapioModule — importar UploadModule**

```typescript
@Module({
  imports: [UploadModule, ...],
  ...
})
```

- [ ] **main.ts — servir uploads como estáticos**

```typescript
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, '..', '..', 'uploads'), { prefix: '/uploads' });
}
```

- [ ] **Commit**

```bash
git add app/src/cardapio/upload/ app/src/cardapio/cardapio.module.ts app/src/main.ts
git commit -m "feat: upload module with local storage"
```

---

### Task 3: Categorias Module (Backend)

**Files:**
- Create: `app/src/cardapio/categorias/categorias.module.ts`
- Create: `app/src/cardapio/categorias/categorias.controller.ts`
- Create: `app/src/cardapio/categorias/categorias.service.ts`
- Modify: `app/src/cardapio/cardapio.module.ts`
- Modify: `app/src/cardapio/produtos.service.ts` (aceitar `categoriaId` no create/update)

- [ ] **CategoriasService** — CRUD + reorder, com validação de exclusão (não permitir se houver produtos)

```typescript
@Injectable()
export class CategoriasService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.platform().categoria.findMany({
      where: { tenantId },
      orderBy: { ordem: 'asc' },
    });
  }

  async create(tenantId: string, dto: { nome: string }) {
    const maxOrdem = await this.prisma.platform().categoria.aggregate({
      where: { tenantId },
      _max: { ordem: true },
    });
    return this.prisma.platform().categoria.create({
      data: { tenantId, nome: dto.nome, ordem: (maxOrdem._max.ordem ?? -1) + 1 },
    });
  }

  async update(id: string, dto: { nome?: string }) {
    return this.prisma.platform().categoria.update({ where: { id }, data: dto });
  }

  async reorder(tenantId: string, ordem: string[]) {
    await Promise.all(
      ordem.map((id, index) =>
        this.prisma.platform().categoria.update({ where: { id }, data: { ordem: index } }),
      ),
    );
  }

  async remove(id: string) {
    const count = await this.prisma.platform().produto.count({ where: { categoriaId: id } });
    if (count > 0) throw new BadRequestException(`Exclua os ${count} produtos desta categoria primeiro`);
    await this.prisma.platform().categoria.delete({ where: { id } });
  }
}
```

- [ ] **CategoriasController**

```typescript
@Controller('tenants/:tenantId/categorias')
@UseGuards(TenantAuthGuard)
export class CategoriasController {
  constructor(private service: CategoriasService) {}

  @Get() findAll(@Param('tenantId') tenantId: string) { return this.service.findAll(tenantId); }
  @Post() create(@Param('tenantId') tenantId: string, @Body() dto: CreateCategoriaDto) { return this.service.create(tenantId, dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateCategoriaDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
  @Put('reorder') reorder(@Param('tenantId') tenantId: string, @Body() dto: ReorderCategoriasDto) { return this.service.reorder(tenantId, dto.ordem); }
}
```

DTOs:

```typescript
// create-categoria.dto.ts
export class CreateCategoriaDto { @IsString() nome: string; }

// update-categoria.dto.ts
export class UpdateCategoriaDto { @IsOptional() @IsString() nome?: string; }

// reorder-categorias.dto.ts
export class ReorderCategoriasDto { @IsArray() @IsString({ each: true }) ordem: string[]; }
```

- [ ] **Modificar produtos.service.ts — aceitar categoriaId no create/update**

No `CreateProdutoDto` e `UpdateProdutoDto`, adicionar campo opcional:

```typescript
@IsOptional()
@IsUUID()
categoriaId?: string;
```

No `findAll` do service, incluir `categoriaRel` na inclusão ou fazer join.

No `create`, popular `categoriaId` se enviado:

```typescript
async create(tenantId: string, dto: CreateProdutoDto) {
  const { categoriaId, ...data } = dto;
  return this.prisma.platform().produto.create({
    data: { ...data, tenantId, categoriaId: categoriaId || undefined },
  });
}
```

- [ ] **Commit**

```bash
git add app/src/cardapio/categorias/ app/src/cardapio/produtos.service.ts app/src/cardapio/produtos.controller.ts app/src/cardapio/cardapio.module.ts
git commit -m "feat: categorias module with CRUD + reorder"
```

---

### Task 4: Variantes Module (Backend)

**Files:**
- Create: `app/src/cardapio/variantes/variantes.module.ts`
- Create: `app/src/cardapio/variantes/variantes.controller.ts`
- Create: `app/src/cardapio/variantes/variantes.service.ts`
- Modify: `app/src/cardapio/cardapio.module.ts`
- Modify: `app/src/cardapio/produtos.service.ts` (calcular preco from variantes)

- [ ] **VariantesService** — CRUD, recalcula preco do produto ao criar/editar/excluir

```typescript
@Injectable()
export class VariantesService {
  constructor(private prisma: PrismaService) {}

  async findAll(produtoId: string) {
    return this.prisma.platform().produtoVariante.findMany({
      where: { produtoId },
      orderBy: { preco: 'asc' },
    });
  }

  async create(produtoId: string, dto: { nome: string; preco: number }) {
    const variante = await this.prisma.platform().produtoVariante.create({
      data: { produtoId, ...dto },
    });
    await this.atualizarPrecoProduto(produtoId);
    return variante;
  }

  async update(id: string, dto: { nome?: string; preco?: number }) {
    const variante = await this.prisma.platform().produtoVariante.update({ where: { id }, data: dto });
    await this.atualizarPrecoProduto(variante.produtoId);
    return variante;
  }

  async remove(id: string) {
    const v = await this.prisma.platform().produtoVariante.findUnique({ where: { id } });
    if (!v) return;
    await this.prisma.platform().produtoVariante.delete({ where: { id } });
    await this.atualizarPrecoProduto(v.produtoId);
  }

  private async atualizarPrecoProduto(produtoId: string) {
    const min = await this.prisma.platform().produtoVariante.aggregate({
      where: { produtoId },
      _min: { preco: true },
    });
    await this.prisma.platform().produto.update({
      where: { id: produtoId },
      data: { preco: min._min.preco ?? 0 },
    });
  }
}
```

- [ ] **VariantesController**

```typescript
@Controller('tenants/:tenantId/produtos/:produtoId/variantes')
@UseGuards(TenantAuthGuard)
export class VariantesController {
  constructor(private service: VariantesService) {}

  @Get() findAll(@Param('produtoId') produtoId: string) { return this.service.findAll(produtoId); }
  @Post() create(@Param('produtoId') produtoId: string, @Body() dto: CreateVarianteDto) { return this.service.create(produtoId, dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateVarianteDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
```

- [ ] **Commit**

```bash
git add app/src/cardapio/variantes/ app/src/cardapio/cardapio.module.ts
git commit -m "feat: variantes module with preco calculation"
```

---

### Task 5: Grupos/Itens Module (Backend)

**Files:**
- Create: `app/src/cardapio/grupos/grupos.module.ts`
- Create: `app/src/cardapio/grupos/grupos.controller.ts`
- Create: `app/src/cardapio/grupos/grupos.service.ts`
- Modify: `app/src/cardapio/cardapio.module.ts`

- [ ] **GruposService** — CRUD grupos + CRUD itens

```typescript
@Injectable()
export class GruposService {
  constructor(private prisma: PrismaService) {}

  async findAll(produtoId: string) {
    return this.prisma.platform().grupo.findMany({
      where: { produtoId },
      orderBy: { ordem: 'asc' },
      include: { itens: { orderBy: { nome: 'asc' } } },
    });
  }

  async create(produtoId: string, dto: { nome: string; maxSelect?: number }) {
    const maxOrdem = await this.prisma.platform().grupo.aggregate({
      where: { produtoId },
      _max: { ordem: true },
    });
    return this.prisma.platform().grupo.create({
      data: { produtoId, nome: dto.nome, maxSelect: dto.maxSelect ?? 1, ordem: (maxOrdem._max.ordem ?? -1) + 1 },
    });
  }

  async update(id: string, dto: { nome?: string; maxSelect?: number }) {
    return this.prisma.platform().grupo.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.prisma.platform().grupoItem.deleteMany({ where: { grupoId: id } });
    await this.prisma.platform().grupo.delete({ where: { id } });
  }

  async criarItem(grupoId: string, dto: { nome: string; preco?: number }) {
    return this.prisma.platform().grupoItem.create({
      data: { grupoId, nome: dto.nome, preco: dto.preco ?? 0 },
    });
  }

  async atualizarItem(id: string, dto: { nome?: string; preco?: number }) {
    return this.prisma.platform().grupoItem.update({ where: { id }, data: dto });
  }

  async removerItem(id: string) {
    await this.prisma.platform().grupoItem.delete({ where: { id } });
  }
}
```

- [ ] **GruposController**

```typescript
@Controller('tenants/:tenantId/produtos/:produtoId/grupos')
@UseGuards(TenantAuthGuard)
export class GruposController {
  constructor(private service: GruposService) {}

  @Get() findAll(@Param('produtoId') produtoId: string) { return this.service.findAll(produtoId); }
  @Post() create(@Param('produtoId') produtoId: string, @Body() dto: CreateGrupoDto) { return this.service.create(produtoId, dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateGrupoDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }

  @Post(':grupoId/itens') criarItem(@Param('grupoId') grupoId: string, @Body() dto: CreateGrupoItemDto) { return this.service.criarItem(grupoId, dto); }
  @Patch('itens/:id') atualizarItem(@Param('id') id: string, @Body() dto: UpdateGrupoItemDto) { return this.service.atualizarItem(id, dto); }
  @Delete('itens/:id') removerItem(@Param('id') id: string) { return this.service.removerItem(id); }
}
```

- [ ] **Commit**

```bash
git add app/src/cardapio/grupos/ app/src/cardapio/cardapio.module.ts
git commit -m "feat: grupos module with items CRUD"
```

---

### Task 6: Banners Module (Backend)

**Files:**
- Create: `app/src/cardapio/banners/banners.module.ts`
- Create: `app/src/cardapio/banners/banners.controller.ts`
- Create: `app/src/cardapio/banners/banners.service.ts`
- Modify: `app/src/cardapio/cardapio.module.ts`

- [ ] **BannersService** — CRUD atrelado ao tenant

```typescript
@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.platform().banner.findMany({
      where: { tenantId },
      orderBy: { ordem: 'asc' },
    });
  }

  async create(tenantId: string, dto: { imagemUrl: string; titulo?: string; linkUrl?: string }) {
    const maxOrdem = await this.prisma.platform().banner.aggregate({
      where: { tenantId },
      _max: { ordem: true },
    });
    return this.prisma.platform().banner.create({
      data: { tenantId, ...dto, ordem: (maxOrdem._max.ordem ?? -1) + 1 },
    });
  }

  async update(id: string, dto: { imagemUrl?: string; titulo?: string; linkUrl?: string; ativo?: boolean }) {
    return this.prisma.platform().banner.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.prisma.platform().banner.delete({ where: { id } });
  }
}
```

- [ ] **BannersController**

```typescript
@Controller('tenants/:tenantId/banners')
@UseGuards(TenantAuthGuard)
export class BannersController {
  constructor(private service: BannersService) {}

  @Get() findAll(@Param('tenantId') tenantId: string) { return this.service.findAll(tenantId); }
  @Post() create(@Param('tenantId') tenantId: string, @Body() dto: CreateBannerDto) { return this.service.create(tenantId, dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateBannerDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
```

- [ ] **Commit**

```bash
git add app/src/cardapio/banners/ app/src/cardapio/cardapio.module.ts
git commit -m "feat: banners module with CRUD"
```

---

### Task 7: Public Cardápio — retornar variantes, grupos, banners

**Files:**
- Modify: `app/src/cardapio/public-cardapio.controller.ts`

- [ ] **Modificar `GET /api/public/:slug/produtos`** — incluir variantes, grupos com itens, categoria

```typescript
@Get(':slug/produtos')
async findProdutos(@Param('slug') slug: string) {
  // lookup tenant by slug
  const produtos = await this.prisma.platform().produto.findMany({
    where: { tenantId, disponivel: true },
    include: {
      categoriaRel: true,
      variantes: { orderBy: { preco: 'asc' } },
      grupos: {
        orderBy: { ordem: 'asc' },
        include: { itens: { orderBy: { nome: 'asc' } } },
      },
    },
    orderBy: { nome: 'asc' },
  });
  return produtos;
}
```

- [ ] **Adicionar `GET /api/public/:slug/banners`**

```typescript
@Get(':slug/banners')
async findBanners(@Param('slug') slug: string) {
  const tenant = await this.tenantService.findBySlug(slug);
  return this.prisma.platform().banner.findMany({
    where: { tenantId: tenant.id, ativo: true },
    orderBy: { ordem: 'asc' },
  });
}
```

- [ ] **Commit**

```bash
git add app/src/cardapio/public-cardapio.controller.ts
git commit -m "feat: public cardapio returns variantes, grupos, banners"
```

---

### Task 8: Frontend — Types + Services

**Files:**
- Create: `web/src/types/categoria.ts`
- Create: `web/src/types/variante.ts`
- Create: `web/src/types/grupo.ts`
- Create: `web/src/types/banner.ts`
- Modify: `web/src/types/index.ts`
- Create: `web/src/services/categorias.service.ts`
- Create: `web/src/services/variantes.service.ts`
- Create: `web/src/services/grupos.service.ts`
- Create: `web/src/services/banners.service.ts`
- Create: `web/src/services/upload.service.ts`

- [ ] **Criar types**

`web/src/types/categoria.ts`:
```typescript
export interface Categoria {
  id: string
  nome: string
  ordem: number
}
export interface CreateCategoriaRequest { nome: string }
export interface UpdateCategoriaRequest { nome?: string }
```

`web/src/types/variante.ts`:
```typescript
export interface ProdutoVariante {
  id: string
  produtoId: string
  nome: string
  preco: number
}
export interface CreateVarianteRequest { nome: string; preco: number }
export interface UpdateVarianteRequest { nome?: string; preco?: number }
```

`web/src/types/grupo.ts`:
```typescript
export interface GrupoItem {
  id: string
  nome: string
  preco: number
}
export interface Grupo {
  id: string
  produtoId: string
  nome: string
  maxSelect: number
  ordem: number
  itens: GrupoItem[]
}
export interface CreateGrupoRequest { nome: string; maxSelect?: number }
export interface UpdateGrupoRequest { nome?: string; maxSelect?: number }
export interface CreateGrupoItemRequest { nome: string; preco?: number }
export interface UpdateGrupoItemRequest { nome?: string; preco?: number }
```

`web/src/types/banner.ts`:
```typescript
export interface Banner {
  id: string
  imagemUrl: string
  titulo?: string | null
  linkUrl?: string | null
  ordem: number
  ativo: boolean
}
export interface CreateBannerRequest { imagemUrl: string; titulo?: string; linkUrl?: string }
export interface UpdateBannerRequest { imagemUrl?: string; titulo?: string; linkUrl?: string; ativo?: boolean }
```

- [ ] **Criar services**

Each service follows the pattern:

```typescript
import { api } from '../lib/api-client'
import type { Categoria, CreateCategoriaRequest, UpdateCategoriaRequest } from '../types'

export async function listarCategorias(tenantId: string): Promise<Categoria[]> {
  return api.get<Categoria[]>(`/tenants/${tenantId}/categorias`)
}
export async function criarCategoria(tenantId: string, data: CreateCategoriaRequest): Promise<Categoria> {
  return api.post<Categoria>(`/tenants/${tenantId}/categorias`, data)
}
export async function atualizarCategoria(id: string, data: UpdateCategoriaRequest): Promise<Categoria> {
  return api.patch<Categoria>(`/tenants/${tenantId}/categorias/${id}`, data)
}
export async function excluirCategoria(tenantId: string, id: string): Promise<void> {
  return api.delete(`/tenants/${tenantId}/categorias/${id}`)
}
export async function reordenarCategorias(tenantId: string, ordem: string[]): Promise<void> {
  return api.put(`/tenants/${tenantId}/categorias/reorder`, { ordem })
}
```

Same pattern for variantes, grupos, banners.

`web/src/services/upload.service.ts`:
```typescript
import { api } from '../lib/api-client'

export async function uploadImagem(tenantId: string, file: File): Promise<{ url: string }> {
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
```

- [ ] **Modificar `types/index.ts`** — exportar novos tipos

```typescript
export type { Categoria, CreateCategoriaRequest, UpdateCategoriaRequest } from './categoria'
export type { ProdutoVariante, CreateVarianteRequest, UpdateVarianteRequest } from './variante'
export type { Grupo, GrupoItem, CreateGrupoRequest, UpdateGrupoRequest, CreateGrupoItemRequest, UpdateGrupoItemRequest } from './grupo'
export type { Banner, CreateBannerRequest, UpdateBannerRequest } from './banner'
```

- [ ] **Commit**

```bash
git add web/src/types/ web/src/services/
git commit -m "feat: frontend types and services for store content"
```

---

### Task 9: Frontend — ImageUpload Component

**Files:**
- Create: `web/src/components/ui/ImageUpload.tsx`

- [ ] **Criar ImageUpload** — dropzone com preview

```typescript
import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { uploadImagem } from '../../services/upload.service'

interface ImageUploadProps {
  tenantId: string
  currentUrl?: string | null
  onUpload: (url: string) => void
  onRemove?: () => void
}

export function ImageUpload({ tenantId, currentUrl, onUpload, onRemove }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { url } = await uploadImagem(tenantId, file)
      onUpload(url)
    } catch {}
    setUploading(false)
  }

  return (
    <div className="flex items-center gap-3">
      {currentUrl ? (
        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-base-300">
          <img src={currentUrl} alt="" className="w-full h-full object-cover" />
          {onRemove && (
            <button onClick={onRemove} className="absolute top-0.5 right-0.5 btn btn-xs btn-circle btn-ghost bg-base-100/80">
              <X size={12} />
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="w-20 h-20 rounded-lg border-2 border-dashed border-base-300 flex items-center justify-center cursor-pointer hover:border-accent"
        >
          {uploading ? <span className="loading loading-spinner" /> : <Upload size={20} className="opacity-40" />}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add web/src/components/ui/ImageUpload.tsx
git commit -m "feat: ImageUpload component with preview"
```

---

### Task 10: Frontend — Modificar Cardápio Page (admin)

**Files:**
- Modify: `web/src/routes/admin.loja.cardapio.lazy.tsx`
- Modify: `web/src/types/cardapio.ts` (adicionar `categoriaId` no Produto)

- [ ] **Adicionar `categoriaId + exibirPrecoAPartirDe` no type Produto**

```typescript
export interface Produto {
  // ... existing fields
  categoriaId: string | null
  exibirPrecoAPartirDe: boolean
  categoriaRel?: { id: string; nome: string } // populated on fetch
}
```

- [ ] **Modificar formulário de produto**:
  - Categoria: select carregado de `listarCategorias()` em vez de enum fixo
  - Seção "Variantes": tabela inline, add/remove, recalcula preço exibido
  - Seção "Grupos": cada grupo com nome, maxSelect, lista de itens (add/remove)
  - Upload de imagem usando `ImageUpload`

- [ ] **Commit**

```bash
git add web/src/routes/admin.loja.cardapio.lazy.tsx web/src/types/cardapio.ts
git commit -m "feat: product form with categorias, variantes, grupos, image upload"
```

---

### Task 11: Frontend — Categorias Page

**Files:**
- Create: `web/src/routes/admin.loja.categorias.lazy.tsx`
- Modify: `web/src/route-tree.ts`

- [ ] **Criar rota `admin/loja/categorias`** no route-tree

```typescript
// route-tree.ts — adicionar após /admin/loja/aparencia
new Route({
  getParentRoute: () => adminLojaRoute,
  path: 'categorias',
  component: () => import('./routes/admin.loja.categorias.lazy.tsx'),
}),
```

- [ ] **Criar CategoriasPage** — lista, criar, editar, excluir, reordenar

```typescript
// admin.loja.categorias.lazy.tsx
// Lista com input de ordem (número), nome editável inline
// Botões: adicionar, salvar ordem, excluir (com modal confirmação)
// Usa dialog.modal para criar/editar
```

- [ ] **Commit**

```bash
git add web/src/routes/admin.loja.categorias.lazy.tsx web/src/route-tree.ts
git commit -m "feat: categorias admin page"
```

---

### Task 12: Frontend — Banners Page

**Files:**
- Create: `web/src/routes/admin.loja.banners.lazy.tsx`
- Modify: `web/src/route-tree.ts`

- [ ] **Criar rota `admin/loja/banners`** no route-tree

```typescript
new Route({
  getParentRoute: () => adminLojaRoute,
  path: 'banners',
  component: () => import('./routes/admin.loja.banners.lazy.tsx'),
}),
```

- [ ] **Criar BannersPage** — grid com preview, criar/editar modal, toggle ativo

```typescript
// Grid de cards com imagem, título, status
// Modal criar/editar: upload imagem, título, link opcional
// Toggle ativo/inativo
// Excluir com modal confirmação
```

- [ ] **Commit**

```bash
git add web/src/routes/admin.loja.banners.lazy.tsx web/src/route-tree.ts
git commit -m "feat: banners admin page"
```

---

### Task 13: Frontend — Modificar Cardápio Público

**Files:**
- Modify: `web/src/routes/loja.$slug.lazy.tsx`

- [ ] **Modificar listagem de produtos** — exibir "a partir de R$ X,XX"

```typescript
// Se produto.variantes?.length > 0 → mostrar "a partir de R$ {min(preco)}"
// Se não → mostrar preco normal
// Exibir categoria.nome em vez do enum
```

- [ ] **Criar modal de produto** — ao clicar no produto, abre dialog.modal com:

```html
<dialog className="modal" ref={modalRef}>
  <div className="modal-box max-w-lg">
    <h3>{produto.nome}</h3>
    {produto.descricao && <p>{produto.descricao}</p>}
    
    <!-- Variantes (radio) -->
    {produto.variantes?.map(v => (
      <label className="flex items-center gap-2 p-2">
        <input type="radio" name="variante" value={v.id} onChange={() => setSelectedVariante(v)} />
        {v.nome} — R$ {Number(v.preco).toFixed(2)}
      </label>
    ))}
    
    <!-- Grupos (checkboxes com limite) -->
    {produto.grupos?.map(grupo => (
      <div className="rounded-lg border p-3">
        <p>{grupo.nome} {grupo.maxSelect > 0 ? `(escolha até ${grupo.maxSelect})` : ''}</p>
        {grupo.itens?.map(item => (
          <label className="flex items-center gap-2 p-1">
            <input type="checkbox" />
            {item.nome}
            {Number(item.preco) > 0 ? ` +R$ ${Number(item.preco).toFixed(2)}` : ''}
          </label>
        ))}
      </div>
    ))}
    
    <!-- Total -->
    <p className="text-xl font-bold">Total: R$ {total}</p>
  </div>
</dialog>
```

- [ ] **Commit**

```bash
git add web/src/routes/loja.$slug.lazy.tsx
git commit -m "feat: public cardapio modal with variantes and grupos"
```

---

### Task 14: E2E Tests

**Files:**
- Create: `app/test/e2e/categorias.spec.ts`
- Create: `app/test/e2e/variantes.spec.ts`
- Create: `app/test/e2e/grupos.spec.ts`
- Create: `app/test/e2e/banners.spec.ts`

- [ ] **Categorias e2e test** — CRUD básico com auth de tenant

```typescript
import { describe, it, expect } from 'vitest';

describe('Categorias (tenant-scoped)', () => {
  it('POST /api/tenants/:id/categorias — cria categoria', async () => {
    // login como tenant owner, POST, verifica 201 + nome
  });
  it('GET /api/tenants/:id/categorias — lista ordenado', async () => {
    // cria 2, verifica ordem
  });
  it('DELETE /api/tenants/:id/categorias/:id — rejeita se tem produtos', async () => {
    // cria categoria, associa produto, tenta excluir → 400
  });
  it('DELETE /api/tenants/:id/categorias/:id — exclui se vazia', async () => {
    // cria categoria sem produtos, exclui → 200
  });
});
```

- [ ] **Variantes e2e test** — CRUD + recalcula preco do produto

```typescript
describe('Variantes', () => {
  it('POST variante — cria e recalcula preco do produto', async () => {
    // login, cria produto com preco 0
    // cria variante 300ml R$14,90
    // GET produto → preco = 14.90
  });
  it('DELETE variante — recalcula preco', async () => {
    // cria 2 variantes, exclui a mais barata, verifica preco
  });
});
```

- [ ] **Grupos e2e test** — CRUD grupos + itens

```typescript
describe('Grupos', () => {
  it('POST grupo + itens — cria grupo e adiciona itens', async () => {
    // login, cria produto, cria grupo "Complemento"
    // POST item "Granola" preco 0
    // POST item "Paçoca" preco 2
    // GET grupos → retorna com itens aninhados
  });
});
```

- [ ] **Banners e2e test** — CRUD básico

```typescript
describe('Banners', () => {
  it('CRUD banner', async () => {
    // create, list, update (desativar), delete
  });
});
```

- [ ] **Rodar todos os e2e e verificar**

Run: `cd app && npx vitest run test/e2e --no-file-parallelism`
Expected: All tests pass (existing 33 + novos)

- [ ] **Commit final**

```bash
git add -A && git commit -m "feat: e2e tests for store content"
```

---

## Self-Review Checklist

- [ ] Todas as seções da spec têm tasks correspondentes?
  - Categorias → Tasks 3, 8, 11, 14
  - Variantes → Tasks 4, 8, 10, 14
  - Grupos/Itens → Tasks 5, 8, 10, 14
  - Banners → Tasks 6, 8, 12, 14
  - Upload → Tasks 2, 9, 10
  - Cardápio público → Tasks 7, 13
  - Migração → Task 1
- [ ] Placeholder scan: nenhum "TBD", "TODO", código incompleto
- [ ] Tipos consistentes entre tasks? (categoriaId, produtoId, etc. usados uniformemente)
