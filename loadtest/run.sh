#!/usr/bin/env bash
# ==============================================================================
# Brackit Load Testing Automation Script
# Usage: ./loadtest/run.sh [scenario|all] [profile 512mb|1gb|2gb]
# Example: ./loadtest/run.sh all 512mb
# ==============================================================================

set -euo pipefail

SCENARIO="${1:-all}"
PROFILE="${2:-512mb}"

echo "================================================================================"
echo " Starting Brackit Load Test: Scenario=$SCENARIO, Profile=$PROFILE"
echo "================================================================================"

# Map memory & CPU limits
case "$PROFILE" in
  "512mb")
    export LOADTEST_MEM_LIMIT="512M"
    export LOADTEST_CPU_LIMIT="0.5"
    ;;
  "1gb")
    export LOADTEST_MEM_LIMIT="1024M"
    export LOADTEST_CPU_LIMIT="1.0"
    ;;
  "2gb")
    export LOADTEST_MEM_LIMIT="2048M"
    export LOADTEST_CPU_LIMIT="2.0"
    ;;
  *)
    echo "Unknown profile: $PROFILE. Defaulting to 512mb."
    export LOADTEST_MEM_LIMIT="512M"
    export LOADTEST_CPU_LIMIT="0.5"
    ;;
esac

export POSTGRES_MAX_CONNECTIONS="50"
export DB_POOL_SIZE="10"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

# Check if target is already running locally on port 8080
if curl -s -f http://localhost:8080/api/v1/health >/dev/null 2>&1; then
  echo "Detected existing running backend at http://localhost:8080. Executing test directly..."
  node loadtest/run.mjs "$SCENARIO" "$PROFILE"
else
  echo "Bringing up Render-equivalent loadtest environment with Docker Compose..."
  docker compose -f docker-compose.loadtest.yml up -d --build postgres mock-llm backend

  echo "Waiting for backend to become ready..."
  for i in {1..60}; do
    if curl -s -f http://localhost:8080/api/v1/health >/dev/null 2>&1; then
      echo "Backend is ready!"
      break
    fi
    sleep 2
  done

  echo "Executing load test suite..."
  node loadtest/run.mjs "$SCENARIO" "$PROFILE"

  echo "Tearing down Docker environment..."
  docker compose -f docker-compose.loadtest.yml down
fi

echo "Load test run finished successfully."
