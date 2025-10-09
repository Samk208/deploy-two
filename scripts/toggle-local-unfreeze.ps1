#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Temporarily unfreezes all environment flags for local testing.

.DESCRIPTION
    This script saves your current .env.local freeze settings, sets all freezes
    to false, starts pnpm dev, and automatically restores freeze settings when
    you press Ctrl+C or exit.

    ⚠️ WARNING: This allows write operations to onboarding, dashboards, shops,
    and products. Use with caution and in controlled sessions only.

.EXAMPLE
    pwsh ./scripts/toggle-local-unfreeze.ps1
#>

$ErrorActionPreference = "Stop"

$ENV_FILE = Join-Path $PSScriptRoot ".." ".env.local"
$BACKUP_FILE = Join-Path $PSScriptRoot ".." ".env.local.freeze-backup"

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
Write-Host "⚠️  UNFREEZE SESSION - WRITES ARE ENABLED" -ForegroundColor Red
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
Write-Host ""
Write-Host "  This script will:" -ForegroundColor Yellow
Write-Host "    1. Backup your current .env.local" -ForegroundColor Yellow
Write-Host "    2. Set ALL freezes to false (CORE, SHOPS, DRY_RUN)" -ForegroundColor Yellow
Write-Host "    3. Start pnpm dev" -ForegroundColor Yellow
Write-Host "    4. Restore freezes when you exit (Ctrl+C)" -ForegroundColor Yellow
Write-Host ""
Write-Host "  ⚠️  Database writes will be ACTIVE during this session!" -ForegroundColor Red
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path $ENV_FILE)) {
    Write-Host "❌ Error: .env.local not found at $ENV_FILE" -ForegroundColor Red
    Write-Host "   Please create .env.local from .env.example first." -ForegroundColor Yellow
    exit 1
}

# Backup current env file
Write-Host "📦 Backing up current .env.local..." -ForegroundColor Cyan
Copy-Item $ENV_FILE $BACKUP_FILE -Force
Write-Host "   ✅ Backup saved to .env.local.freeze-backup" -ForegroundColor Green
Write-Host ""

# Read current env file
$envContent = Get-Content $ENV_FILE -Raw

# Replace freeze flags (or add them if they don't exist)
$envContent = $envContent -replace '(?m)^CORE_FREEZE=.*$', 'CORE_FREEZE=false'
$envContent = $envContent -replace '(?m)^NEXT_PUBLIC_CORE_FREEZE=.*$', 'NEXT_PUBLIC_CORE_FREEZE=false'
$envContent = $envContent -replace '(?m)^SHOPS_FREEZE=.*$', 'SHOPS_FREEZE=false'
$envContent = $envContent -replace '(?m)^NEXT_PUBLIC_SHOPS_FREEZE=.*$', 'NEXT_PUBLIC_SHOPS_FREEZE=false'
$envContent = $envContent -replace '(?m)^DRY_RUN_ONBOARDING=.*$', 'DRY_RUN_ONBOARDING=false'

# Add flags if they don't exist
if ($envContent -notmatch 'CORE_FREEZE=') {
    $envContent += "`n`n# Freeze Flags (Unfrozen)`nCORE_FREEZE=false`n"
}
if ($envContent -notmatch 'NEXT_PUBLIC_CORE_FREEZE=') {
    $envContent += "NEXT_PUBLIC_CORE_FREEZE=false`n"
}
if ($envContent -notmatch 'SHOPS_FREEZE=') {
    $envContent += "SHOPS_FREEZE=false`n"
}
if ($envContent -notmatch 'NEXT_PUBLIC_SHOPS_FREEZE=') {
    $envContent += "NEXT_PUBLIC_SHOPS_FREEZE=false`n"
}
if ($envContent -notmatch 'DRY_RUN_ONBOARDING=') {
    $envContent += "DRY_RUN_ONBOARDING=false`n"
}

# Write updated env file
Set-Content $ENV_FILE $envContent -NoNewline

Write-Host "🔓 Freeze flags set to false:" -ForegroundColor Yellow
Write-Host "   CORE_FREEZE=false" -ForegroundColor Yellow
Write-Host "   NEXT_PUBLIC_CORE_FREEZE=false" -ForegroundColor Yellow
Write-Host "   SHOPS_FREEZE=false" -ForegroundColor Yellow
Write-Host "   NEXT_PUBLIC_SHOPS_FREEZE=false" -ForegroundColor Yellow
Write-Host "   DRY_RUN_ONBOARDING=false" -ForegroundColor Yellow
Write-Host ""

# Function to restore freeze settings
function Restore-Freeze {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "🔒 Restoring freeze settings..." -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green

    if (Test-Path $BACKUP_FILE) {
        Copy-Item $BACKUP_FILE $ENV_FILE -Force
        Remove-Item $BACKUP_FILE -Force
        Write-Host "   ✅ Freeze settings restored from backup" -ForegroundColor Green
        Write-Host "   🔒 System is FROZEN again. Writes are blocked." -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Backup file not found. Please manually set freeze flags." -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "   Thank you for using the controlled unfreeze session!" -ForegroundColor Cyan
    Write-Host ""
}

# Register cleanup on exit
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Restore-Freeze
}

# Trap Ctrl+C
try {
    Write-Host "🚀 Starting pnpm dev (unfrozen mode)..." -ForegroundColor Cyan
    Write-Host "   Press Ctrl+C to exit and restore freezes." -ForegroundColor Cyan
    Write-Host ""

    # Start pnpm dev
    pnpm dev

} finally {
    Restore-Freeze
}
