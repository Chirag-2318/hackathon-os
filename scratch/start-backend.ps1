$cmd = Get-Content (Join-Path $PSScriptRoot "backend-cmd.txt") -Raw
# Strip the java executable prefix
$args = $cmd.Substring($cmd.IndexOf("-Dspring.profiles"))
Start-Process -FilePath "C:\Program Files\Eclipse Adoptium\jdk-25.0.4.101-hotspot\bin\java.exe" -ArgumentList $args -WorkingDirectory "c:\Users\Admin\.antigravity\hackathon-os\backend"
