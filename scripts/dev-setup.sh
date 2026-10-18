#!/usr/bin/env bash
# Install and start PostgreSQL 17 and Mailpit, then seed the dev databases.
# Idempotent: cloud-agent install and start can both run it.
set -euo pipefail

PG_VERSION=17
NODE_VERSION=24.22.0
MAILPIT_VERSION=1.31.6
DB_USER=helpdesk
DB_PASSWORD=change-me
DB_NAME=helpdesk
TEST_DB=helpdesk_test

log() { printf 'dev-setup: %s\n' "$*"; }

ensure_node() {
  hash -r || true
  local major=""
  if command -v node >/dev/null 2>&1; then
    major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || true)"
  fi
  if [[ "$major" == "24" ]]; then
    log "Node $(node -v)"
  elif [[ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]]; then
    # shellcheck disable=SC1091
    . "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
    nvm install 24
    nvm alias default 24
    nvm use 24
    hash -r || true
    log "Node $(node -v) (nvm default is 24)"
  else
    if [[ "$(uname -m)" != "x86_64" ]]; then
      echo "dev-setup: need Node 24; tarball fallback supports x86_64 only" >&2
      exit 1
    fi
    local dest="$HOME/.local/node-v${NODE_VERSION}"
    if [[ ! -x "$dest/bin/node" ]]; then
      log "installing Node ${NODE_VERSION}"
      local tmp
      tmp="$(mktemp)"
      curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" -o "$tmp"
      mkdir -p "$dest"
      tar -xJf "$tmp" -C "$dest" --strip-components=1
      rm -f "$tmp"
    fi
    export PATH="$dest/bin:$PATH"
    hash -r || true
    log "Node $(node -v)"
  fi
  local bin
  bin="$(dirname "$(command -v node)")"
  cat >"$HOME/.helpdesk-node.sh" <<EOF
export PATH="${bin}:\$PATH"
EOF
}

start_postgres() {
  if ! command -v pg_lsclusters >/dev/null 2>&1 || ! pg_lsclusters --no-header | awk -v v="$PG_VERSION" '$1==v { found=1 } END { exit !found }'; then
    log "installing PostgreSQL ${PG_VERSION}"
    sudo apt-get update
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql-common
    sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y "postgresql-${PG_VERSION}"
  fi
  if ! pg_lsclusters --no-header | awk -v v="$PG_VERSION" '$1==v && $4=="online" { found=1 } END { exit !found }'; then
    sudo pg_ctlcluster "$PG_VERSION" main start
  fi
  local _try
  for _try in $(seq 1 30); do
    if sudo -u postgres pg_isready -q; then
      break
    fi
    sleep 1
  done
  sudo -u postgres pg_isready -q
  sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
  ELSE
    ALTER ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;
SQL
  local db
  for db in "$DB_NAME" "$TEST_DB"; do
    if [[ "$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${db}'")" != "1" ]]; then
      sudo -u postgres createdb -O "$DB_USER" "$db"
    fi
    sudo -u postgres psql -v ON_ERROR_STOP=1 -d "$db" -c "GRANT ALL ON SCHEMA public TO ${DB_USER}"
  done
  PGPASSWORD="$DB_PASSWORD" psql -h 127.0.0.1 -U "$DB_USER" -d "$TEST_DB" -v ON_ERROR_STOP=1 -c "SELECT 1" >/dev/null
  log "PostgreSQL ${PG_VERSION} ready (databases ${DB_NAME}, ${TEST_DB} on 127.0.0.1:5432)"
}

start_mailpit() {
  local current=""
  if command -v mailpit >/dev/null 2>&1; then
    current="$(mailpit version 2>/dev/null || true)"
  fi
  if [[ "$current" != *"$MAILPIT_VERSION"* ]]; then
    local march tmp
    case "$(uname -m)" in
      x86_64) march=amd64 ;;
      aarch64 | arm64) march=arm64 ;;
      *)
        echo "dev-setup: unsupported architecture $(uname -m)" >&2
        exit 1
        ;;
    esac
    log "installing Mailpit ${MAILPIT_VERSION}"
    tmp="$(mktemp -d)"
    curl -fsSL "https://github.com/axllent/mailpit/releases/download/v${MAILPIT_VERSION}/mailpit-linux-${march}.tar.gz" -o "$tmp/mailpit.tar.gz"
    sudo tar -C /usr/local/bin -xzf "$tmp/mailpit.tar.gz" mailpit
    sudo chmod 755 /usr/local/bin/mailpit
    rm -rf "$tmp"
  fi
  if ! curl -sf "http://127.0.0.1:8025/api/v1/info" >/dev/null; then
    nohup mailpit --smtp 127.0.0.1:1025 --listen 127.0.0.1:8025 >/tmp/mailpit.log 2>&1 &
    local _try
    for _try in $(seq 1 30); do
      if curl -sf "http://127.0.0.1:8025/api/v1/info" >/dev/null; then
        break
      fi
      sleep 1
    done
  fi
  curl -sf "http://127.0.0.1:8025/api/v1/info" >/dev/null
  log "Mailpit ${MAILPIT_VERSION} ready (smtp 127.0.0.1:1025, api http://127.0.0.1:8025)"
}

ensure_node
start_postgres
start_mailpit
