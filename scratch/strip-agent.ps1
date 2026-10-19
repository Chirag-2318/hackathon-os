$c = Get-Content (Join-Path $PSScriptRoot "backend-cmd.txt") -Raw
$c = $c -replace '"-javaagent:[^"]+"', ''
[System.IO.File]::WriteAllText((Join-Path $PSScriptRoot "run-backend.bat"), $c, [System.Text.Encoding]::ASCII)
