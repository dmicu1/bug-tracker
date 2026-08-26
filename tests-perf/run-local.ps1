param(
  [string]$BaseUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"

$reportDir = Join-Path $PSScriptRoot "k6-report"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$healthUrl = "$BaseUrl/api/health"

try {
  Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 5 | Out-Null
} catch {
  Write-Host @"
Backend is not reachable at $healthUrl.

Start it from the repository root with Docker:
  docker compose up --build -d backend

Or start it from another PowerShell window:
  cd ..\bugtracker-backend
  `$env:DB_PATH = "`$env:TEMP\bugtracker-perf.db"
  go run .\cmd\bugtracker
"@
  exit 1
}

$env:BASE_URL = $BaseUrl
k6 run (Join-Path $PSScriptRoot "script.js")
exit $LASTEXITCODE
