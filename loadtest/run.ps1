<#
.SYNOPSIS
Brackit Load Testing Automation Script for Windows PowerShell
.EXAMPLE
.\loadtest\run.ps1 all 512mb
#>

param(
    [string]$Scenario = "all",
    [string]$Profile = "512mb",
    [string]$TargetUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host " Starting Brackit Load Test: Scenario=$Scenario, Profile=$Profile" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

switch ($Profile.ToLower()) {
    "512mb" {
        $env:LOADTEST_MEM_LIMIT = "512M"
        $env:LOADTEST_CPU_LIMIT = "0.5"
    }
    "1gb" {
        $env:LOADTEST_MEM_LIMIT = "1024M"
        $env:LOADTEST_CPU_LIMIT = "1.0"
    }
    "2gb" {
        $env:LOADTEST_MEM_LIMIT = "2048M"
        $env:LOADTEST_CPU_LIMIT = "2.0"
    }
    Default {
        Write-Host "Unknown profile: $Profile. Defaulting to 512mb." -ForegroundColor Yellow
        $env:LOADTEST_MEM_LIMIT = "512M"
        $env:LOADTEST_CPU_LIMIT = "0.5"
    }
}

$env:POSTGRES_MAX_CONNECTIONS = "50"
$env:DB_POOL_SIZE = "10"
$env:TARGET_URL = $TargetUrl

# Check if target is running
$backendReady = $false
try {
    $res = Invoke-RestMethod -Uri "$TargetUrl/api/v1/health" -Method Get -TimeoutSec 2
    if ($res.status -eq "ok") {
        $backendReady = $true
        Write-Host "Detected live backend at $TargetUrl. Running test suite directly..." -ForegroundColor Green
    }
} catch {
    $backendReady = $false
}

if (-not $backendReady) {
    Write-Host "Bringing up Render-equivalent loadtest environment with Docker Compose..." -ForegroundColor Yellow
    docker compose -f docker-compose.loadtest.yml up -d --build postgres mock-llm backend

    Write-Host "Waiting for backend to become ready..." -ForegroundColor Yellow
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 2
        try {
            $check = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/health" -Method Get -TimeoutSec 2
            if ($check.status -eq "ok") {
                $backendReady = $true
                Write-Host "Backend is ready!" -ForegroundColor Green
                break
            }
        } catch {}
    }

    if (-not $backendReady) {
        Write-Error "Backend failed to become healthy within 60s"
        exit 1
    }

    node loadtest/run.mjs $Scenario $Profile
    docker compose -f docker-compose.loadtest.yml down
} else {
    node loadtest/run.mjs $Scenario $Profile
}

Write-Host "Load test execution completed." -ForegroundColor Green

