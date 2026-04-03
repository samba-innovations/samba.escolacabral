#!/bin/bash
# =============================================================================
# deploy.sh — Samba Escola Cabral | Script de Deploy
# Uso: bash deploy.sh [--health] [--status]
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/.env" ]; then
    set -a; source "${SCRIPT_DIR}/.env"; set +a
fi

# -----------------------------------------------------------------------------
# Cores
# -----------------------------------------------------------------------------
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; WHITE='\033[1;37m'
GRAY='\033[0;37m'; BOLD='\033[1m'; NC='\033[0m'

DEPLOY_HASH="${DEPLOY_HASH_ENV:?Variável DEPLOY_HASH_ENV não definida.}"

# Submódulos gerenciados (nome do diretório)
SUBMODULES=(samba-db samba-access samba-flourish samba-paper)

# -----------------------------------------------------------------------------
# Utilitários visuais
# -----------------------------------------------------------------------------
clear_screen() { clear; }

print_header() {
    echo -e "${CYAN}${BOLD}"
    echo "  ╔══════════════════════════════════════════════════════════╗"
    echo "  ║         SAMBA — EE Prof. Christino Cabral               ║"
    echo "  ║              Script de Deploy — v2.0                    ║"
    echo "  ╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_section() { echo -e "\n${BLUE}${BOLD}  ── $1 ──${NC}"; }
print_ok()      { echo -e "  ${GREEN}✔${NC}  $1"; }
print_warn()    { echo -e "  ${YELLOW}⚠${NC}   $1"; }
print_error()   { echo -e "  ${RED}✘${NC}  $1"; }
print_info()    { echo -e "  ${GRAY}→${NC}  $1"; }
print_step()    { echo -e "\n  ${CYAN}[${1}/${2}]${NC} ${BOLD}${3}${NC}"; }
divider()       { echo -e "  ${GRAY}──────────────────────────────────────────────────────────${NC}"; }

confirm() {
    local msg="$1" default="${2:-n}" prompt
    [ "$default" = "s" ] && prompt="[S/n]" || prompt="[s/N]"
    while true; do
        echo -en "  ${WHITE}?${NC}  ${msg} ${GRAY}${prompt}${NC} "
        read -r answer; answer="${answer:-$default}"
        case "${answer,,}" in
            s|sim|y|yes) return 0 ;;
            n|nao|não|no) return 1 ;;
            *) echo -e "  ${RED}Responda s ou n.${NC}" ;;
        esac
    done
}

# -----------------------------------------------------------------------------
# Autenticação
# -----------------------------------------------------------------------------
verify_password() {
    print_section "Autenticação"
    echo -e "  ${GRAY}Acesso restrito à equipe de desenvolvimento.${NC}\n"
    local attempts=0
    while [ $attempts -lt 3 ]; do
        echo -en "  ${WHITE}Senha de deploy:${NC} "
        read -rs input_password; echo ""
        local input_hash
        input_hash=$(echo -n "$input_password" | sha256sum | cut -d' ' -f1)
        if [ "$input_hash" = "$DEPLOY_HASH" ]; then
            print_ok "Autenticado com sucesso."; return 0
        else
            attempts=$((attempts+1))
            print_error "Senha incorreta. Tentativa ${attempts}/3."
        fi
    done
    echo -e "\n  ${RED}${BOLD}Acesso negado.${NC}\n"; exit 1
}

# -----------------------------------------------------------------------------
# Verificações de ambiente
# -----------------------------------------------------------------------------
check_environment() {
    print_section "Verificando ambiente"

    if ! command -v docker &>/dev/null; then
        print_error "Docker não encontrado."; exit 1
    fi
    print_ok "Docker: $(docker --version | cut -d' ' -f3 | tr -d ',')"

    if ! docker compose version &>/dev/null; then
        print_error "Docker Compose não encontrado."; exit 1
    fi
    print_ok "Docker Compose: $(docker compose version --short 2>/dev/null || echo 'ok')"

    if ! command -v git &>/dev/null; then
        print_error "Git não encontrado."; exit 1
    fi
    print_ok "Git: $(git --version | cut -d' ' -f3)"

    if [ ! -f .env ]; then
        print_warn ".env não encontrado."
        if confirm "Criar .env a partir do .env.example?"; then
            cp .env.example .env
            print_ok ".env criado. Edite os valores e execute novamente."
            exit 0
        else
            print_error ".env é obrigatório. Encerrando."; exit 1
        fi
    fi
    print_ok ".env presente."
}

# -----------------------------------------------------------------------------
# Status dos submódulos
# -----------------------------------------------------------------------------
show_submodule_status() {
    echo -e "\n  ${GRAY}Estado atual dos submódulos:${NC}"
    for mod in "${SUBMODULES[@]}"; do
        if [ -d "$mod/.git" ] || [ -f "$mod/.git" ]; then
            local commit branch
            commit=$(git -C "$mod" rev-parse --short HEAD 2>/dev/null || echo "?")
            branch=$(git -C "$mod" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")
            local behind
            behind=$(git -C "$mod" rev-list HEAD..origin/main --count 2>/dev/null || echo "?")
            if [ "$behind" = "0" ]; then
                echo -e "  ${GREEN}✔${NC}  ${mod}  ${GRAY}[${branch}@${commit} — atualizado]${NC}"
            else
                echo -e "  ${YELLOW}⚠${NC}   ${mod}  ${GRAY}[${branch}@${commit} — ${behind} commit(s) para trás]${NC}"
            fi
        else
            echo -e "  ${RED}✘${NC}  ${mod}  ${GRAY}[não inicializado]${NC}"
        fi
    done
    echo ""
}

# -----------------------------------------------------------------------------
# Menu de opções
# -----------------------------------------------------------------------------
select_actions() {
    print_section "Selecione as ações"
    echo -e "  ${GRAY}Escolha o que será executado neste deploy:${NC}\n"

    DO_GIT_PULL=false
    DO_SUB_REMOTE=false       # git submodule update --remote (busca commits mais novos)
    DO_SUB_INIT=false         # git submodule update --init --recursive (sync ao pinado)
    DO_WIPE_DB=false
    DO_SEED_SCHOOL=false
    DO_MIGRATE_V2=false
    DO_MIGRATE_V3=false
    DO_SEED_AULAS_HTML=false
    DO_SEED_AULAS_PDF=false
    DO_BUILD=false
    DO_RESTART_ONLY=false
    DO_RESTART_APPS=false     # reiniciar só os apps (não o banco)

    # ── Git ────────────────────────────────────────────────────────────────
    echo -e "  ${BOLD}Código-fonte${NC}"

    if confirm "Atualizar orquestrador (git pull origin main)?"; then
        DO_GIT_PULL=true
    fi

    show_submodule_status

    if confirm "Atualizar submódulos para o HEAD remoto de cada um? (--remote)"; then
        DO_SUB_REMOTE=true
    elif confirm "Sincronizar submódulos ao commit pinado no orquestrador? (--init --recursive)"; then
        DO_SUB_INIT=true
    fi

    # ── Banco ─────────────────────────────────────────────────────────────
    echo -e "\n  ${BOLD}Banco de dados${NC}"

    echo ""
    print_warn "A próxima opção APAGA todos os dados do banco."
    if confirm "Recriar banco do zero (docker compose down -v)?"; then
        DO_WIPE_DB=true
    fi

    if confirm "Recriar seed da escola (usuários, turmas, disciplinas, roles)?"; then
        DO_SEED_SCHOOL=true
    fi

    if confirm "Executar migrate_paper_v2.sql (tabelas curriculares base)?"; then
        DO_MIGRATE_V2=true
    fi

    if confirm "Executar migrate_paper_v3.sql (aprendizagens_essenciais)?"; then
        DO_MIGRATE_V3=true
    fi

    if confirm "Popular currículo — seed_paper_aulas.sql (aulas HTML, ~1184 linhas)?"; then
        DO_SEED_AULAS_HTML=true
    fi

    if confirm "Popular currículo — seed_paper_aulas_pdf.sql (1944 aulas dos PDFs)?"; then
        DO_SEED_AULAS_PDF=true
    fi

    # ── Containers ────────────────────────────────────────────────────────
    echo -e "\n  ${BOLD}Containers${NC}"

    if confirm "Fazer build das imagens Docker (--build)?"; then
        DO_BUILD=true
    fi

    if [ "$DO_WIPE_DB" = false ] && [ "$DO_BUILD" = false ]; then
        if confirm "Reiniciar apenas os apps (sem o banco)?"; then
            DO_RESTART_APPS=true
        elif confirm "Reiniciar todos os serviços?"; then
            DO_RESTART_ONLY=true
        fi
    fi
}

# -----------------------------------------------------------------------------
# Resumo
# -----------------------------------------------------------------------------
print_summary() {
    print_section "Resumo das ações"

    local actions_on=()
    local actions_off=()

    _line() {
        local flag="$1" label="$2"
        if [ "$flag" = true ]; then
            actions_on+=("$label")
            print_info "$label"
        else
            echo -e "  ${GRAY}  ○  ${label}${NC}  ${GRAY}(pulado)${NC}"
        fi
    }

    _line "$DO_GIT_PULL"         "git pull origin main (orquestrador)"
    _line "$DO_SUB_REMOTE"       "git submodule update --remote [${SUBMODULES[*]}]"
    _line "$DO_SUB_INIT"         "git submodule update --init --recursive"
    [ "$DO_WIPE_DB" = true ] && \
        echo -e "  ${RED}  →  docker compose down -v  ← APAGA O BANCO${NC}" || \
        echo -e "  ${GRAY}  ○  down -v${NC}  ${GRAY}(banco mantido)${NC}"
    _line "$DO_SEED_SCHOOL"      "Seed escola (06_seed + 07_sso + 08_skills)"
    _line "$DO_MIGRATE_V2"       "migrate_paper_v2.sql"
    _line "$DO_MIGRATE_V3"       "migrate_paper_v3.sql (aprendizagens_essenciais)"
    _line "$DO_SEED_AULAS_HTML"  "seed_paper_aulas.sql (~1184 aulas)"
    _line "$DO_SEED_AULAS_PDF"   "seed_paper_aulas_pdf.sql (1944 aulas, ~30s)"
    _line "$DO_BUILD"            "docker compose up -d --build"
    _line "$DO_RESTART_APPS"     "Reiniciar apps (sem banco)"
    _line "$DO_RESTART_ONLY"     "docker compose restart (tudo)"

    echo ""
    divider
    if ! confirm "Confirmar e executar?"; then
        echo -e "\n  ${YELLOW}Deploy cancelado.${NC}\n"; exit 0
    fi
}

# -----------------------------------------------------------------------------
# Helpers de execução
# -----------------------------------------------------------------------------

# Aguarda banco pronto (max 60s)
wait_for_db() {
    local retries=0
    while [ $retries -lt 60 ]; do
        if docker exec samba_db pg_isready \
            -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-samba_db}" &>/dev/null; then
            return 0
        fi
        sleep 1; retries=$((retries+1))
    done
    return 1
}

# Sobe apenas o banco se não estiver rodando
ensure_db_running() {
    if ! docker ps --format '{{.Names}}' | grep -q '^samba_db$'; then
        print_info "Subindo banco de dados..."
        docker compose up -d db
        sleep 3
    fi
    if ! wait_for_db; then
        print_error "Banco não respondeu em 60s."; return 1
    fi
}

# Executa SQL com verificação de arquivo
run_sql() {
    local label="$1" file="$2"
    if [ ! -f "$file" ]; then
        print_error "Arquivo não encontrado: ${file}"
        return 1
    fi
    print_info "${label}..."
    docker exec -i samba_db psql \
        -U "${POSTGRES_USER:-postgres}" \
        -d "${POSTGRES_DB:-samba_db}" < "$file"
    print_ok "${label} — OK"
}

# -----------------------------------------------------------------------------
# Execução do deploy
# -----------------------------------------------------------------------------
run_deploy() {
    local step=0 total=0

    [ "$DO_GIT_PULL" = true ]        && total=$((total+1))
    [ "$DO_SUB_REMOTE" = true ]      && total=$((total+1))
    [ "$DO_SUB_INIT" = true ]        && total=$((total+1))
    [ "$DO_WIPE_DB" = true ]         && total=$((total+1))
    [ "$DO_SEED_SCHOOL" = true ]     && total=$((total+1))
    [ "$DO_MIGRATE_V2" = true ]      && total=$((total+1))
    [ "$DO_MIGRATE_V3" = true ]      && total=$((total+1))
    [ "$DO_SEED_AULAS_HTML" = true ] && total=$((total+1))
    [ "$DO_SEED_AULAS_PDF" = true ]  && total=$((total+1))
    total=$((total+1)) # containers sempre

    print_section "Executando"

    # ── Git pull do orquestrador ──────────────────────────────────────────
    if [ "$DO_GIT_PULL" = true ]; then
        step=$((step+1))
        print_step $step $total "git pull origin main"
        if git pull origin main; then
            print_ok "Orquestrador atualizado."
        else
            print_error "Falha no git pull — verifique conflitos."
            exit 1
        fi
    fi

    # ── Submódulos --remote ───────────────────────────────────────────────
    if [ "$DO_SUB_REMOTE" = true ]; then
        step=$((step+1))
        print_step $step $total "Atualizando submódulos (--remote)"

        for mod in "${SUBMODULES[@]}"; do
            local before after
            before=$(git -C "$mod" rev-parse --short HEAD 2>/dev/null || echo "?")
            print_info "Atualizando ${mod}..."

            # Entra no submódulo e puxa da branch main
            if git submodule update --remote "$mod" 2>/dev/null; then
                after=$(git -C "$mod" rev-parse --short HEAD 2>/dev/null || echo "?")
                if [ "$before" = "$after" ]; then
                    print_ok "${mod} — já atualizado (${after})"
                else
                    print_ok "${mod} — ${before} → ${after}"
                fi
            else
                print_warn "${mod} — falha ao atualizar (continuando)"
            fi
        done

        # Registra os novos commits no orquestrador
        if git diff --quiet HEAD -- "${SUBMODULES[@]}" 2>/dev/null; then
            print_info "Nenhuma mudança nos submódulos para registrar."
        else
            git add "${SUBMODULES[@]}"
            git commit -m "chore: atualiza ponteiros dos submódulos [deploy automático]" \
                --no-verify 2>/dev/null || true
            print_ok "Ponteiros dos submódulos registrados no orquestrador."
        fi
    fi

    # ── Submódulos --init --recursive ─────────────────────────────────────
    if [ "$DO_SUB_INIT" = true ]; then
        step=$((step+1))
        print_step $step $total "Sincronizando submódulos (--init --recursive)"
        git submodule update --init --recursive
        print_ok "Submódulos sincronizados ao commit pinado."
    fi

    # ── Down -v ───────────────────────────────────────────────────────────
    if [ "$DO_WIPE_DB" = true ]; then
        step=$((step+1))
        print_step $step $total "Removendo containers e volumes"
        docker compose down -v
        print_ok "Containers e volumes removidos."
    fi

    # ── Seed da escola ────────────────────────────────────────────────────
    if [ "$DO_SEED_SCHOOL" = true ]; then
        step=$((step+1))
        print_step $step $total "Seed da escola"
        ensure_db_running || exit 1

        run_sql "sso_tokens e permissões"          samba-db/init/07_sso_tokens.sql
        run_sql "Dados base da escola"             samba-db/init/06_seed.sql
        run_sql "Habilidades BNCC"                 samba-db/init/08_skills_seed.sql

        print_info "Sincronizando senhas dos usuários do banco com o .env..."
        docker exec samba_db psql \
            -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-samba_db}" -c "
            ALTER USER samba_school_user  WITH PASSWORD '${SCHOOL_DB_PASSWORD}';
            ALTER USER samba_code_user    WITH PASSWORD '${CODE_DB_PASSWORD}';
            ALTER USER samba_edvance_user WITH PASSWORD '${EDVANCE_DB_PASSWORD}';
            ALTER USER samba_paper_user   WITH PASSWORD '${PAPER_DB_PASSWORD}';
        "
        print_ok "Senhas sincronizadas."
    fi

    # ── Migrações samba-paper ─────────────────────────────────────────────
    if [ "$DO_MIGRATE_V2" = true ] || [ "$DO_MIGRATE_V3" = true ] || \
       [ "$DO_SEED_AULAS_HTML" = true ] || [ "$DO_SEED_AULAS_PDF" = true ]; then
        ensure_db_running || exit 1
    fi

    if [ "$DO_MIGRATE_V2" = true ]; then
        step=$((step+1))
        print_step $step $total "migrate_paper_v2.sql"
        run_sql "Tabelas curriculares base (v2)" samba-db/migrate_paper_v2.sql
    fi

    if [ "$DO_MIGRATE_V3" = true ]; then
        step=$((step+1))
        print_step $step $total "migrate_paper_v3.sql"
        run_sql "Aprendizagens essenciais (v3)" samba-db/migrate_paper_v3.sql
    fi

    if [ "$DO_SEED_AULAS_HTML" = true ]; then
        step=$((step+1))
        print_step $step $total "seed_paper_aulas.sql (~1184 aulas HTML)"
        run_sql "Currículo HTML" samba-db/seed_paper_aulas.sql
    fi

    if [ "$DO_SEED_AULAS_PDF" = true ]; then
        step=$((step+1))
        print_step $step $total "seed_paper_aulas_pdf.sql (1944 aulas + 347 AEs)"
        print_info "Este seed pode levar ~30 segundos..."
        run_sql "Currículo PDF" samba-db/seed_paper_aulas_pdf.sql
    fi

    # ── Containers ────────────────────────────────────────────────────────
    step=$((step+1))

    if [ "$DO_RESTART_APPS" = true ]; then
        print_step $step $total "Reiniciando apps (sem banco)"
        docker compose restart \
            samba-code samba-access samba-edvance samba-flourish \
            samba-admin samba-innovations samba-paper 2>/dev/null \
            || docker compose restart
    elif [ "$DO_RESTART_ONLY" = true ]; then
        print_step $step $total "Reiniciando todos os serviços"
        docker compose restart
    elif [ "$DO_BUILD" = true ]; then
        print_step $step $total "Build e inicialização"
        docker compose up -d --build
    else
        print_step $step $total "Iniciando serviços"
        docker compose up -d
    fi
    print_ok "Serviços iniciados."
}

# -----------------------------------------------------------------------------
# Status dos serviços
# -----------------------------------------------------------------------------
print_status() {
    print_section "Status dos serviços"
    echo ""
    docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null \
        || docker compose ps
    echo ""
}

# -----------------------------------------------------------------------------
# Health Checks
# -----------------------------------------------------------------------------
HC_TOTAL=0; HC_PASS=0; HC_FAIL=0; HC_WARN=0

hc_ok()   { echo -e "  ${GREEN}✔${NC}  ${1}"; HC_PASS=$((HC_PASS+1)); HC_TOTAL=$((HC_TOTAL+1)); }
hc_fail() { echo -e "  ${RED}✘${NC}  ${1}"; HC_FAIL=$((HC_FAIL+1)); HC_TOTAL=$((HC_TOTAL+1)); }
hc_warn() { echo -e "  ${YELLOW}⚠${NC}   ${1}"; HC_WARN=$((HC_WARN+1)); HC_TOTAL=$((HC_TOTAL+1)); }
hc_title(){ echo -e "\n  ${GRAY}${BOLD}${1}${NC}"; }

container_running() {
    local state
    state=$(docker inspect --format='{{.State.Status}}' "$1" 2>/dev/null || echo "missing")
    [ "$state" = "running" ]
}

http_status() {
    curl -s -o /dev/null -w "%{http_code}" --max-time 8 "http://localhost:${1}" 2>/dev/null \
        || echo "000"
}

db_query() {
    docker exec samba_db psql \
        -U "${POSTGRES_USER:-postgres}" \
        -d "${POSTGRES_DB:-samba_db}" \
        -t -A -c "$1" 2>/dev/null | tr -d ' '
}

# Testa conexão de um usuário de app ao banco
db_connect_test() {
    local user="$1" password="$2" schema="$3"
    docker exec samba_db psql \
        "postgresql://${user}:${password}@localhost/${POSTGRES_DB:-samba_db}" \
        -t -A -c "SELECT current_user;" 2>/dev/null | tr -d ' '
}

# Verifica se um volume/bind está montado no container
check_mount() {
    local container="$1" path="$2"
    docker inspect --format='{{range .Mounts}}{{.Destination}} {{end}}' \
        "$container" 2>/dev/null | grep -qw "$path"
}

# Verifica se arquivo/dir existe dentro do container
path_in_container() {
    local container="$1" path="$2"
    docker exec "$container" test -e "$path" 2>/dev/null
}

run_health_checks() {
    HC_TOTAL=0; HC_PASS=0; HC_FAIL=0; HC_WARN=0
    set -a; [ -f .env ] && source .env; set +a

    print_section "Health Checks"

    # ── 1. Containers ─────────────────────────────────────────────────────
    hc_title "1. Containers"

    local services=(
        "samba_db"
        "samba_code_app"
        "samba_access_app"
        "samba_edvance_app"
        "samba_admin_app"
        "samba_flourish_app"
        "samba_innovations_app"
        "samba_paper_app"
    )
    for svc in "${services[@]}"; do
        if container_running "$svc"; then
            local uptime
            uptime=$(docker inspect --format='{{.State.StartedAt}}' "$svc" 2>/dev/null \
                | head -c 19 | tr 'T' ' ')
            hc_ok "Container ${svc} rodando (desde ${uptime})"
        else
            hc_fail "Container ${svc} não está rodando"
        fi
    done

    # Containers em restart loop
    local restarting
    restarting=$(docker ps --filter "status=restarting" --format "{{.Names}}" 2>/dev/null)
    if [ -z "$restarting" ]; then
        hc_ok "Nenhum container em loop de restart"
    else
        hc_fail "Restart loop: ${restarting}"
    fi

    # ── 2. Volumes montados ────────────────────────────────────────────────
    hc_title "2. Volumes e montagens"

    # samba_db: dados persistentes
    if check_mount "samba_db" "/var/lib/postgresql/data"; then
        hc_ok "samba_db: /var/lib/postgresql/data montado"
    else
        hc_warn "samba_db: /var/lib/postgresql/data sem mount declarado (volume anônimo?)"
    fi

    # samba_paper: storage de PDFs gerados
    if container_running "samba_paper_app"; then
        if check_mount "samba_paper_app" "/app/storage"; then
            hc_ok "samba_paper_app: /app/storage montado"
            # Verifica se o diretório existe e é gravável
            if docker exec samba_paper_app test -w /app/storage 2>/dev/null; then
                hc_ok "samba_paper_app: /app/storage com permissão de escrita"
            else
                hc_fail "samba_paper_app: /app/storage sem permissão de escrita"
            fi
        else
            hc_warn "samba_paper_app: /app/storage não declarado como volume"
        fi
    fi

    # ── 3. Banco de dados ─────────────────────────────────────────────────
    hc_title "3. Banco de dados — conectividade"

    if ! wait_for_db; then
        hc_fail "PostgreSQL não respondeu após 60s"
    else
        hc_ok "PostgreSQL aceitando conexões (postgres)"

        # Extensões
        for ext in pgcrypto "uuid-ossp"; do
            local ext_ok
            ext_ok=$(db_query "SELECT COUNT(*) FROM pg_extension WHERE extname='${ext}';")
            [ "$ext_ok" = "1" ] && hc_ok "Extensão ${ext}" || hc_fail "Extensão ${ext} ausente"
        done

        # Schemas
        for schema in samba_school samba_edvance samba_code samba_paper samba_flourish; do
            local s_ok
            s_ok=$(db_query "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name='${schema}';")
            [ "$s_ok" = "1" ] && hc_ok "Schema ${schema}" || hc_fail "Schema ${schema} ausente"
        done
    fi

    # ── 4. Conexões por usuário de app ────────────────────────────────────
    hc_title "4. Conexões por usuário do banco"

    declare -A APP_USERS=(
        ["samba_school_user"]="${SCHOOL_DB_PASSWORD:-}"
        ["samba_code_user"]="${CODE_DB_PASSWORD:-}"
        ["samba_edvance_user"]="${EDVANCE_DB_PASSWORD:-}"
        ["samba_paper_user"]="${PAPER_DB_PASSWORD:-}"
    )

    for user in "${!APP_USERS[@]}"; do
        local pass="${APP_USERS[$user]}"
        if [ -z "$pass" ]; then
            hc_warn "${user}: senha não definida no .env"
            continue
        fi
        local result
        result=$(db_connect_test "$user" "$pass" "" 2>/dev/null || echo "fail")
        if [ "$result" = "$user" ]; then
            hc_ok "${user}: autenticação OK"
        else
            hc_fail "${user}: falha na autenticação (resultado: '${result}')"
        fi
    done

    # ── 5. Integridade do seed ────────────────────────────────────────────
    hc_title "5. Integridade do seed"

    # Usuários
    local user_count
    user_count=$(db_query "SELECT COUNT(*) FROM samba_school.users;" 2>/dev/null || echo 0)
    if [ "${user_count:-0}" -ge 44 ] 2>/dev/null; then
        hc_ok "Usuários: ${user_count} (≥ 44)"
    else
        hc_fail "Usuários: ${user_count} (esperado ≥ 44)"
    fi

    # ROOT
    local root_exists
    root_exists=$(db_query "SELECT COUNT(*) FROM samba_school.users WHERE email='root@escolacabral.com.br';" 2>/dev/null || echo 0)
    [ "${root_exists:-0}" = "1" ] && hc_ok "Usuário ROOT presente" || hc_fail "Usuário ROOT ausente"

    # Turmas
    local class_count
    class_count=$(db_query "SELECT COUNT(*) FROM samba_school.school_classes;" 2>/dev/null || echo 0)
    [ "${class_count:-0}" -ge 22 ] 2>/dev/null && hc_ok "Turmas: ${class_count} (≥ 22)" \
        || hc_fail "Turmas: ${class_count} (esperado ≥ 22)"

    # Disciplinas
    local disc_count
    disc_count=$(db_query "SELECT COUNT(*) FROM samba_school.disciplines;" 2>/dev/null || echo 0)
    [ "${disc_count:-0}" -ge 35 ] 2>/dev/null && hc_ok "Disciplinas: ${disc_count} (≥ 35)" \
        || hc_fail "Disciplinas: ${disc_count} (esperado ≥ 35)"

    # Vínculos turma ↔ disciplina
    local cd_count
    cd_count=$(db_query "SELECT COUNT(*) FROM samba_school.class_disciplines;" 2>/dev/null || echo 0)
    [ "${cd_count:-0}" -gt 0 ] 2>/dev/null && hc_ok "Vínculos turma↔disciplina: ${cd_count}" \
        || hc_fail "Nenhum vínculo turma↔disciplina"

    # Vínculos professor ↔ turma ↔ disciplina
    local ta_count
    ta_count=$(db_query "SELECT COUNT(*) FROM samba_school.teacher_assignments;" 2>/dev/null || echo 0)
    if [ "${ta_count:-0}" -gt 0 ] 2>/dev/null; then
        hc_ok "Vínculos professor↔disciplina: ${ta_count}"
    else
        hc_warn "Nenhum vínculo professor↔disciplina (teacher_assignments vazio)"
    fi

    # Habilidades BNCC
    local skills_count
    skills_count=$(db_query "SELECT COUNT(*) FROM samba_edvance.skills;" 2>/dev/null || echo 0)
    if [ "${skills_count:-0}" -gt 600 ] 2>/dev/null; then
        hc_ok "Habilidades BNCC: ${skills_count}"
    elif [ "${skills_count:-0}" -gt 0 ] 2>/dev/null; then
        hc_warn "Habilidades BNCC: ${skills_count} — esperado > 600"
    else
        hc_warn "Habilidades BNCC: nenhuma — rode 08_skills_seed.sql"
    fi

    # ── 6. Currículo (samba_paper) ────────────────────────────────────────
    hc_title "6. Currículo samba_paper"

    # Aulas
    local aulas_count
    aulas_count=$(db_query "SELECT COUNT(*) FROM samba_paper.aulas;" 2>/dev/null || echo 0)
    if [ "${aulas_count:-0}" -ge 1944 ] 2>/dev/null; then
        hc_ok "Aulas curriculares: ${aulas_count} (currículo PDF completo ✔)"
    elif [ "${aulas_count:-0}" -ge 1000 ] 2>/dev/null; then
        hc_warn "Aulas curriculares: ${aulas_count} — seed PDF incompleto (esperado ≥ 1944)"
    elif [ "${aulas_count:-0}" -gt 0 ] 2>/dev/null; then
        hc_warn "Aulas curriculares: ${aulas_count} — execute seed_paper_aulas_pdf.sql"
    else
        hc_warn "Tabela aulas vazia — rode migrate_paper_v2 e os seeds"
    fi

    # Disciplinas presentes
    if [ "${aulas_count:-0}" -gt 0 ] 2>/dev/null; then
        local disc_in_aulas
        disc_in_aulas=$(db_query "SELECT COUNT(DISTINCT disciplina_nome) FROM samba_paper.aulas;" 2>/dev/null || echo 0)
        hc_ok "Disciplinas com currículo: ${disc_in_aulas}"

        # Verifica se disciplinas chave estão presentes
        for disc in "Matemática" "Língua Portuguesa" "Ciências" "História"; do
            local d_ok
            d_ok=$(db_query "SELECT COUNT(*) FROM samba_paper.aulas WHERE disciplina_nome='${disc}';" 2>/dev/null || echo 0)
            if [ "${d_ok:-0}" -gt 0 ] 2>/dev/null; then
                hc_ok "Currículo: ${disc} (${d_ok} aulas)"
            else
                hc_warn "Currículo: ${disc} ausente"
            fi
        done
    fi

    # Aprendizagens Essenciais
    local ae_count
    ae_count=$(db_query "SELECT COUNT(*) FROM samba_paper.aprendizagens_essenciais;" 2>/dev/null || echo "tabela ausente")
    if echo "$ae_count" | grep -q "^[0-9]"; then
        if [ "${ae_count:-0}" -ge 200 ] 2>/dev/null; then
            hc_ok "Aprendizagens Essenciais: ${ae_count}"
        elif [ "${ae_count:-0}" -gt 0 ] 2>/dev/null; then
            hc_warn "Aprendizagens Essenciais: ${ae_count} (esperado ≥ 347)"
        else
            hc_warn "Tabela aprendizagens_essenciais vazia"
        fi
    else
        hc_warn "Tabela aprendizagens_essenciais não existe — rode migrate_paper_v3.sql"
    fi

    # Bimestres cadastrados
    local bim_count
    bim_count=$(db_query "SELECT COUNT(*) FROM samba_paper.bimestres;" 2>/dev/null || echo 0)
    [ "${bim_count:-0}" -ge 4 ] 2>/dev/null \
        && hc_ok "Bimestres 2026: ${bim_count}" \
        || hc_warn "Bimestres: ${bim_count} (esperado ≥ 4)"

    # ── 7. Conectividade de rede inter-containers ─────────────────────────
    hc_title "7. Rede inter-containers"

    local net_apps=("samba_code_app" "samba_paper_app" "samba_access_app")
    for app in "${net_apps[@]}"; do
        if container_running "$app"; then
            if docker exec "$app" sh -c "nc -z -w2 samba_db 5432 2>/dev/null || ping -c1 -W2 samba_db &>/dev/null"; then
                hc_ok "${app} → samba_db (porta 5432) alcançável"
            else
                hc_fail "${app} → samba_db não alcançável"
            fi
        fi
    done

    # ── 8. HTTP — Aplicações ──────────────────────────────────────────────
    hc_title "8. HTTP — Aplicações"

    declare -A APPS=(
        [3000]="innovations"
        [3001]="code"
        [3002]="access"
        [3003]="edvance"
        [3004]="flourish"
        [3005]="admin"
        [3006]="paper"
    )

    for port in $(echo "${!APPS[@]}" | tr ' ' '\n' | sort -n); do
        local name="${APPS[$port]}" code
        code=$(http_status "$port")
        if [[ "$code" =~ ^(200|301|302|303|307|308)$ ]]; then
            hc_ok "${name} (porta ${port}) — HTTP ${code}"
        elif [ "$code" = "404" ] && [ "$port" = "3005" ]; then
            hc_ok "${name} (porta ${port}) — HTTP 404 (normal, sem rota raiz)"
        elif [ "$code" = "000" ]; then
            hc_fail "${name} (porta ${port}) — sem resposta"
        else
            hc_warn "${name} (porta ${port}) — HTTP ${code}"
        fi
    done

    # ── 9. Submódulos — estado dos commits ────────────────────────────────
    hc_title "9. Submódulos"

    for mod in "${SUBMODULES[@]}"; do
        if [ -d "$mod/.git" ] || [ -f "$mod/.git" ]; then
            local commit branch behind
            commit=$(git -C "$mod" rev-parse --short HEAD 2>/dev/null || echo "?")
            branch=$(git -C "$mod" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")
            git -C "$mod" fetch origin --quiet 2>/dev/null || true
            behind=$(git -C "$mod" rev-list HEAD..origin/main --count 2>/dev/null || echo "?")
            if [ "$behind" = "0" ]; then
                hc_ok "${mod} [${branch}@${commit}] — atualizado"
            elif [ "$behind" = "?" ]; then
                hc_warn "${mod} [${branch}@${commit}] — não foi possível verificar remote"
            else
                hc_warn "${mod} [${branch}@${commit}] — ${behind} commit(s) atrás do remote"
            fi
        else
            hc_warn "${mod} — não inicializado"
        fi
    done

    # ── Resultado final ───────────────────────────────────────────────────
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

case "${1:-}" in
    --health)
        verify_password
        run_health_checks
        exit 0
        ;;
    --status)
        verify_password
        print_status
        exit 0
        ;;
    --submodules)
        # Atualiza todos os submódulos --remote sem deploy completo
        verify_password
        print_section "Atualizando submódulos"
        show_submodule_status
        for mod in "${SUBMODULES[@]}"; do
            print_info "Atualizando ${mod}..."
            git submodule update --remote "$mod" 2>/dev/null \
                && print_ok "${mod} atualizado" \
                || print_warn "${mod} — falha"
        done
        exit 0
        ;;
esac

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
    echo -e "  ${GRAY}Comandos úteis:${NC}"
    echo -e "  ${CYAN}  bash deploy.sh --health      ${GRAY}# só health checks${NC}"
    echo -e "  ${CYAN}  bash deploy.sh --status      ${GRAY}# só status dos containers${NC}"
    echo -e "  ${CYAN}  bash deploy.sh --submodules  ${GRAY}# só atualiza submódulos${NC}"
    echo -e "  ${CYAN}  docker compose logs -f --tail=50${NC}\n"
fi
