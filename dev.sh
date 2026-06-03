#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Cores
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

info()  { echo -e "${CYAN}[saas]${NC} $1"; }
ok()    { echo -e "${GREEN}[ok]${NC} $1"; }
warn()  { echo -e "${YELLOW}[aviso]${NC} $1"; }
err()   { echo -e "${RED}[erro]${NC} $1"; }

# Verifica pré-requisitos
check_deps() {
  command -v node >/dev/null 2>&1 || { err "Node.js não encontrado. Instale Node.js 22+"; exit 1; }
  command -v npx  >/dev/null 2>&1 || { err "npx não encontrado"; exit 1; }

  NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VERSION" -lt 22 ]; then
    err "Node.js 22+ necessário (versão atual: $(node -v))"
    exit 1
  fi
  ok "Node.js $(node -v)"
}

# Verifica .env
check_env() {
  if [ ! -f "$ROOT_DIR/app/.env" ]; then
    warn ".env não encontrado. Copiando de .env.example..."
    cp "$ROOT_DIR/app/.env.example" "$ROOT_DIR/app/.env"
    ok ".env criado"
  fi

  # Verifica se consegue conectar no banco
  if command -v psql >/dev/null 2>&1; then
    local DB_URL=$(grep "^DATABASE_URL=" "$ROOT_DIR/app/.env" | cut -d= -f2-)
    if [ -n "$DB_URL" ]; then
      if psql "$DB_URL" -c "SELECT 1" >/dev/null 2>&1; then
        ok "Banco de dados acessível"
      else
        warn "Banco de dados não acessível. Execute: sudo -u postgres createdb saas_cardapio"
      fi
    fi
  fi
}

# Instala dependências se necessário
install_deps() {
  if [ ! -d "$ROOT_DIR/app/node_modules" ] || [ ! -d "$ROOT_DIR/web/node_modules" ]; then
    info "Instalando dependências..."
    (cd "$ROOT_DIR/app" && npm install --no-fund --no-audit --loglevel=warn)
    (cd "$ROOT_DIR/web" && npm install --no-fund --no-audit --loglevel=warn)
    ok "Dependências instaladas"
  fi
}

# Sincroniza schema do banco se necessário
sync_db() {
  info "Verificando schema do banco..."
  (cd "$ROOT_DIR/app" && npx prisma db push --skip-generate --accept-data-loss 2>/dev/null && npx prisma generate >/dev/null 2>&1) || {
    warn "Erro ao sincronizar banco. Execute: cd app && npx prisma db push"
  }
  ok "Schema sincronizado"
}

# Roda seed se banco estiver vazio
run_seed() {
  local ADMIN_COUNT=$(cd "$ROOT_DIR/app" && npx prisma db execute --stdin <<<"SELECT COUNT(*) FROM platform_admins;" 2>/dev/null || echo "0")
  if [ "$ADMIN_COUNT" = "0" ] || [ -z "$ADMIN_COUNT" ]; then
    info "Populando banco com dados iniciais..."
    (cd "$ROOT_DIR/app" && npx tsx prisma/seed.ts) && ok "Seed executado" || warn "Seed falhou (pode executar manualmente: cd app && npx tsx prisma/seed.ts)"
  else
    ok "Banco já possui dados"
  fi
}

# Inicia servidores
start_dev() {
  info "Iniciando servidores de desenvolvimento..."
  echo ""
  echo -e "  ${CYAN}API${NC}    → http://localhost:3001"
  echo -e "  ${MAGENTA}Web${NC}    → http://localhost:5173"
  echo -e "  ${YELLOW}Admin${NC}   → http://localhost:5173/admin"
  echo -e "  ${YELLOW}Cardápio${NC}→ http://localhost:5173/loja/acai"
  echo ""
  echo -e "  Pressione ${RED}Ctrl+C${NC} para parar ambos"
  echo ""

  cd "$ROOT_DIR"
  npx concurrently \
    -n api,web \
    -c cyan,magenta \
    "cd app && npx nest start --watch" \
    "cd web && npx vite"
}

# --- Main ---
echo ""
echo -e "${CYAN}╔══════════════════════════════════╗${NC}"
echo -e "${CYAN}║       SaaS Cardápio Dev          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════╝${NC}"
echo ""

check_deps
check_env
install_deps
sync_db
run_seed
start_dev
