#!/usr/bin/env pwsh
# PowerShell script to run Claude Cowork on Windows

Write-Host "Starting Claude Cowork on Windows..." -ForegroundColor Green
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Check if dist-electron exists, if not transpile
if (-not (Test-Path "dist-electron")) {
    Write-Host "Transpiling Electron code..." -ForegroundColor Yellow
    npx tsc --project src/electron/tsconfig.json
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to transpile Electron code" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Rebuild native modules for Electron on first run
if (-not (Test-Path ".electron-rebuild-done")) {
    Write-Host "Rebuilding native modules for Electron..." -ForegroundColor Yellow
    npx electron-rebuild
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to rebuild native modules" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    New-Item -Path ".electron-rebuild-done" -ItemType File -Force | Out-Null
}

# Start Vite dev server in background
Write-Host "Starting Vite dev server..." -ForegroundColor Cyan
$viteJob = Start-Job -ScriptBlock { 
    Set-Location $using:PWD
    npm run dev:react 
}

# Wait for Vite to start
Start-Sleep -Seconds 3

# Start Electron app
Write-Host "Starting Electron app..." -ForegroundColor Cyan
$env:NODE_ENV = "development"
npx electron .

# Cleanup on exit
Write-Host "Cleaning up..." -ForegroundColor Yellow
Stop-Job -Job $viteJob -ErrorAction SilentlyContinue
Remove-Job -Job $viteJob -ErrorAction SilentlyContinue
