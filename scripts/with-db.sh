#!/usr/bin/env bash
# Startet einen temporären PostgreSQL-Cluster, wendet alle Migrationen und die fiktiven
# Startdaten an und führt den übergebenen Befehl mit DATABASE_URL aus.
# Beispiel: bash scripts/with-db.sh npx vitest run test/api
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="${PGBIN:-$(dirname "$(command -v pg_ctl 2>/dev/null || ls -d /usr/lib/postgresql/*/bin/pg_ctl | sort -V | tail -1)")}"
PORT="${PGPORT_TEST:-54331}"
TMP="$(mktemp -d)"
AS=()
if [ "$(id -u)" = "0" ]; then chown postgres "$TMP"; AS=(runuser -u postgres --); fi
cleanup() { "${AS[@]}" "$PGBIN/pg_ctl" -D "$TMP/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$TMP"; }
trap cleanup EXIT
"${AS[@]}" "$PGBIN/initdb" -D "$TMP/data" -A trust -U postgres >/dev/null
"${AS[@]}" "$PGBIN/pg_ctl" -D "$TMP/data" -o "-p $PORT -k $TMP -c listen_addresses=''" -l "$TMP/log" -w start >/dev/null
PSQL=(psql -h "$TMP" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q)
for f in "$ROOT"/db/migrations/*.sql; do "${PSQL[@]}" -f "$f"; done
"${PSQL[@]}" -f "$ROOT/db/seed/pilot.sql"
export DATABASE_URL="postgresql://postgres@localhost:$PORT/postgres?host=$TMP"
export ISMS_EVIDENCE_DIR="$TMP/evidence"
"$@"
