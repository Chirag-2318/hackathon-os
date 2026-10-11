$ErrorActionPreference = "Stop"

$BackupDir = if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { "./backups" }
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$Timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
$Filename = Join-Path $BackupDir "hackathon_os_$Timestamp.sql"

$DbHost = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DbPort = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$DbUser = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }
$DbName = if ($env:DB_NAME) { $env:DB_NAME } else { "hackathon_os" }
$env:PGPASSWORD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "postgres" }

Write-Host "Starting database backup for $DbName on $DbHost:$DbPort..."
pg_dump -h $DbHost -p $DbPort -U $DbUser -d $DbName --no-owner --no-privileges -f $Filename

Write-Host "Backup created successfully at $Filename"
