#!/usr/bin/env bash
# Startet einen temporären PostgreSQL-Cluster, wendet alle Migrationen an und
# führt die Smoke-Tests aus. Benötigt lokale PostgreSQL-Binaries (initdb, pg_ctl).
set -euo pipefail
cd "$(dirname "$0")"
PGBIN="${PGBIN:-$(dirname "$(command -v pg_ctl 2>/dev/null || ls -d /usr/lib/postgresql/*/bin/pg_ctl | sort -V | tail -1)")}"
TMP="$(mktemp -d)"
PORT="${PGPORT_TEST:-54329}"
cleanup() { "$PGBIN/pg_ctl" -D "$TMP/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$TMP"; }
trap cleanup EXIT
if [ "$(id -u)" = "0" ]; then
  echo "Bitte nicht als root ausführen (initdb verweigert root)." >&2; exit 1
fi
"$PGBIN/initdb" -D "$TMP/data" -A trust -U postgres >/dev/null
"$PGBIN/pg_ctl" -D "$TMP/data" -o "-p $PORT -k $TMP -c listen_addresses=''" -l "$TMP/log" -w start >/dev/null
PSQL=(psql -h "$TMP" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q)
for f in migrations/*.sql; do echo "▶ $f"; "${PSQL[@]}" -f "$f"; done
for f in tests/*.sql; do
  echo "▶ $f"
  if ! "${PSQL[@]}" -f "$f" >"$TMP/out" 2>&1; then cat "$TMP/out" >&2; exit 1; fi
  sed -n 's/.*NOTICE:  /  /p' "$TMP/out"
done
echo "✔ Datenbank-Tests bestanden"
