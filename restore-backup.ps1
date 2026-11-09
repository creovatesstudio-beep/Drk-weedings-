# ============================================================================
# THE DRK WEDDINGS CRM — 1-SECOND INSTANT UNDO / RESTORE SCRIPT
# Restores the entire project from _backup_v1_original
# ============================================================================
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backupDir = Join-Path $root "_backup_v1_original"

if (-not (Test-Path $backupDir)) {
  Write-Error "Backup folder _backup_v1_original not found!"
  exit 1
}

Remove-Item -Recurse -Force (Join-Path $root "src") -ErrorAction SilentlyContinue
Copy-Item -Path (Join-Path $backupDir "src") -Destination (Join-Path $root "src") -Recurse -Force
Copy-Item -Path (Join-Path $backupDir "public") -Destination (Join-Path $root "public") -Recurse -Force
Copy-Item -Path (Join-Path $backupDir "supabase") -Destination (Join-Path $root "supabase") -Recurse -Force
Copy-Item -Path (Join-Path $backupDir "index.html") -Destination (Join-Path $root "index.html") -Force
Copy-Item -Path (Join-Path $backupDir "package.json") -Destination (Join-Path $root "package.json") -Force
Copy-Item -Path (Join-Path $backupDir "tailwind.config.js") -Destination (Join-Path $root "tailwind.config.js") -Force
Copy-Item -Path (Join-Path $backupDir "vite.config.ts") -Destination (Join-Path $root "vite.config.ts") -Force
Copy-Item -Path (Join-Path $backupDir "tsconfig.json") -Destination (Join-Path $root "tsconfig.json") -Force

Write-Host "Restored THE DRK WEDDINGS CRM to original v1 state in 1 second!" -ForegroundColor Green
