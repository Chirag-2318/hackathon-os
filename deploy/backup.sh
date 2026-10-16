#!/usr/bin/env bash
# ==============================================================================
# backup.sh — Database and uploads volume backup with 7-day retention
# ==============================================================================

set -euo pipefail

BACKUP_DIR="/opt/hackathon-os/backups"
TIMESTAMP="$(date -u +'%Y%m%d_%H%M%SZ')"
DB_CONTAINER="hackathon-os-postgres"
DB_USER="hackathon"
DB_NAME="hackathon_os"

mkdir -p "${BACKUP_DIR}"

DB_BACKUP_FILE="${BACKUP_DIR}/db_${TIMESTAMP}.dump"
UPLOADS_BACKUP_FILE="${BACKUP_DIR}/uploads_${TIMESTAMP}.tar.gz"

echo "==> Starting backup at ${TIMESTAMP}..."

# 1. Database pg_dump (custom format -Fc, automatically compressed)
echo "==> Dumping PostgreSQL database ${DB_NAME} to ${DB_BACKUP_FILE}..."
docker exec "${DB_CONTAINER}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" -Fc > "${DB_BACKUP_FILE}"

if [ ! -s "${DB_BACKUP_FILE}" ]; then
  echo "Error: Database dump is empty or failed!" >&2
  rm -f "${DB_BACKUP_FILE}"
  exit 1
fi
echo "==> Database dump completed successfully ($(du -h "${DB_BACKUP_FILE}" | cut -f1))."

# 2. Archive uploads volume
echo "==> Archiving uploads volume to ${UPLOADS_BACKUP_FILE}..."
# Mount the uploads_data volume into a temporary alpine container to produce a clean tar.gz
docker run --rm \
  -v deploy_uploads_data:/volume_data:ro \
  -v "${BACKUP_DIR}:/backup_dest" \
  alpine:latest \
  tar -czf "/backup_dest/uploads_${TIMESTAMP}.tar.gz" -C /volume_data .

if [ ! -s "${UPLOADS_BACKUP_FILE}" ]; then
  echo "Error: Uploads archive is empty or failed!" >&2
  rm -f "${UPLOADS_BACKUP_FILE}"
  exit 1
fi
echo "==> Uploads volume backup completed ($(du -h "${UPLOADS_BACKUP_FILE}" | cut -f1))."

# 3. Prune old backups, keeping the 7 newest of each
echo "==> Pruning backups older than the 7 newest..."
# Keep 7 newest database dumps
(cd "${BACKUP_DIR}" && ls -t db_*.dump 2>/dev/null | tail -n +8 | xargs -r rm -f)
# Keep 7 newest upload tars
(cd "${BACKUP_DIR}" && ls -t uploads_*.tar.gz 2>/dev/null | tail -n +8 | xargs -r rm -f)

echo "==> Backup process completed successfully at $(date -u +'%Y%m%d_%H%M%SZ')."
