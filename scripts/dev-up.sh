#!/usr/bin/env bash
set -euo pipefail

echo "======================================================"
echo " Starting [brackit] Production Container Stack     "
echo "======================================================"

if ! command -v docker &> /dev/null; then
    echo "Error: docker is required but not installed."
    exit 1
fi

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "Copying .env.example to .env..."
        cp .env.example .env
    fi
fi

echo "Building and launching containers via Docker Compose..."
docker compose up --build -d

echo ""
echo "======================================================"
echo " [brackit] services are running:                  "
echo "   App & Reverse Proxy: http://localhost              "
echo "   Direct Backend API:  http://localhost:8080         "
echo "   PostgreSQL Database: localhost:5432 (hackathon_os) "
echo "======================================================"
