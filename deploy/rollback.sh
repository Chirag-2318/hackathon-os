#!/usr/bin/env bash
# ==============================================================================
# rollback.sh — Restore previous backend image tag and restart container
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

echo "==> Initiating rollback to previous deployment..."

if ! docker image inspect hackathon-os-backend:previous >/dev/null 2>&1; then
  echo "Error: No previous image found (hackathon-os-backend:previous does not exist)." >&2
  exit 1
fi

echo "==> Restoring hackathon-os-backend:previous as latest..."
docker tag hackathon-os-backend:previous hackathon-os-backend:latest

echo "==> Restarting backend container with rolled back image..."
docker compose -f docker-compose.prod.yml up -d --no-build backend

echo "==> Verifying container health..."
MAX_ATTEMPTS=20
ATTEMPT=0
READY=false

while [ "${ATTEMPT}" -lt "${MAX_ATTEMPTS}" ]; do
  STATUS="$(docker inspect --format='{{json .State.Health.Status}}' hackathon-os-backend 2>/dev/null || echo '"starting"')"
  if [ "${STATUS}" = '"healthy"' ]; then
    READY=true
    break
  fi
  sleep 3
  ATTEMPT=$((ATTEMPT + 1))
done

if [ "${READY}" = true ]; then
  echo "==> Rollback succeeded! Backend is healthy."
else
  echo "Warning: Backend did not report healthy within 60s." >&2
fi

echo "==> Last 50 backend container logs:"
docker compose -f docker-compose.prod.yml logs --tail=50 backend
