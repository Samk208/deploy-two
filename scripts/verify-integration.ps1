#!/usr/bin/env pwsh

<#
.SYNOPSIS
    One-click verification sequence for both frozen and unfrozen states

.DESCRIPTION
    Tests the integration in both states:
    1. Unfrozen: all 4 flags false, expects non-423 for writes
    2. Frozen: all 4 flags true, expects 423 for writes
    
    Outputs a summary table showing pass/fail for each state.

.NOTES
    Run from project root: .\scripts\verify-integration.ps1
#>

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Integration Verification - Freeze States Test" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$workspaceRoot = Join-Path -Path $PSScriptRoot -ChildPath ".."
$envFile = Join-Path -Path $workspaceRoot -ChildPath ".env.local"

if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env.local not found at: $envFile" -ForegroundColor Red
    Write-Host "Please create .env.local with freeze flag variables" -ForegroundColor Yellow
    exit 1
}

function Set-FreezeState {
    param(
        [bool]$CoreFreeze,
        [bool]$ShopsFreeze
    )
    
    $coreFreezeStr = if ($CoreFreeze) { "true" } else { "false" }
    $shopsFreezeStr = if ($ShopsFreeze) { "true" } else { "false" }
    
    $env:CORE_FREEZE = $coreFreezeStr
    $env:NEXT_PUBLIC_CORE_FREEZE = $coreFreezeStr
    $env:SHOPS_FREEZE = $shopsFreezeStr
    $env:NEXT_PUBLIC_SHOPS_FREEZE = $shopsFreezeStr
    
    # Also update .env.local for persistence
    $content = Get-Content $envFile
    $updated = $content | ForEach-Object {
        if ($_ -match '^\s*CORE_FREEZE\s*=') {
            "CORE_FREEZE=$coreFreezeStr"
        }
        elseif ($_ -match '^\s*NEXT_PUBLIC_CORE_FREEZE\s*=') {
            "NEXT_PUBLIC_CORE_FREEZE=$coreFreezeStr"
        }
        elseif ($_ -match '^\s*SHOPS_FREEZE\s*=') {
            "SHOPS_FREEZE=$shopsFreezeStr"
        }
        elseif ($_ -match '^\s*NEXT_PUBLIC_SHOPS_FREEZE\s*=') {
            "NEXT_PUBLIC_SHOPS_FREEZE=$shopsFreezeStr"
        }
        else {
            $_
        }
    }
    $updated | Set-Content $envFile
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Test 1: Unfrozen State
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write-Host "📝 Test 1: Unfrozen State (all flags = false)" -ForegroundColor Green
Write-Host "Setting freeze flags to FALSE..." -ForegroundColor Gray

Set-FreezeState -CoreFreeze $false -ShopsFreeze $false

Write-Host "Running smoke tests..." -ForegroundColor Gray
Write-Host ""

$smokeScript = Join-Path -Path $PSScriptRoot -ChildPath "integration-smoke.ps1"
& $smokeScript

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Unfrozen state tests FAILED" -ForegroundColor Red
    $unfrozenPassed = $false
}
else {
    Write-Host ""
    Write-Host "✅ Unfrozen state tests PASSED" -ForegroundColor Green
    $unfrozenPassed = $true
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Test 2: Frozen State
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write-Host "📝 Test 2: Frozen State (all flags = true)" -ForegroundColor Yellow
Write-Host "Setting freeze flags to TRUE..." -ForegroundColor Gray

Set-FreezeState -CoreFreeze $true -ShopsFreeze $true

Write-Host "Running smoke tests..." -ForegroundColor Gray
Write-Host ""

& $smokeScript

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Frozen state tests FAILED" -ForegroundColor Red
    $frozenPassed = $false
}
else {
    Write-Host ""
    Write-Host "✅ Frozen state tests PASSED" -ForegroundColor Green
    $frozenPassed = $true
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Summary Table
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write-Host "📊 Verification Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$table = @()
$table += [PSCustomObject]@{
    "State" = "Unfrozen (flags=false)"
    "Result" = if ($unfrozenPassed) { "✅ PASS" } else { "❌ FAIL" }
    "Expected" = "Reads 200, Writes non-423"
}
$table += [PSCustomObject]@{
    "State" = "Frozen (flags=true)"
    "Result" = if ($frozenPassed) { "✅ PASS" } else { "❌ FAIL" }
    "Expected" = "Reads 200, Writes 423"
}

$table | Format-Table -AutoSize

Write-Host ""

if ($unfrozenPassed -and $frozenPassed) {
    Write-Host "🎉 All verification tests PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Integration is ready for deployment." -ForegroundColor Green
    Write-Host "Freeze system is working correctly in both states." -ForegroundColor Green
    Write-Host ""
    
    # Restore to unfrozen state
    Write-Host "Restoring to unfrozen state..." -ForegroundColor Gray
    Set-FreezeState -CoreFreeze $false -ShopsFreeze $false
    
    exit 0
}
else {
    Write-Host "⚠️  Some tests FAILED" -ForegroundColor Red
    Write-Host ""
    
    if (-not $unfrozenPassed) {
        Write-Host "Unfrozen state issues:" -ForegroundColor Yellow
        Write-Host "- Check if reads return 200" -ForegroundColor Yellow
        Write-Host "- Verify writes are not blocked (non-423)" -ForegroundColor Yellow
    }
    
    if (-not $frozenPassed) {
        Write-Host "Frozen state issues:" -ForegroundColor Yellow
        Write-Host "- Verify middleware enforces 423 for writes" -ForegroundColor Yellow
        Write-Host "- Check if reads still return 200" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Review the test output above for details." -ForegroundColor Yellow
    Write-Host ""
    
    # Restore to unfrozen state
    Write-Host "Restoring to unfrozen state..." -ForegroundColor Gray
    Set-FreezeState -CoreFreeze $false -ShopsFreeze $false
    
    exit 1
}
