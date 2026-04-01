#!/bin/bash
# =============================================================================
# deploy.sh — Samba Escola Cabral | Script de Deploy
# Uso: bash deploy.sh
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# Cores e estilos
# -----------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;37m'
BOLD='\033[1m'
NC='\033[0m'

# Hash SHA-256 da senha de deploy — definir DEPLOY_HASH_ENV no ambiente do servidor
DEPLOY_HASH="${DEPLOY_HASH_ENV:?Variável DEPLOY_HASH_ENV não definida. Defina-a no ambiente antes de rodar o deploy.}"

# -----------------------------------------------------------------------------
# Utilitários visuais
# -----------------------------------------------------------------------------

clear_screen() { clear; }

print_header() {
    echo -e "${CYAN}${BOLD}"
    echo "  ╔══════════════════════════════════════════════════════════╗"
    echo "  ║         SAMBA — EE Prof. Christino Cabral               ║"
    echo "  ║              Script de Deploy — v1.0                    ║"
    echo "  ╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_section() {
    echo -e "\n${BLUE}${BOLD}  ── $1 ──${NC}"
}

print_ok() {
    echo -e "  ${GREEN}✔${NC}  $1"
}

print_warn() {
    echo -e "  ${YELLOW}⚠${NC}   $1"
}

print_error() {
    echo -e "  ${RED}✘${NC}  $1"
}

print_info() {
    echo -e "  ${GRAY}→${NC}  $1"
}

print_step() {
    echo -e "\n  ${CYAN}[${1}/${2}]${NC} ${BOLD}${3}${NC}"
}

divider() {
    echo -e "  ${GRAY}──────────────────────────────────────────────────────────${NC}"
}

# Pergunta sim/não — retorna 0 para sim, 1 para não
confirm() {
    local msg="$1"
    local default="${2:-n}"
    local prompt
    if [ "$default" = "s" ]; then
        prompt="[S/n]"
    else
        prompt="[s/N]"
    fi
    while true; do
        echo -en "  ${WHITE}?${NC}  ${msg} ${GRAY}${prompt}${NC} "
        read -r answer
        answer="${answer:-$default}"
        case "${answer,,}" in
            s|sim|y|yes) return 0 ;;
            n|nao|não|no) return 1 ;;
            *) echo -e "  ${RED}Responda s ou n.${NC}" ;;
        esac
    done
}

# -----------------------------------------------------------------------------
# Verificação de senha
# -----------------------------------------------------------------------------

verify_password() {
    print_section "Autenticação"
    echo -e "  ${GRAY}Acesso restrito à equipe de desenvolvimento.${NC}\n"

    local attempts=0
    while [ $attempts -lt 3 ]; do
        echo -en "  ${WHITE}Senha de deploy:${NC} "
        read -rs input_password
        echo ""

        local input_hash
        input_hash=$(echo -n "$input_password" | sha256sum | cut -d' ' -f1)

        if [ "$input_hash" = "$DEPLOY_HASH" ]; then
            print_ok "Autenticado com sucesso."
            return 0
        else
            attempts=$((attempts + 1))
            print_error "Senha incorreta. Tentativa ${attempts}/3."
        fi
    done

    echo -e "\n  ${RED}${BOLD}Acesso negado. Encerrando.${NC}\n"
    exit 1
}

# -----------------------------------------------------------------------------
# Verificações de ambiente
# -----------------------------------------------------------------------------

check_environment() {
    print_section "Verificando ambiente"

    # Docker
    if ! command -v docker &>/dev/null; then
        print_error "Docker não encontrado. Instale o Docker antes de continuar."
        exit 1
    fi
    print_ok "Docker: $(docker --version | cut -d' ' -f3 | tr -d ',')"

    # Docker Compose
    if ! docker compose version &>/dev/null; then
        print_error "Docker Compose não encontrado."
        exit 1
    fi
    print_ok "Docker Compose: $(docker compose version --short 2>/dev/null || echo 'ok')"

    # Git
    if ! command -v git &>/dev/null; then
        print_error "Git não encontrado."
        exit 1
    fi
    print_ok "Git: $(git --version | cut -d' ' -f3)"

    # .env
    if [ ! -f .env ]; then
        print_warn ".env não encontrado."
        if confirm "Criar .env a partir do .env.example?"; then
            cp .env.example .env
            print_ok ".env criado. Verifique os valores antes de continuar."
            echo -e "\n  ${YELLOW}Edite o .env e execute o script novamente.${NC}\n"
            exit 0
        else
            print_error ".env é obrigatório. Encerrando."
            exit 1
        fi
    fi
    print_ok ".env presente."
}

# -----------------------------------------------------------------------------
# Menu de opções
# -----------------------------------------------------------------------------

select_actions() {
    print_section "Selecione as ações"
    echo -e "  ${GRAY}Escolha o que será executado neste deploy:${NC}\n"

    DO_GIT_PULL=false
    DO_SUBMODULES=false
    DO_WIPE_DB=false
    DO_MIGRATE_PAPER=false
    DO_BUILD=false
    DO_RESTART_ONLY=false

    if confirm "Atualizar código do repositório (git pull)?"; then
        DO_GIT_PULL=true
    fi

    if confirm "Atualizar submódulos (samba-db, samba-access, etc.)?"; then
        DO_SUBMODULES=true
    fi

    echo ""
    print_warn "A próxima opção APAGA todos os dados do banco."
    if confirm "Recriar banco do zero (docker compose down -v)?"; then
        DO_WIPE_DB=true
    fi

    if confirm "Executar migração do samba-paper (novas tabelas curriculares)?"; then
        DO_MIGRATE_PAPER=true
    fi

    if confirm "Fazer build das imagens Docker (--build)?"; then
        DO_BUILD=true
    fi

    if [ "$DO_WIPE_DB" = false ] && [ "$DO_BUILD" = false ]; then
        if confirm "Apenas reiniciar os serviços?"; then
            DO_RESTART_ONLY=true
        fi
    fi
}

# -----------------------------------------------------------------------------
# Resumo antes de executar
# -----------------------------------------------------------------------------

print_summary() {
    print_section "Resumo das ações"

    [ "$DO_GIT_PULL" = true ]       && print_info "git pull origin main" \
                                    || echo -e "  ${GRAY}  ○  git pull${NC}  ${GRAY}(pulado)${NC}"
    [ "$DO_SUBMODULES" = true ]    && print_info "git submodule update --init --recursive" \
                                    || echo -e "  ${GRAY}  ○  submodules${NC}  ${GRAY}(pulado)${NC}"
    [ "$DO_WIPE_DB" = true ]       && print_info "${RED}docker compose down -v  ← APAGA O BANCO${NC}" \
                                    || echo -e "  ${GRAY}  ○  down -v${NC}  ${GRAY}(banco mantido)${NC}"
    [ "$DO_MIGRATE_PAPER" = true ] && print_info "migrate_paper_v2.sql + seed_paper_aulas.sql" \
                                    || echo -e "  ${GRAY}  ○  migração paper${NC}  ${GRAY}(pulada)${NC}"
    [ "$DO_BUILD" = true ]         && print_info "docker compose up -d --build" \
                                    || true
    [ "$DO_RESTART_ONLY" = true ]  && print_info "docker compose restart" \
                                    || true

    echo ""
    divider
    if ! confirm "Confirmar e executar?"; then
        echo -e "\n  ${YELLOW}Deploy cancelado.${NC}\n"
        exit 0
    fi
}

# -----------------------------------------------------------------------------
# Execução
# -----------------------------------------------------------------------------

run_deploy() {
    local total=0
    local step=0

    [ "$DO_GIT_PULL" = true ]       && total=$((total+1))
    [ "$DO_SUBMODULES" = true ]     && total=$((total+1))
    [ "$DO_WIPE_DB" = true ]        && total=$((total+1))
    [ "$DO_MIGRATE_PAPER" = true ]  && total=$((total+1))
    total=$((total+1)) # sempre sobe os containers

    print_section "Executando"

    # Git pull
    if [ "$DO_GIT_PULL" = true ]; then
        step=$((step+1))
        print_step $step $total "git pull origin main"
        if git pull origin main; then
            print_ok "Código atualizado."
        else
            print_error "Falha no git pull. Verifique conflitos."
            exit 1
        fi
    fi

    # Submódulos
    if [ "$DO_SUBMODULES" = true ]; then
        step=$((step+1))
        print_step $step $total "Atualizando submódulos"
        git submodule update --init --recursive
        print_ok "Submódulos atualizados."
    fi

    # Down -v
    if [ "$DO_WIPE_DB" = true ]; then
        step=$((step+1))
        print_step $step $total "Removendo containers e volumes"
        docker compose down -v
        print_ok "Containers e volumes removidos."
    fi

    # Migração samba-paper
    if [ "$DO_MIGRATE_PAPER" = true ]; then
        step=$((step+1))
        print_step $step $total "Executando migração samba-paper"
        # Garante que o banco está rodando
        if ! docker ps --format '{{.Names}}' | grep -q '^samba_db$'; then
            print_info "Subindo banco de dados..."
            docker compose up -d db
            sleep 5
        fi
        if wait_for_db; then
            print_info "Criando tabelas curriculares..."
            docker exec -i samba_db psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-samba_db}" \
                < samba-db/migrate_paper_v2.sql
            print_ok "Tabelas criadas."
            print_info "Populando currículo (1184 aulas)..."
            docker exec -i samba_db psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-samba_db}" \
                < samba-db/seed_paper_aulas.sql
            print_ok "Currículo carregado."
        else
            print_error "Banco não respondeu — migração pulada."
        fi
    fi

    # Up
    step=$((step+1))
    if [ "$DO_RESTART_ONLY" = true ]; then
        print_step $step $total "Reiniciando serviços"
        docker compose restart
    elif [ "$DO_BUILD" = true ]; then
        print_step $step $total "Build e inicialização dos serviços"
        docker compose up -d --build
    else
        print_step $step $total "Iniciando serviços"
        docker compose up -d
    fi
    print_ok "Serviços iniciados."
}

# -----------------------------------------------------------------------------
# Status final
# -----------------------------------------------------------------------------

print_status() {
    print_section "Status dos serviços"
    echo ""
    docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null \
        || docker compose ps
    echo ""
}

# -----------------------------------------------------------------------------
# Health checks
# -----------------------------------------------------------------------------

# Variáveis de resultado
HC_TOTAL=0
HC_PASS=0
HC_FAIL=0
HC_WARN=0

hc_ok()   { echo -e "  ${GREEN}✔${NC}  ${1}"; HC_PASS=$((HC_PASS+1)); HC_TOTAL=$((HC_TOTAL+1)); }
hc_fail() { echo -e "  ${RED}✘${NC}  ${1}"; HC_FAIL=$((HC_FAIL+1)); HC_TOTAL=$((HC_TOTAL+1)); }
hc_warn() { echo -e "  ${YELLOW}⚠${NC}   ${1}"; HC_WARN=$((HC_WARN+1)); HC_TOTAL=$((HC_TOTAL+1)); }
hc_title(){ echo -e "\n  ${GRAY}${BOLD}${1}${NC}"; }

# Executa query no banco via docker exec
db_query() {
    docker exec samba_db psql \
        -U "${POSTGRES_USER:-postgres}" \
        -d "${POSTGRES_DB:-samba_db}" \
        -t -A -c "$1" 2>/dev/null | tr -d ' '
}

# Verifica se container está rodando
container_running() {
    local state
    state=$(docker inspect --format='{{.State.Status}}' "$1" 2>/dev/null || echo "missing")
    [ "$state" = "running" ]
}

# Verifica HTTP — retorna o status code
http_status() {
    curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:${1}" 2>/dev/null || echo "000"
}

# Aguarda o banco ficar pronto (max 30s)
wait_for_db() {
    local retries=0
    while [ $retries -lt 30 ]; do
        if docker exec samba_db pg_isready -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-samba_db}" &>/dev/null; then
            return 0
        fi
        sleep 1
        retries=$((retries+1))
    done
    return 1
}

run_health_checks() {
    # Reinicia contadores (evita acumulação em chamadas repetidas)
    HC_TOTAL=0; HC_PASS=0; HC_FAIL=0; HC_WARN=0

    # Carrega variáveis do .env para usar POSTGRES_USER etc.
    set -a
    # shellcheck source=.env
    [ -f .env ] && source .env
    set +a

    print_section "Health Checks"

    # ── 1. Containers ─────────────────────────────────────────────────────────
    hc_title "1. Containers"

    local services=("samba_db" "samba_code_app" "samba_access_app" "samba_edvance_app" "samba_admin_app" "samba_flourish_app" "samba_innovations_app" "samba_paper_app")
    for svc in "${services[@]}"; do
        if container_running "$svc"; then
            hc_ok "Container ${svc} está rodando"
        else
            hc_fail "Container ${svc} não está rodando"
        fi
    done

    # Verifica containers em loop de restart
    local restarting
    restarting=$(docker ps --filter "status=restarting" --format "{{.Names}}" 2>/dev/null)
    if [ -z "$restarting" ]; then
        hc_ok "Nenhum container em loop de restart"
    else
        hc_fail "Containers em restart loop: ${restarting}"
    fi

    # ── 2. Banco de dados ─────────────────────────────────────────────────────
    hc_title "2. Banco de dados"

    if ! wait_for_db; then
        hc_fail "PostgreSQL não está respondendo após 30s"
    else
        hc_ok "PostgreSQL aceitando conexões"

        # Extensões
        for ext in pgcrypto "uuid-ossp"; do
            local ext_ok
            ext_ok=$(db_query "SELECT COUNT(*) FROM pg_extension WHERE extname='${ext}';")
            if [ "$ext_ok" = "1" ]; then
                hc_ok "Extensão ${ext} instalada"
            else
                hc_fail "Extensão ${ext} não encontrada"
            fi
        done

        # Schemas
        for schema in samba_school samba_edvance samba_code samba_paper; do
            local schema_ok
            schema_ok=$(db_query "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name='${schema}';")
            if [ "$schema_ok" = "1" ]; then
                hc_ok "Schema ${schema} existe"
            else
                hc_fail "Schema ${schema} não encontrado"
            fi
        done

        # Seed — integridade dos dados
        hc_title "3. Integridade do seed"

        # Usuários
        local user_count
        user_count=$(db_query "SELECT COUNT(*) FROM samba_school.users;")
        if [ "$user_count" -ge 44 ] 2>/dev/null; then
            hc_ok "Usuários: ${user_count} (esperado ≥ 44)"
        else
            hc_fail "Usuários: ${user_count} (esperado ≥ 44) — seed incompleto?"
        fi

        # ROOT existe
        local root_exists
        root_exists=$(db_query "SELECT COUNT(*) FROM samba_school.users WHERE email='root@escolacabral.com.br';")
        if [ "$root_exists" = "1" ]; then
            hc_ok "Usuário ROOT presente"
        else
            hc_fail "Usuário ROOT não encontrado"
        fi

        # Turmas
        local class_count
        class_count=$(db_query "SELECT COUNT(*) FROM samba_school.school_classes;")
        if [ "$class_count" -ge 22 ] 2>/dev/null; then
            hc_ok "Turmas: ${class_count} (esperado ≥ 22)"
        else
            hc_fail "Turmas: ${class_count} (esperado ≥ 22)"
        fi

        # Disciplinas
        local disc_count
        disc_count=$(db_query "SELECT COUNT(*) FROM samba_school.disciplines;")
        if [ "$disc_count" -ge 35 ] 2>/dev/null; then
            hc_ok "Disciplinas: ${disc_count} (esperado ≥ 35)"
        else
            hc_fail "Disciplinas: ${disc_count} (esperado ≥ 35)"
        fi

        # Roles
        local roles_count
        roles_count=$(db_query "SELECT COUNT(*) FROM samba_school.roles;")
        if [ "$roles_count" -ge 6 ] 2>/dev/null; then
            hc_ok "Roles: ${roles_count} (esperado ≥ 6)"
        else
            hc_fail "Roles: ${roles_count} (esperado ≥ 6)"
        fi

        # Habilidades BNCC
        local skills_count
        skills_count=$(db_query "SELECT COUNT(*) FROM samba_edvance.skills;" 2>/dev/null || echo "0")
        if [ "$skills_count" -gt 100 ] 2>/dev/null; then
            hc_ok "Habilidades BNCC: ${skills_count}"
        else
            hc_warn "Habilidades BNCC: ${skills_count} — verifique o 08_skills_seed.sql"
        fi

        # Vínculos turma ↔ disciplina
        local cd_count
        cd_count=$(db_query "SELECT COUNT(*) FROM samba_school.class_disciplines;")
        if [ "$cd_count" -gt 0 ] 2>/dev/null; then
            hc_ok "Vínculos turma↔disciplina: ${cd_count}"
        else
            hc_fail "Nenhum vínculo turma↔disciplina encontrado"
        fi

        # Currículo paper (aulas)
        local aulas_count
        aulas_count=$(db_query "SELECT COUNT(*) FROM samba_paper.aulas;" 2>/dev/null || echo "0")
        if [ "$aulas_count" -gt 1000 ] 2>/dev/null; then
            hc_ok "Aulas curriculares: ${aulas_count} (currículo 2026 carregado)"
        elif [ "$aulas_count" -gt 0 ] 2>/dev/null; then
            hc_warn "Aulas curriculares: ${aulas_count} — esperado ≥ 1184"
        else
            hc_warn "Tabela samba_paper.aulas vazia — rode a migração paper no deploy"
        fi
    fi

    # ── 4. HTTP endpoints ─────────────────────────────────────────────────────
    hc_title "4. HTTP — Aplicações"

    declare -A APPS=(
        [3000]="innovations"
        [3001]="code"
        [3002]="access"
        [3003]="edvance"
        [3004]="flourish"
        [3005]="admin"
        [3006]="paper"
    )

    for port in "${!APPS[@]}"; do
        local name="${APPS[$port]}"
        local code
        code=$(http_status "$port")
        if [[ "$code" =~ ^(200|301|302|303|307|308)$ ]]; then
            hc_ok "${name} (porta ${port}) respondendo — HTTP ${code}"
        elif [ "$code" = "404" ] && [ "$port" = "3005" ]; then
            hc_ok "${name} (porta ${port}) respondendo — HTTP 404 (sem rota na raiz, normal)"
        elif [ "$code" = "000" ]; then
            hc_fail "${name} (porta ${port}) sem resposta — container pode estar iniciando"
        else
            hc_warn "${name} (porta ${port}) retornou HTTP ${code}"
        fi
    done

    # ── Resultado final ───────────────────────────────────────────────────────
    echo ""
    divider
    echo -e "\n  Resultado: ${GREEN}${HC_PASS} ok${NC}  ${YELLOW}${HC_WARN} aviso(s)${NC}  ${RED}${HC_FAIL} falha(s)${NC}  de ${HC_TOTAL} verificações\n"

    if [ "$HC_FAIL" -gt 0 ]; then
        echo -e "  ${RED}${BOLD}Sistema com falhas — revise os itens acima.${NC}\n"
    elif [ "$HC_WARN" -gt 0 ]; then
        echo -e "  ${YELLOW}${BOLD}Sistema operacional com avisos.${NC}\n"
    else
        echo -e "  ${GREEN}${BOLD}Sistema saudável. Tudo ok!${NC}\n"
    fi

    echo -e "  ${GRAY}Para acompanhar os logs:${NC}"
    echo -e "  ${CYAN}  docker compose logs -f --tail=50${NC}\n"
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

clear_screen
print_header

# Modo --health standalone (sem deploy)
if [[ "${1:-}" == "--health" ]]; then
    verify_password
    run_health_checks
    exit 0
fi

verify_password
check_environment
select_actions
print_summary
run_deploy
print_status

echo ""
if confirm "Executar health checks agora?" "s"; then
    run_health_checks
else
    divider
    echo -e "\n  ${GREEN}${BOLD}Deploy concluído.${NC}\n"
    echo -e "  ${GRAY}Para rodar os checks depois:${NC}  ${CYAN}bash deploy.sh --health${NC}\n"
fi
