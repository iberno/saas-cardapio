# Deploy Automático com GitHub Actions

## Visão Geral

Ao fazer `git push` no branch `main`, o repositório é automaticamente enviado para a VPS.

## Estrutura

```
saas-cardapio/
├── docker-compose.yml         # Orquestração dos containers
├── Dockerfile.api              # Build da API NestJS
├── Dockerfile.web              # Build do frontend Vite + Nginx
├── nginx.conf                  # Config do Nginx (proxy reverso)
├── init.sql                    # Criação dos usuários do banco
├── .github/workflows/deploy.yml  # GitHub Action de deploy
├── app/                        # Código da API
└── web/                        # Código do frontend
```

---

## Passo 1 — Commit e Push dos arquivos Docker

```bash
cd ~/Projetos/saas-cardapio
git add .
git commit -m "chore: add docker-compose, Dockerfiles e GitHub Actions"
git push origin main
```

---

## Passo 2 — Configurar Secrets no GitHub

1. Acesse: `https://github.com/iberno/saas-cardapio/settings/secrets/actions`
2. Clique em **"New repository secret"**
3. Adicione os seguintes secrets:

| Secret | Valor |
|--------|-------|
| `HOST` | `143.95.209.215` |
| `PORT` | `22022` |
| `SSH_KEY` | Sua chave privada (`cat ~/.ssh/id_rsa`) |

> A chave SSH privada deve ser a mesma que tem permissão para acessar a VPS.

---

## Passo 3 — Preparar a VPS

Conecte na VPS e clone o repositório:

```bash
ssh -p 22022 root@143.95.209.215

# Vai para o diretório de sites
cd /root/sitesOn

# Remove a cópia antiga (se existir)
rm -rf ohmeupedido_backup
mv ohmeupedido ohmeupedido_backup 2>/dev/null; true

# Clona o repositório GitHub
git clone git@github.com:iberno/saas-cardapio.git ohmeupedido
```

> Se não tiver chave SSH configurada no GitHub para a VPS, use `git clone https://github.com/iberno/saas-cardapio.git ohmeupedido`.

---

## Passo 4 — Testar o Deploy Manual

```bash
cd /root/sitesOn/ohmeupedido

# Ajusta senhas no docker-compose.yml
nano docker-compose.yml

# Sobe os containers
docker compose up -d

# Verifica logs
docker compose logs -f
```

Para sair dos logs: `Ctrl+C`.

---

## Passo 5 — Fluxo a partir de agora

1. Você desenvolve localmente
2. Testa no seu PC
3. Faz commit e push:

```bash
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
```

4. O GitHub Actions executa automaticamente a action `Deploy`
5. A VPS puxa as alterações, reconstrói e reinicia os containers

Para acompanhar o deploy:

```
https://github.com/iberno/saas-cardapio/actions
```

---

## Resolução de Problemas

**O deploy falhou no GitHub Actions:**

1. Verifique os logs em https://github.com/iberno/saas-cardapio/actions
2. Verifique se os secrets `HOST`, `PORT` e `SSH_KEY` estão corretos
3. Teste manual na VPS:

```bash
cd /root/sitesOn/ohmeupedido
git pull origin main
docker compose up -d --build
```
