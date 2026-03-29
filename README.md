<div align="center">

<img src="https://raw.githubusercontent.com/samba-innovations/samba-innovations/main/public/imgs/innvtns-logotipo2.svg" height="48" alt="samba innovations" />

# samba.escolacabral

**Plataforma integrada de gestão escolar — orquestração completa via Docker**

[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/Licença-Privada-red?style=flat-square)](./LICENSE)

*Sobe todo o ecossistema samba com um único comando.*

</div>

---

## Visão Geral

O **samba.escolacabral** é o repositório de orquestração do ecossistema **samba innovations** — um conjunto de aplicações web interconectadas via SSO, projetadas para digitalizar e padronizar processos em redes escolares públicas.

Um único `docker compose up -d --build` inicializa todos os serviços, banco de dados e rede interna.

---

## Arquitetura

```
                        ┌─────────────────────────────────────────────┐
                        │               nginx (reverse proxy)          │
                        │  SSL/TLS via Let's Encrypt + Cloudflare DNS  │
                        └──────────┬──────────────────────────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
    ┌─────▼──────┐          ┌──────▼─────┐          ┌──────▼─────┐
    │  samba     │          │  samba     │          │  samba     │
    │innovations │          │  access    │          │  edvance   │
    │  :3000     │          │  :3002     │          │  :3003     │
    └────────────┘          └──────┬─────┘          └──────┬─────┘
                                   │  SSO (JWT)            │
          ┌────────────────────────┼────────────────────────┤
          │                        │                        │
    ┌─────▼──────┐          ┌──────▼─────┐          ┌──────▼─────┐
    │  samba     │          │  samba     │          │  samba     │
    │   code     │          │  flourish  │          │   admin    │
    │  :3001     │          │  :3004     │          │  :3005     │
    └──────┬─────┘          └──────┬─────┘          └──────┬─────┘
           │                       │                        │
           └───────────────────────┼────────────────────────┘
                                   │
                          ┌────────▼────────┐
                          │    samba-db     │
                          │  PostgreSQL 15  │
                          │  schemas:       │
                          │  · samba_school │
                          │  · samba_edvance│
                          │  · samba_code   │
                          └─────────────────┘
```

---

## Serviços

| Serviço | URL | Porta | Descrição |
|---------|-----|-------|-----------|
| **samba innovations** | `samba.escolacabral.com.br` | 3000 | Landing page institucional |
| **samba code** | `code.escolacabral.com.br` | 3001 | Gestão de ocorrências escolares |
| **samba access** | `acesso.escolacabral.com.br` | 3002 | SSO — portal de autenticação unificada |
| **samba edvance** | `edvance.escolacabral.com.br` | 3003 | Criação e gestão de simulados |
| **samba flourish** | `flourish.escolacabral.com.br` | 3004 | Monitoramento de hortas IoT |
| **samba admin** | `admin.escolacabral.com.br` | 3005 | Painel administrativo |
| **samba db** | interno | 5432 | PostgreSQL compartilhado |

---

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) 24+
- [Docker Compose](https://docs.docker.com/compose/install/) V2
- Git 2.20+

```bash
docker --version   # Docker version 24+
docker compose version  # Docker Compose version v2+
```

---

## Início Rápido

### 1. Clone com submodules

```bash
git clone --recurse-submodules https://github.com/vinicius-SambaCode/samba.escolacabral.git
cd samba.escolacabral
```

> Se já clonou sem `--recurse-submodules`:
> ```bash
> git submodule update --init --recursive
> ```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
nano .env   # edite os valores
```

### 3. Suba tudo

```bash
# Opção A — script de deploy interativo (recomendado)
bash deploy.sh

# Opção B — manual
docker compose up -d --build
```

### 4. Verifique

```bash
docker compose ps

# Ou use o health check integrado
bash deploy.sh --health
```

---

## Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha:

```env
# ── PostgreSQL ────────────────────────────────────────────────
POSTGRES_USER=postgres
POSTGRES_PASSWORD=          # senha forte
POSTGRES_DB=samba_db

# ── Senhas dos usuários de app ────────────────────────────────
EDVANCE_DB_PASSWORD=        # senha do samba_edvance_user
CODE_DB_PASSWORD=           # senha do samba_code_user

# ── Segredo compartilhado (JWT / cookies) ─────────────────────
# Gere com: openssl rand -base64 32
JWT_SECRET=

# ── URLs públicas ─────────────────────────────────────────────
URL_ACCESS=https://acesso.escolacabral.com.br
URL_EDVANCE=https://edvance.escolacabral.com.br
URL_CODE=https://code.escolacabral.com.br
URL_FLOURISH=https://flourish.escolacabral.com.br
URL_ADMIN=https://admin.escolacabral.com.br

# ── Cookie ────────────────────────────────────────────────────
COOKIE_DOMAIN=.escolacabral.com.br
```

> ⚠️ **Nunca commite o arquivo `.env`** — ele está no `.gitignore`.

---

## Estrutura do Repositório

```
samba.escolacabral/
├── docker-compose.yml          ← orquestração completa
├── .env.example                ← template de variáveis
├── deploy.sh                   ← script de deploy interativo
├── setup.sh                    ← script de instalação inicial
├── .gitmodules                 ← referências dos submodules
│
├── dockerfiles/                ← Dockerfiles centralizados
│   ├── Dockerfile.innovations
│   ├── Dockerfile.flourish
│   └── Dockerfile.admin
│
├── samba-db/                   ← submodule: banco de dados
├── samba-access/               ← submodule: SSO
├── samba-edvance/              ← submodule: simulados
├── samba-code/                 ← submodule: ocorrências
├── samba-flourish/             ← submodule: hortas IoT
├── samba-admin/                ← submodule: painel admin
└── samba-innovations/          ← submodule: landing page
```

---

## Banco de Dados

O `samba-db` inicializa automaticamente na primeira execução com:

| Script | Conteúdo |
|--------|----------|
| `01_extensions.sql` | uuid-ossp, pgcrypto |
| `02_samba_school.sql` | Schema de usuários, turmas, alunos |
| `03_samba_code.sql` | Schema de ocorrências |
| `04_samba_edvance.sql` | Schema de simulados e questões |
| `05_permissions.sql` | Usuários e permissões por app |
| `06_seed.sql` | Dados iniciais |
| `07_sso_tokens.sql` | Tabela de tokens SSO |
| `08_skills_seed.sql` | Habilidades da BNCC |

### Usuários do banco

| Usuário | Acesso | Usado por |
|---------|--------|-----------|
| `postgres` | total | samba-admin |
| `samba_edvance_user` | samba_school (leitura) + samba_edvance (total) | samba-edvance, samba-access |
| `samba_code_user` | samba_school (leitura) + samba_code (total) | samba-code |

### Seed inicial

O sistema é pré-populado com os dados reais da **EE Prof. Christino Cabral** (PEI 2026):

| Dado | Quantidade |
|------|-----------|
| Usuários | 44 (1 ROOT, 1 diretor, 1 vice, 5 coordenadores, 35 professores, 2 admins) |
| Turmas | 22 (1ª–3ª série EM + 6º–9º ano EF) |
| Disciplinas | 35 (matrizes completas PEI 2026) |
| Habilidades BNCC | ~1.000+ (Ensino Fundamental e Médio) |

> As senhas do seed são armazenadas como **hashes bcrypt** (cost=12). Nenhum plaintext consta no repositório.

**Fluxo de primeiro acesso:**
- ROOT → acesso permanente, senha não expira
- Demais usuários → obrigados a trocar a senha no primeiro login (`must_change_password = true`)

---

## Fluxo de Autenticação (SSO)

```
Usuário → samba access → gera token UUID → redireciona para app
App → POST /api/sso { token } → samba access valida → retorna { user }
App → cria JWT próprio → set cookie → redireciona para dashboard
```

Todos os apps compartilham o mesmo `JWT_SECRET` e o domínio de cookie `.escolacabral.com.br`.

---

## Comandos Úteis

```bash
# Ver status de todos os containers
docker compose ps

# Logs em tempo real de um serviço
docker compose logs -f edvance

# Reiniciar um serviço específico
docker compose restart access

# Rebuild de um serviço específico
docker compose up -d --build edvance

# Parar tudo (dados preservados)
docker compose down

# Parar tudo e apagar o banco (CUIDADO)
docker compose down -v

# Atualizar submodules
git submodule update --remote --merge
```

---

## Atualização dos Submodules

Para puxar a versão mais recente de todos os apps:

```bash
git submodule update --remote --merge
git add .
git commit -m "chore: atualiza submodules"
git push
```

---

## Script de Deploy

O `deploy.sh` é um instalador interativo para uso da equipe de desenvolvimento. Requer autenticação por senha antes de executar qualquer ação.

```bash
bash deploy.sh           # deploy completo
bash deploy.sh --health  # apenas health check
```

**Ações disponíveis (cada uma confirmada individualmente):**

| Ação | Descrição |
|------|-----------|
| `git pull` | Atualiza o código do repositório |
| Submodules | Atualiza todos os submódulos |
| `down -v` | Recria o banco do zero ⚠️ apaga dados |
| `--build` | Rebuild das imagens Docker |
| Restart | Reinicia serviços sem rebuild |

**Health checks automáticos após o deploy:**

- Containers: todos os 7 serviços em execução, nenhum em restart loop
- Banco: conexão, extensões, schemas, integridade do seed (contagens esperadas)
- HTTP: cada aplicação respondendo na porta correta (200/3xx)

---

## Deploy em Produção

O ambiente de produção roda em um VPS **Contabo** com:

- **nginx** como reverse proxy com SSL (Let's Encrypt via Certbot)
- **Cloudflare** para DNS e proteção
- **Docker** para containerização de todos os serviços

### Configuração nginx + SSL

Após subir os containers, configure nginx para cada subdomínio:

```nginx
server {
    listen 80;
    server_name edvance.escolacabral.com.br;
    location / {
        proxy_pass http://localhost:3003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Instalar SSL
certbot --nginx -d edvance.escolacabral.com.br --agree-tos
```

---

## Segurança

- Cada app usa um usuário PostgreSQL com **princípio do menor privilégio**
- JWT compartilhado entre apps via variável de ambiente (nunca hardcoded)
- Cookies `httpOnly`, `secure`, com `sameSite: lax`
- Tokens SSO de uso único com expiração
- `.env` sempre fora do controle de versão
- Senhas do seed armazenadas como **hashes bcrypt** (cost=12) — nenhum plaintext no repositório
- Script de deploy protegido por senha (hash SHA-256, sem plaintext)

---

## Repositórios Relacionados

| Repositório | Descrição |
|-------------|-----------|
| [samba-innovations/samba-db](https://github.com/samba-innovations/samba-db) | Banco de dados e migrações |
| [samba-innovations/samba-access](https://github.com/samba-innovations/samba-access) | Portal SSO |
| [samba-innovations/samba-edvance](https://github.com/samba-innovations/samba-edvance) | Plataforma de simulados |
| [samba-innovations/samba-code](https://github.com/samba-innovations/samba-code) | Gestão de ocorrências |
| [samba-innovations/samba-flourish](https://github.com/samba-innovations/samba-flourish) | Monitoramento IoT |
| [samba-innovations/samba-admin](https://github.com/samba-innovations/samba-admin) | Painel administrativo |
| [samba-innovations/samba-innovations](https://github.com/samba-innovations/samba-innovations) | Landing page |

---

<div align="center">

Desenvolvido por **samba innovations**

*Tecnologia que resolve.*

</div>
