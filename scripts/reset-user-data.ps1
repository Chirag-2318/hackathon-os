# scripts/reset-user-data.ps1
# Resets all user-created data in Hackathon OS Postgres container and empties upload dir

$ErrorActionPreference = "Stop"

$ContainerName = if ($env:POSTGRES_CONTAINER) { $env:POSTGRES_CONTAINER } else { "hackathon-os-postgres" }
$DbUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "hackathon" }
$DbName = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "hackathon_os" }
$SqlFile = Join-Path $PSScriptRoot "reset-user-data.sql"

if (-not (Test-Path $SqlFile)) {
    Write-Error "Reset SQL script not found at $SqlFile"
    exit 1
}

Write-Host "Executing database reset against container '$ContainerName' (database: $DbName, user: $DbUser)..."

Get-Content -Raw $SqlFile | docker exec -i $ContainerName psql -U $DbUser -d $DbName

Write-Host "Database reset successfully completed."

# Empty contents of app.upload-dir (preserve the directory itself)
$UploadDirs = @(
    (Join-Path $PSScriptRoot "..\uploads"),
    (Join-Path $PSScriptRoot "..\backend\uploads")
)

foreach ($dir in $UploadDirs) {
    if (Test-Path $dir) {
        Write-Host "Cleaning contents of upload directory: $dir"
        Get-ChildItem -Path $dir -Force | Remove-Item -Recurse -Force
    }
}
Write-Host "Upload directory contents cleared."
