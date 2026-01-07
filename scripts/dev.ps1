# Scrcpy Control Center - Development Script
# Run this script to start the development server

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Scrcpy Control Center in development mode..." -ForegroundColor Cyan

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Check for binaries
if (-not (Test-Path "binaries/adb.exe") -or -not (Test-Path "binaries/scrcpy.exe")) {
    Write-Host "⚠️  Warning: scrcpy.exe and/or adb.exe not found in binaries folder" -ForegroundColor Yellow
    Write-Host "   Device detection and mirroring will not work without these files." -ForegroundColor Yellow
    Write-Host "   Download from:" -ForegroundColor Yellow
    Write-Host "   - scrcpy: https://github.com/Genymobile/scrcpy/releases" -ForegroundColor Cyan
    Write-Host "   - adb: https://developer.android.com/tools/releases/platform-tools" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "🔧 Starting development server..." -ForegroundColor Green
npm run dev
