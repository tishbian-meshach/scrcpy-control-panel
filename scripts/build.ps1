# Scrcpy Control Center - Build Script
# Run this script to create a production build

$ErrorActionPreference = "Stop"

Write-Host "🏗️  Building Scrcpy Control Center for Windows x64..." -ForegroundColor Cyan
Write-Host ""

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
$binariesOk = $true
if (-not (Test-Path "binaries/adb.exe")) {
    Write-Host "❌ Missing: binaries/adb.exe" -ForegroundColor Red
    $binariesOk = $false
}
if (-not (Test-Path "binaries/scrcpy.exe")) {
    Write-Host "❌ Missing: binaries/scrcpy.exe" -ForegroundColor Red
    $binariesOk = $false
}

if (-not $binariesOk) {
    Write-Host ""
    Write-Host "⚠️  Required binaries are missing. The app will not function properly." -ForegroundColor Yellow
    Write-Host "   Please download and place in the binaries folder:" -ForegroundColor Yellow
    Write-Host "   - scrcpy: https://github.com/Genymobile/scrcpy/releases" -ForegroundColor Cyan
    Write-Host "   - adb: https://developer.android.com/tools/releases/platform-tools" -ForegroundColor Cyan
    Write-Host ""
    
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Build cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Create build folder if needed
if (-not (Test-Path "build")) {
    New-Item -ItemType Directory -Path "build" | Out-Null
}

# Run the build
Write-Host "🔨 Compiling TypeScript and bundling..." -ForegroundColor Green
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
    Write-Host "   Output: release/" -ForegroundColor Cyan
    Write-Host ""
    
    # List the built files
    if (Test-Path "release") {
        Write-Host "📁 Built files:" -ForegroundColor Cyan
        Get-ChildItem "release" -Recurse -File | ForEach-Object {
            Write-Host "   $($_.FullName)" -ForegroundColor Gray
        }
    }
} else {
    Write-Host ""
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
