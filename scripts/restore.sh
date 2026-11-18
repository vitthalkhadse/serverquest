#!/usr/bin/env bash
# Usage: ./scripts/restore.sh backups/db_2026-11-18_0200.sql.gz
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a
gunzip -c "$1" | docker compose exec -T db psql -U "$DB_USER" "$DB_NAME"
