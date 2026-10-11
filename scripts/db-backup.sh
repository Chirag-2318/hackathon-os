#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/hackathon_os_${TIMESTAMP}.sql.gz"

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-hackathon_os}"

echo "Starting database backup for $DB_NAME on $DB_HOST:$DB_PORT..."
PGPASSWORD="${DB_PASSWORD:-postgres}" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --no-owner --no-privileges | gzip > "$FILENAME"

echo "Backup created successfully at $FILENAME"
