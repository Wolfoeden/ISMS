#!/usr/bin/env bash
# Startet den lokalen Prototyp: temporäre Datenbank mit fiktiven Startdaten + Server auf 127.0.0.1.
# Nur Prototyp (Test-Anmeldung). Daten gehen beim Beenden verloren.
set -euo pipefail
cd "$(dirname "$0")/.."
export ISMS_DEV_AUTH=1
export ISMS_SYSTEM_TOKEN="${ISMS_SYSTEM_TOKEN:-$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')}"
exec bash scripts/with-db.sh npx tsx src/api/server.ts
