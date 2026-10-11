param (
    [Parameter(Mandatory = $true)]
    [string]$BackupFile
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    Write-Error "Backup file $BackupFile does not exist."
    exit 1
}

$DbHost = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DbPort = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$DbUser = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }
$DbName = if ($env:DB_NAME) { $env:DB_NAME } else { "hackathon_os" }
$env:PGPASSWORD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "postgres" }

Write-Host "Restoring database $DbName from $BackupFile..."
psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $BackupFile

Write-Host "Database restore completed successfully."
