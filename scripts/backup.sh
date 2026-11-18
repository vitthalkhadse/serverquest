#!/usr/bin/env bash
# Raat ka DB backup. Cron: 0 2 * * * /path/to/serverquest/scripts/backup.sh
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a
mkdir -p backups
FILE="backups/db_$(date +%F_%H%M).sql.gz"
docker compose exec -T db pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$FILE"
find backups -name "db_*.sql.gz" -mtime +7 -delete   # 7 din se purane delete
echo "Backup done: $FILE"
