#!/usr/bin/env bash
# ==============================================================================
# update.sh — Pull latest code, rebuild with zero-downtime healthcheck, tag rollback
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${SCRIPT_DIR}"

echo "==> Preparing deployment update in ${APP_DIR}..."

# 1. Preserve current image as 'previous' for rollback capability
if docker image inspect hackathon-os-backend:latest >/dev/null 2>&1; then
  echo "==> Tagging current running image as hackathon-os-backend:previous..."
  docker tag hackathon-os-backend:latest hackathon-os-backend:previous
fi

# 2. Pull latest git code if inside a git repository
if [ -d "${APP_DIR}/.git" ]; then
  echo "==> Pulling latest repository changes..."
  git -C "${APP_DIR}" fetch --all
  git -C "${APP_DIR}" reset --hard origin/main || git -C "${APP_DIR}" pull --ff-only
fi

# 3. Build and launch updated containers
echo "==> Building and launching updated containers..."
docker compose -f docker-compose.prod.yml up -d --build

# 4. Wait for backend readiness healthcheck
echo "==> Waiting for backend container readiness..."
MAX_ATTEMPTS=30
ATTEMPT=0
READY=false

while [ "${ATTEMPT}" -lt "${MAX_ATTEMPTS}" ]; do
  STATUS="$(docker inspect --format='{{json .State.Health.Status}}' hackathon-os-backend 2>/dev/null || echo '"starting"')"
  if [ "${STATUS}" = '"healthy"' ]; then
    READY=true
    break
  fi
  echo "    Waiting for healthcheck (attempt $((ATTEMPT + 1))/${MAX_ATTEMPTS}, status: ${STATUS})..."
  sleep 3
  ATTEMPT=$((ATTEMPT + 1))
done

if [ "${READY}" = true ]; then
  echo "==> Backend is healthy and ready!"
else
  echo "ERROR: Backend failed to reach healthy state within 90 seconds!" >&2
  echo "==> Last 50 backend container log lines:" >&2
  docker compose -f docker-compose.prod.yml logs --tail=50 backend >&2
  echo "You can rollback immediately by running: ./rollback.sh" >&2
  exit 1
fi

echo "==> Recent application logs (last 50 lines):"
docker compose -f docker-compose.prod.yml logs --tail=50 backend

echo "==> Update successfully completed!"
