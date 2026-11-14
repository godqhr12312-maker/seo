@echo off
chcp 65001 >nul
cd /d "%~dp0"
powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "$root=(Get-Location).Path; $port=52140; $url='http://localhost:'+$port+'/';" ^
  "function Ready { try { (Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 1).StatusCode -eq 200 } catch { $false } }" ^
  "if (-not (Ready)) {" ^
  "  $node=(Get-Command node.exe -ErrorAction SilentlyContinue).Source;" ^
  "  if (-not $node) { Write-Host 'Node.js is required. Install from https://nodejs.org then try again.'; Read-Host 'Press Enter to close'; exit 1 }" ^
  "  Start-Process -FilePath $node -ArgumentList 'admin-server.mjs',\"$port\" -WorkingDirectory $root -WindowStyle Hidden;" ^
  "  $deadline=(Get-Date).AddSeconds(20);" ^
  "  while (-not (Ready)) { if ((Get-Date) -ge $deadline) { Write-Host 'Admin server failed to start on port 52140.'; Read-Host 'Press Enter to close'; exit 1 }; Start-Sleep -Milliseconds 300 }" ^
  "}" ^
  "Start-Process $url"
