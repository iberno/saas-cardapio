# Store Content: Categorias, Variantes, Grupos/Itens, Banners, Imagens

## Resumo
Sistema completo de conteúdo para loja: categorias editáveis, variantes de produto (tamanhos/pesos com preço), grupos de itens configuráveis (toppings/adicionais com limite e preço), banners promocionais, e upload de imagens por loja.

---

## 1. Modelo de Dados (Prisma)

### Categoria (nova — substitui enum)
```prisma
model Categoria {
  id       String   @id @default(uuid()) @db.Uuid
  tenantId String   @map("tenant_id") @db.Uuid
  nome     String
  ordem    Int      @default(0)
  produtos Produto[]

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  @@unique([tenantId, nome])
  @@index([tenantId, ordem])
  @@map("categorias")
}
```

### Produto (modificado)
- `categoria` (enum) → `categoriaId` (FK nullable para `Categoria`)
- `preco` mantido como campo. Se o produto tem variantes → `preco` exibido = `min(variantes.preco)` (calculado no service ao salvar). Se não tem variantes → `preco` funciona como antes (entrada manual).
- Novo campo `exibirPrecoAPartirDe: Boolean` (default true) — controla se mostra "a partir de" no cardápio

```prisma
model Produto {
  // campos existentes mantidos
  categoriaId    String?  @map("categoria_id") @db.Uuid
  exibirPrecoAPartirDe Boolean @default(true) @map("exibir_preco_a_partir_de")

  categoria   Categoria?        @relation(fields: [categoriaId], references: [id])
  variantes   ProdutoVariante[]
  grupos      Grupo[]
  // tenant, createdAt, updatedAt existentes
}
```

### ProdutoVariante (nova)
```prisma
model ProdutoVariante {
  id        String @id @default(uuid()) @db.Uuid
  produtoId String @map("produto_id") @db.Uuid
  nome      String // "300ml", "500g", "Médio"
  preco     Decimal @db.Decimal(10, 2)

  produto Produto @relation(fields: [produtoId], references: [id], onDelete: Cascade)
  @@index([produtoId])
  @@map("produto_variantes")
}
```

### Grupo (nova)
```prisma
model Grupo {
  id        String @id @default(uuid()) @db.Uuid
  produtoId String @map("produto_id") @db.Uuid
  nome      String // "Complemento", "Cobertura"
  maxSelect Int    @default(1) // 0 = sem limite
  ordem     Int    @default(0)

  produto Produto    @relation(fields: [produtoId], references: [id], onDelete: Cascade)
  itens   GrupoItem[]

  @@index([produtoId, ordem])
  @@map("grupos")
}
```

### GrupoItem (nova)
```prisma
model GrupoItem {
  id      String @id @default(uuid()) @db.Uuid
  grupoId String @map("grupo_id") @db.Uuid
  nome    String // "Granola", "Paçoca"
  preco   Decimal @default(0) @db.Decimal(10, 2) // 0 = incluso, >0 = pago

  grupo Grupo @relation(fields: [grupoId], references: [id], onDelete: Cascade)

  @@index([grupoId])
  @@map("grupo_itens")
}
```

### Banner (nova)
```prisma
model Banner {
  id         String   @id @default(uuid()) @db.Uuid
  tenantId   String   @map("tenant_id") @db.Uuid
  imagemUrl  String   @map("imagem_url")
  linkUrl    String?  @map("link_url")
  titulo     String?
  ordem      Int      @default(0)
  ativo      Boolean  @default(true)
  createdAt  DateTime @default(now()) @map("created_at")

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId, ordem])
  @@map("banners")
}
```

---

## 2. Upload de Imagens

- Upload via NestJS (`multer`, `@nestjs/platform-express`)
- Armazenamento local em `app/uploads/:tenantSlug/`
- Endpoint `POST /tenants/:tenantId/upload` — retorna URL relativa
- Rotas: `/uploads/:tenantSlug/:filename` servido como estático
- Validação: imagens apenas (jpg, png, webp), max 5MB
- CRUD de imagens (upload + delete)
- Cada imagem pode ser associada a: produto, banner, ou galeria

---

## 3. APIs

### Categorias
- `GET /tenants/:tenantId/categorias` — listar
- `POST /tenants/:tenantId/categorias` — criar
- `PATCH /tenants/:tenantId/categorias/:id` — editar
- `DELETE /tenants/:tenantId/categorias/:id` — excluir (rejeita se houver produtos vinculados)
- `PUT /tenants/:tenantId/categorias/reorder` — reordenar (body: `{ ordem: string[] }`)

### Variantes
- `GET /tenants/:tenantId/produtos/:produtoId/variantes` — listar
- `POST /tenants/:tenantId/produtos/:produtoId/variantes` — criar
- `PATCH /tenants/:tenantId/produtos/:produtoId/variantes/:id` — editar
- `DELETE /tenants/:tenantId/produtos/:produtoId/variantes/:id` — excluir

### Grupos/Itens
- `GET /tenants/:tenantId/produtos/:produtoId/grupos` — listar grupos com itens
- `POST /tenants/:tenantId/produtos/:produtoId/grupos` — criar grupo
- `PATCH /tenants/:tenantId/produtos/:produtoId/grupos/:id` — editar grupo
- `DELETE /tenants/:tenantId/produtos/:produtoId/grupos/:id` — excluir grupo
- `POST /tenants/:tenantId/grupos/:grupoId/itens` — criar item
- `PATCH /tenants/:tenantId/grupos/:grupoId/itens/:id` — editar item
- `DELETE /tenants/:tenantId/grupos/:grupoId/itens/:id` — excluir item

### Banners
- `GET /tenants/:tenantId/banners` — listar
- `POST /tenants/:tenantId/banners` — criar (com upload)
- `PATCH /tenants/:tenantId/banners/:id` — editar
- `DELETE /tenants/:tenantId/banners/:id` — excluir

### Upload
- `POST /tenants/:tenantId/upload` — upload multipart, retorna `{ url: string }`. URL usada nos formulários de produto/banner.
- `DELETE /uploads/:tenantSlug/:filename` — deletar arquivo

### Produto (modificado)
- `POST /tenants/:tenantId/produtos` — aceita `categoriaId`, ignora `categoria` (enum)
- `PATCH /tenants/:tenantId/produtos/:id` — aceita `categoriaId`
- `GET /tenants/:tenantId/produtos` — retorna `preco` como menor valor das variantes, `categoria` com objeto completo da categoria
- Novo campo `exibirPrecoAPartirDe` no DTO

### Público (cardápio público)
- `GET /api/public/:slug/produtos` — retorna produtos com variantes, grupos e itens aninhados
- `GET /api/public/:slug/banners` — retorna banners ativos da loja

---

## 4. Frontend — Rotas Admin

### `/admin/loja/cardapio` (modificado)
- Formulário de produto: campo categoria vira select carregado da API
- Seção "Variantes": tabela inline com nome + preço, botão adicionar/remover
- Seção "Grupos": cada grupo com nome + maxSelect + lista de itens
- Preço do produto: exibido como "a partir de R$ X,XX"

### `/admin/loja/categorias` (nova rota)
- Lista de categorias da loja
- Criar, editar, excluir, reordenar (drag & drop com setas ou input numérico)

### `/admin/loja/banners` (nova rota)
- Grid de banners com preview da imagem
- Criar/editar: upload de imagem, título, link opcional
- Toggle ativo/inativo
- Reordenar

### Upload de imagem
- Componente de upload reutilizável (dropzone + preview)
- Usado em: produto (imagem principal), banner, galeria

---

## 5. Cardápio Público (modificado)

- Exibe "a partir de R$ X,XX" quando produto tem variantes
- Ao clicar no produto, abre modal com:
  - Seletor de variante (radio buttons)
  - Seções de grupos com checkboxes e limite
  - Subtotais por grupo item
- Banner/carrossel no topo da página

---

## 6. Migração

1. Criar tabelas: `categorias`, `produto_variantes`, `grupos`, `grupo_itens`, `banners`
2. Migrar dados: converter enum `Categoria` para registros em `categorias` por tenant
3. Adicionar coluna `categoria_id` em `produtos`, popular com FK
4. Remover coluna `categoria` (enum) de `produtos` (opcional, pode manter como fallback)

---

## 7. Fora do Escopo (para próximas etapas)

- Carrinho/checkout (usará os grupos/itens)
- Pedidos e histórico
- Pontos fidelidade
- Notificações push
