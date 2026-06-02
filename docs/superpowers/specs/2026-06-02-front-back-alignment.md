# Alinhamento Front/Back — Galeria, Produtos, DTOs

## Resumo
Ajustar frontend para refletir o backend existente: galeria de imagens (scan da pasta), campo `exibirPrecoAPartirDe`, preço auto-calculado via variantes, categoria como objeto completo, e DTOs aceitando apenas `categoriaId`.

## 1. Galeria de Imagens

### Backend
- **`GET /tenants/:tenantId/galeria`** (novo, no `UploadController`)
  - Lê diretório `uploads/:tenantSlug/` com `fs.readdir`
  - Retorna `[{ filename, url, size, lastModified }]` ordenado por data (mais recente primeiro)
  - Precisa resolver `tenantId → slug` via `TenantService`
  - Dispensa model Prisma — scan simples do disco
- DELETE já existe: `DELETE /tenants/:tenantId/uploads/:filename`
- Upload já existe: `POST /tenants/:tenantId/upload`

### Frontend
- Nova rota: `/admin/loja/galeria` → `web/src/routes/admin.loja.galeria.lazy.tsx`
- Grid de imagens com:
  - Upload button (reusa `ImageUpload` adaptado para galeria)
  - Miniaturas com overlay ao hover: botão "Copiar URL" + botão "Excluir"
  - Loading spinner enquanto carrega
  - Empty state
- Modal de upload: dropzone simples, mostra preview, confirma
- Service: `web/src/services/galeria.service.ts` — `listarGaleria(tenantId)`, `excluirImagem(tenantId, filename)`
- Sidebar (`AdminSidebar.tsx`): adicionar item "Galeria" com ícone `Images` (Lucide) após "Banners"

### Observações
- `ImageUpload` atual é específico (80x80, usado inline em formulário). Para galeria, criar `GaleriaUpload` ou adaptar o existente.
- URLs das imagens são relativas: `/uploads/:slug/:filename`

## 2. `exibirPrecoAPartirDe`

### Backend
- **`CreateProdutoDto`**: adicionar `@IsOptional() @IsBoolean() exibirPrecoAPartirDe?: boolean`
- **`UpdateProdutoDto`**: adicionar `@IsOptional() @IsBoolean() exibirPrecoAPartirDe?: boolean`
- **`CardapioService.create/update`**: passar campo para o Prisma (já existe no schema)

### Frontend
- **`web/src/types/cardapio.ts`**: adicionar `exibirPrecoAPartirDe` em `CreateProdutoRequest` e `UpdateProdutoRequest`
- **`admin.loja.cardapio.lazy.tsx`**: adicionar checkbox "Exibir 'a partir de'R$" no formulário (ao lado ou abaixo do campo preço, visível quando há variantes)

## 3. Preço Auto-Calculado (via Variantes)

### Backend
- **`CardapioService.findAll`**: incluir `include: { variantes: true }` no `findMany`
- **`CardapioService.findOne`**: incluir `include: { variantes: true }` no `findFirst`
- **Lógica**: se `produto.variantes.length > 0`, setar `produto.preco = Math.min(...variantes.map(v => v.preco))` (converter Decimal para number, operar, e retornar)
- **Importante**: não alterar o DB — cálculo apenas na resposta (read-time)

### Frontend
- Nenhuma mudança necessária — o frontend já usa `produto.preco` que virá calculado
- Na página pública (`loja.$slug.lazy.tsx`), o preço já é exibido dinamicamente

## 4. Categoria como Objeto Completo

### Backend
- **`CardapioService.findAll`**: adicionar `include: { categoriaCardapio: true }` no `findMany`
- **`CardapioService.findOne`**: adicionar `include: { categoriaCardapio: true }` no `findFirst`
- Resposta passa a incluir `categoriaCardapio` populado (objeto) em vez de apenas `categoriaId`
- Compatibilidade reversa: `categoriaId` continua no response

### Frontend
- **`web/src/types/cardapio.ts`**: `Produto` já tem `categoriaCardapio: Categoria | null` — mantido
- **`admin.loja.cardapio.lazy.tsx`**: já exibe o nome da categoria na listagem — verificar se usa `categoriaCardapio.nome`

## 5. DTO — `categoria` (enum) Opcional

### Backend
- **`CreateProdutoDto`**: `categoria` muda de `@IsEnum(Categoria)` (obrigatório) para `@IsOptional() @IsEnum(Categoria)`
- **`CardapioService.create`**: se `dto.categoria` não for enviado, usar `'BEBIDAS'` como default (pois coluna DB é NOT NULL)
- **`CardapioService.update`**: já é opcional — não precisa mudar
- **Prisma schema**: `categoria` continua como `Categoria` (NOT NULL) por enquanto. Remover require migration posterior.

### Frontend
- **`web/src/types/cardapio.ts`**: `CreateProdutoRequest.categoria` vira opcional
- **`admin.loja.cardapio.lazy.tsx`**: remover select de `categoria` (enum) do formulário — só usar `categoriaId` vindo de `CategoriaCardapio`

## Cronograma / Ordem de Implementação

1. Galeria (back + front)
2. `exibirPrecoAPartirDe` (back + front)
3. Preço auto-calculado (back)
4. Categoria objeto completo (back)
5. DTO categoria opcional (back + front)
