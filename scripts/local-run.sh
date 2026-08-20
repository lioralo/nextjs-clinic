#!/usr/bin/env bash
# Local runner: pull repo updates, apply install/migrations/seed, start the clinic app.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-3000}"
DO_PULL=1
DO_SEED=1
KILL_PORT=0
COMMAND="${1:-up}"

if [[ "${1:-}" == -* ]]; then
  COMMAND="up"
else
  if [[ $# -gt 0 ]]; then
    shift
  fi
fi

for arg in "$@"; do
  case "$arg" in
    --no-pull) DO_PULL=0 ;;
    --no-seed) DO_SEED=0 ;;
    --kill-port) KILL_PORT=1 ;;
    -h|--help) COMMAND="help" ;;
    *)
      echo "Unknown option: $arg" >&2
      echo "Try: $0 help" >&2
      exit 1
      ;;
  esac
done

log() { printf '\n==> %s\n' "$*"; }
warn() { printf 'warning: %s\n' "$*" >&2; }

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

usage() {
  cat <<'EOF'
Clinic local runner — apply repo updates and run the app.

Usage:
  npm run local                 # pull, install, migrate, seed, start dev
  npm run local:update          # same, without starting the server
  npm run local:dev             # start Next.js only
  npm run local:check           # unit tests + production build
  npm run local:e2e             # update, then Playwright
  bash scripts/local-run.sh <command> [options]

Commands:
  up        Update the checkout, then start `next dev` (default)
  update    git pull, npm install, migrate, seed
  dev       Start the dev server (creates .env.local if missing)
  check     npm test && next build
  e2e       update, then Playwright
  help      Show this text

Options:
  --no-pull     Skip git pull
  --no-seed     Skip prisma seed
  --kill-port   Free PORT (default 3000) if something is already listening

After start:
  http://localhost:3000/he/login
  staff  admin / admin-password
  portal portal / portal-password
EOF
}

ensure_env() {
  if [[ ! -f .env.local ]]; then
    if [[ -f .env.example ]]; then
      log "Creating .env.local from .env.example"
      cp .env.example .env.local
    else
      echo "No .env.example found; cannot create .env.local" >&2
      exit 1
    fi
  else
    log ".env.local already present"
  fi
}

git_update() {
  if [[ "$DO_PULL" != 1 ]]; then
    log "Skipping git pull (--no-pull)"
    return
  fi
  if ! command -v git >/dev/null 2>&1 || [[ ! -d .git ]]; then
    warn "Not a git checkout; skip pull"
    return
  fi
  if [[ -n "$(git status --porcelain)" ]]; then
    warn "Working tree is dirty; skip git pull so local edits are kept"
    git status -sb
    return
  fi
  local branch
  branch="$(git rev-parse --abbrev-ref HEAD)"
  if [[ "$branch" == "HEAD" ]]; then
    warn "Detached HEAD; skip git pull"
    return
  fi
  log "Pulling origin/${branch} (fast-forward only)"
  git fetch origin "$branch" || {
    warn "git fetch failed; continuing with local files"
    return
  }
  if git rev-parse --verify "origin/${branch}" >/dev/null 2>&1; then
    git pull --ff-only origin "$branch" || warn "git pull --ff-only failed; continuing"
  else
    warn "No origin/${branch}; skip pull"
  fi
}

npm_install() {
  need_cmd npm
  log "Installing npm dependencies"
  if [[ -f package-lock.json ]]; then
    npm install
  else
    npm install
  fi
}

db_update() {
  log "Applying Prisma migrations"
  npx prisma generate
  npx prisma migrate deploy
  if [[ "$DO_SEED" == 1 ]]; then
    log "Seeding (idempotent: admin, Test Patient, portal user, assessments)"
    npm run db:seed
  else
    log "Skipping seed (--no-seed)"
  fi
}

port_in_use() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1
  elif command -v ss >/dev/null 2>&1; then
    ss -ltn "sport = :$PORT" | tail -n +2 | grep -q .
  else
    return 1
  fi
}

free_port() {
  if ! port_in_use; then
    return
  fi
  if [[ "$KILL_PORT" != 1 ]]; then
    warn "Port ${PORT} is already in use. Stop that process, or re-run with --kill-port."
    return
  fi
  log "Freeing port ${PORT}"
  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids="$(lsof -t -nP -iTCP:"$PORT" -sTCP:LISTEN || true)"
    if [[ -n "$pids" ]]; then
      # shellcheck disable=SC2086
      kill $pids || true
      sleep 1
    fi
  fi
}

print_ready() {
  cat <<EOF

Clinic is ready.

  App:    http://localhost:${PORT}/he
  Login:  http://localhost:${PORT}/he/login
  Staff:  admin / admin-password
  Portal: portal / portal-password

EOF
}

run_update() {
  ensure_env
  git_update
  npm_install
  db_update
}

run_dev() {
  ensure_env
  free_port
  print_ready
  log "Starting Next.js (PORT=${PORT})"
  exec npm run dev -- --port "$PORT"
}

run_check() {
  need_cmd npm
  log "Unit tests"
  npm test
  log "Production build"
  npx next build
}

run_e2e() {
  run_update
  log "Playwright e2e"
  npm run e2e
}

case "$COMMAND" in
  help|-h|--help)
    usage
    ;;
  update)
    run_update
    log "Updates applied. Start with: npm run local:dev"
    ;;
  dev)
    run_dev
    ;;
  up)
    run_update
    run_dev
    ;;
  check)
    run_check
    ;;
  e2e)
    run_e2e
    ;;
  *)
    echo "Unknown command: $COMMAND" >&2
    usage >&2
    exit 1
    ;;
esac
