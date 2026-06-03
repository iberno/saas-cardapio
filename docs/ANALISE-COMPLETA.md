# Análise Completa do Projeto — SaaS Cardápio

> **Data:** 03/06/2026
> **Propósito:** Documentar o estado atual do projeto, funcionalidades implementadas, lacunas, e oportunidades de melhoria.

---

## 1. Visão Geral

Plataforma SaaS para cardápios digitais multi-loja. Cada loja tem seu próprio cardápio online com tema customizável, gestão de produtos, categorias, variantes, grupos de adicionais, banners e pedidos.

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Backend | NestJS + TypeScript | 11 |
| Frontend | React + Vite + TanStack Router | 19 / 6 |
| Banco | PostgreSQL via Prisma ORM | 16+ |
| UI | Tailwind CSS + DaisyUI | 4 / 5 |
| Auth | JWT em cookies httpOnly + double-submit CSRF | — |
| Testes | Vitest + Supertest | 3 |

---

## 2. Funcionalidades Implementadas

### 2.1 Core da Plataforma
- [x] **Multi-tenancy** — Isolamento completo entre lojas (dados, temas, configurações)
- [x] **Auth 3 níveis** — Platform Admin (`pa_session`), Tenant User (`tu_session`), Customer (`cu_session`)
- [x] **JWT + Refresh Token** — Access token 15min, refresh token 7 dias com token rotation
- [x] **CSRF Protection** — Double-submit cookie pattern
- [x] **Rate Limiting** — NestJS Throttler integrado
- [x] **Brute-force Lockout** — 5 tentativas falhas = 30min bloqueio (platform + tenant)
- [x] **Audit Log** — Log de ações dos usuários (login, operações CRUD)
- [x] **Cookie Domain** — Suporte a multi-subdomínio em produção

### 2.2 Admin — Plataforma (`/admin`)
- [x] **Dashboard** — Estatísticas: total de lojas ativas, total de produtos
- [x] **CRUD de Lojas** — Criar, editar, suspender/ativar, excluir lojas
- [x] **Listagem com paginação** — Busca por nome/slug

### 2.3 Admin — Loja (`/admin/loja`)
- [x] **Dashboard** — Contagem de produtos da loja
- [x] **Cardápio** — CRUD completo de produtos com:
  - Nome, descrição, preço, imagem
  - Categorias editáveis (select dinâmico via API)
  - Variantes (tamanhos com preço individual)
  - Grupos de adicionais com itens (ex: "Complementos" com "Granola", "Paçoca")
  - Checkbox "Exibir a partir de"
  - Upload de imagem via ImageUpload
  - Toggle disponível/destaque
- [x] **Categorias** — CRUD + reordenação, proteção contra exclusão com produtos vinculados
- [x] **Aparência** — Editor de tema com 12 cores (primary, secondary, accent, neutral, base 1-4, content variants) + preview ao vivo
- [x] **Banners** — CRUD com upload de imagem, título, link, toggle ativo/inativo, reordenação
- [x] **Galeria** — Upload, grid de imagens, copiar URL, excluir
- [x] **Configurações** — Nome, telefone, endereço, Instagram, horários (formato texto), métodos de pagamento, programa de pontos fidelidade
- [x] **Pedidos** — Listagem com filtro por status, polling a cada 8s com som de novo pedido, avança status, impressão de cupom, cancelamento

### 2.4 Público (`/loja/:slug`)
- [x] **Cardápio temático** — Cores da loja aplicadas automaticamente
- [x] **Header** — Logo, indicador aberto/fechado, Instagram, carrinho com badge, login customer
- [x] **Busca** — Barra de busca com filtro por nome/descrição
- [x] **Pílulas de categoria** — Scroll horizontal com filtro de categoria
- [x] **Banners** — Carrossel horizontal com snap
- [x] **Card de produto** — Layout `card-side` com imagem + placeholder SVG
- [x] **Modal bottom-sheet** — Variantes (radio), grupos de adicionais (checkbox com limite), observação, seletor de quantidade, turbinar (se disponível)
- [x] **Carrinho drawer** — Slide lateral, editar item, +/- quantidade, observação geral, remover, finalizar
- [x] **WhatsApp** — Compor mensagem com resumo do pedido + link via API
- [x] **Login customer** — Modal com phone (E.164), auto-cadastro via upsert
- [x] **Meus Pedidos** — Histórico com status, barra de progresso
- [x] **Footer** — Endereço, telefone, Instagram, horários, pagamento
- [x] **Modal Info** — Informações detalhadas da loja
- [x] **Indicador aberto/fechado** — Baseado nos horários configurados

### 2.5 API Pública (`/api/public/:slug`)
- [x] `GET /produtos` — Produtos disponíveis com variantes, grupos, categorias
- [x] `GET /loja` — Dados da loja (nome, tema, telefone)
- [x] `GET /banners` — Banners ativos
- [x] `POST /orders` — Criar pedido com itens e adicionais
- [x] `GET /orders` — Listar pedidos por telefone
- [x] `GET /orders/:id` — Detalhe do pedido
- [x] **Pontos fidelidade** — Acumula pontos automaticamente ao fazer pedido

### 2.6 Segurança
- [x] Senhas com Argon2id
- [x] Hash de tokens (SHA-256)
- [x] Rate limiting por rota
- [x] Helmet headers
- [x] Guards: PlatformAuth, TenantUserAuth, CustomerAuth, TenantOrPlatform

### 2.7 UX/UI
- [x] Tema claro/escuro global (DaisyUI: business / corporate)
- [x] Tema customizado por loja (CSS variables via style tag)
- [x] Responsivo (mobile-first)
- [x] PWA manifest + meta tags
- [x] Som de novo pedido (Web Audio API)
- [x] Cupom térmico (58mm)
- [x] Loading states e empty states na maioria das páginas

---

## 3. O que Está Nos Planos (Specs) mas Não Implementado

### 3.1 Da Documentação Atual
Os specs em `docs/superpowers/` já foram integralmente implementados:
- ✅ **Store Content Design** (categorias, variantes, grupos, banners, upload) — 100% feito
- ✅ **Front/Back Alignment** (galeria, `exibirPrecoAPartirDe`, preço auto-calculado) — 100% feito
- ✅ **FRONTEND-ADAPTACAO.md** — Todas as fases implementadas

### 3.2 README — Checkboxes Desatualizadas
As checklists do README estão desatualizadas (marcam como pendente o que já está feito). Seria bom atualizá-las.

---

## 4. Lacunas e Oportunidades de Melhoria

### 4.1 🟡 Média Prioridade — Já Parcialmente Implementado

| Item | O quê | Onde | Por que |
|------|-------|------|---------|
| **TOTP / 2FA** | Schema tem `totpSecret` + `totpEnabled` mas sem fluxo de ativação/verificação | `PlatformAdmin`, `TenantUser` | Segurança adicional para admins |
| **Password Reset** | Schema tem `PasswordResetToken` mas sem endpoints ou UI | App inteiro | Recuperação de senha essencial |
| **Testes de conteúdo** | Só 33 testes e2e de auth/security; sem testes para categorias, variantes, grupos, banners, orders | `app/test/e2e/` | Cobertura insuficiente |
| **Reordenação Drag & Drop** | APIs de reorder existem, mas UI usa input numérico | Categorias, Banners | UX mais intuitiva |

### 4.2 🟢 Baixa Prioridade — Melhorias Incrementais

| Item | O quê | Onde |
|------|-------|------|
| **Skeleton loading** | Telas admin sem skeleton durante carregamento | Admin pages |
| **Toast/sonner notifications** | Feedback visual após ações (criar, editar, excluir) | App inteiro |
| **Confirmação em lote** | Excluir múltiplas imagens na galeria | Galeria |
| **Ordenação de produtos** | Arrastar para reordenar produtos dentro da categoria | Cardápio admin |
| **Preview do cardápio** | Botão "Visualizar" que abre o cardápio público em nova aba | Admin loja |
| **Imagem otimizada** | Gerar thumbnails no upload para não servir imagem full em grid | Upload |
| **Cache de cardápio público** | Cache de resposta ou SW cache para página pública carregar instantânea | Público |
| **PWA mais completo** | Service worker com cache de assets e estratégia offline | web/src/main.tsx |
| **Tema escuro por loja** | Loja poder definir cores separadas para modo escuro | Aparência |

### 4.3 🔴 Alta Prioridade — Novas Features (Próximos Passos)

| Feature | Descrição | Impacto | Complexidade |
|---------|-----------|---------|-------------|
| **Dashboard com gráficos** | Gráficos de vendas, produtos mais vendidos, horários de pico | Alto (gestão) | Média |
| **Notificações push** | Notificar loja de novo pedido (Web Push API ou SSE) | Alto (tempo real) | Média |
| **Integração de pagamento** | Pix, cartão (Stripe/PagSeguro/Mercado Pago) | Alto (conversão) | Alta |
| **Agendamento de entregas** | Cliente escolher horário de entrega/retirada | Alto (logística) | Média |
| **Área de entrega** | Configurar bairros/CEPs atendidos, taxa de entrega | Alto (delivery) | Média |
| **Múltiplos usuários por loja** | Já tem `TenantUserRole.OWNER/STAFF` mas sem UI de gestão de staff | Médio | Baixa |
| **Histórico de auditoria** | Registrar e visualizar alterações em produtos/configurações | Médio (controle) | Média |
| **Impressão automática** | Enviar pedido para impressora térmica (WebSocket/SSE) | Médio (fluxo) | Alta |
| **Cupons/descontos** | Códigos promocionais, descontos por produto ou pedido | Médio (vendas) | Alta |
| **Copy do cardápio** | Copiar produtos/categorias de uma loja para outra | Médio (onboarding) | Média |
| **Importação em massa** | CSV/Excel para importar produtos em lote | Médio (onboarding) | Média |
| **Relatórios exportáveis** | Exportar pedidos para CSV/PDF por período | Médio (gestão) | Média |
| **Catálogo público sem login** | Permitir navegação completa sem login (já funciona) + compartilhar link | — | — |
| **Compartilhar cardápio** | Botão de compartilhar com link + preview social (OG tags) | Baixo (marketing) | Baixa |
| **SEO para loja** | Meta tags dinâmicas, SSG/SSR para página pública | Baixo (alcance) | Alta |

### 4.4 🛠 Melhorias Técnicas (Arquitetura)

| Item | Descrição | Prioridade |
|------|-----------|-----------|
| **S3/CDN para uploads** | Upload local funciona mas não escala horizontalmente | Média |
| **Validação Zod** | Mix de class-validator e validação manual — padronizar | Baixa |
| **Monorepo** | app/ e web/ separados — turborepo ou nx ajudaria | Baixa |
| **Geração automática de SDK** | OpenAPI + orval/knockout para tipos sincronizados | Média |
| **Logs centralizados** | Pino já integrado, mas sem dashboard de logs | Baixa |
| **Health check endpoint** | Já existe `health/` — expandir com checks de dependências | Baixa |
| **Variáveis de ambiente** | `.env.example` ok, mas poderia ter validação no bootstrap | Baixa |
| **CI/CD Pipeline** | Sem pipeline de CI/CD configurado | Média |
| **Docker Compose** | Sem docker-compose para desenvolvimento | Média |
| **E2E com Playwright** | Testes e2e só no backend — frontend sem testes | Alta |

---

## 5. Resumo do State Atual

```
Funcionalidades Implementadas:  ~95%
Test Coverage (backend):        33 testes e2e (auth/security)
Test Coverage (frontend):       0
Documentação:                   README desatualizado, FRONTEND-ADAPTACAO desatualizado
Specs em docs/superpowers:      100% implementados
Features previstas:             TOTP, Password Reset, Dashboard, Notificações, Pagamento
```

### Recomendações Imediatas

1. **Atualizar README.md** — remover checkboxes falsas, refletir estado real
2. **Adicionar testes** — categorias, variantes, grupos, banners, orders (já specados)
3. **TOTP/2FA** — implementar ativação e verificação (dados já no schema)
4. **Password Reset** — implementar fluxo completo (model já existe)
5. **Dashboard com métricas** — gráficos de pedidos, faturamento, produtos populares

---

## 6. Roadmap Sugerido

### Fase 1 — Robustez (Agora)
- [ ] Atualizar README
- [ ] Testes e2e para conteúdo (cat, var, grupos, banners, orders)
- [ ] Password Reset
- [ ] Validação de ambiente no bootstrap

### Fase 2 — Gestão (Próximo)
- [ ] Dashboard com gráficos (Chart.js/Recharts)
- [ ] Múltiplos usuários por loja (gestão de staff)
- [ ] Histórico de auditoria visível
- [ ] Relatórios exportáveis

### Fase 3 — Vendas (Próximo+)
- [ ] Integração de pagamento (Pix prioritário)
- [ ] Área de entrega + taxa
- [ ] Cupons/descontos
- [ ] Agendamento de entregas

### Fase 4 — Escala (Futuro)
- [ ] Docker Compose + CI/CD
- [ ] S3/CDN para uploads
- [ ] E2E frontend (Playwright)
- [ ] SEO/SSR para páginas públicas
- [ ] Notificações push
