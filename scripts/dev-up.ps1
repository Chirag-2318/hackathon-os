$ErrorActionPreference = "Stop"

Write-Host "======================================================"
Write-Host " Starting [brackit] Production Container Stack     "
Write-Host "======================================================"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "docker is required but not installed or not in PATH."
    exit 1
}

if (-not (Test-Path .env)) {
    if (Test-Path .env.example) {
        Write-Host "Copying .env.example to .env..."
        Copy-Item .env.example .env
    }
}

Write-Host "Building and launching containers via Docker Compose..."
docker compose up --build -d

Write-Host ""
Write-Host "======================================================"
Write-Host " [brackit] services are running:                  "
Write-Host "   App & Reverse Proxy: http://localhost              "
Write-Host "   Direct Backend API:  http://localhost:8080         "
Write-Host "   PostgreSQL Database: localhost:5432 (hackathon_os) "
Write-Host "======================================================"
