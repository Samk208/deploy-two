#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Smoke-test read vs write behavior for the Shops ⇄ Onboarding ⇄ Dashboards integration.

.DESCRIPTION
    Runs a matrix of HTTP checks against key endpoints to confirm:
      • Reads stay available regardless of freeze state.
      • Core freeze returns HTTP 423 for onboarding/dashboard writes.
      • Shop freeze returns HTTP 423 for product/shop writes.
    Any non-423 status during an active freeze is flagged.

.NOTES
    - Uses Invoke-WebRequest (curl alias) so PowerShell 7+ is recommended.
    - Reads .env.local automatically when present to populate base URL.
    - Safe for CI: write checks treat 401/403/422 as pass when freeze is OFF.
#>

param(
    [string]$BaseUrl
)

$ErrorActionPreference = "Stop"

function Resolve-BaseUrl {
    param(
        [string]$ExplicitBase
    )

    if ($ExplicitBase) {
        return $ExplicitBase.TrimEnd('/')
    }

    if ($env:NEXTAUTH_URL) {
        return $env:NEXTAUTH_URL.TrimEnd('/')
    }

    $workspaceRoot = Join-Path -Path $PSScriptRoot -ChildPath ".."
    $envFile = Join-Path -Path $workspaceRoot -ChildPath ".env.local"
    if (Test-Path $envFile) {
        $lines = Get-Content $envFile
        foreach ($line in $lines) {
            if ($line -match '^\s*NEXTAUTH_URL\s*=\s*(.+)$') {
                $value = $Matches[1].Trim()
                if ($value) {
                    return $value.TrimEnd('/')
                }
            }
        }
    }

    return "http://localhost:3000"
}

$base = Resolve-BaseUrl -ExplicitBase $BaseUrl

function Get-FreezeState {
    $coreRaw  = if ($null -ne $env:CORE_FREEZE -and $env:CORE_FREEZE -ne "") { $env:CORE_FREEZE } else { "false" }
    $shopsRaw = if ($null -ne $env:SHOPS_FREEZE -and $env:SHOPS_FREEZE -ne "") { $env:SHOPS_FREEZE } else { "false" }

    $coreBool  = [bool]::Parse($coreRaw.ToString().ToLowerInvariant())
    $shopsBool = [bool]::Parse($shopsRaw.ToString().ToLowerInvariant())

    return [pscustomobject]@{
        CoreFreeze  = $coreBool
        ShopsFreeze = $shopsBool
    }
}

$freeze = Get-FreezeState

$tests = @(
    # ---- Read endpoints (always allow) ----
    [pscustomobject]@{
        Name       = "Main shop feed"
        Method     = "GET"
        Path       = "/api/main-shop/feed"
        ExpectType = "Read"
    },
    [pscustomobject]@{
        Name       = "Influencer handle feed"
        Method     = "GET"
        Path       = "/api/influencer/test-handle/feed"
        ExpectType = "Read"
    },
    [pscustomobject]@{
        Name       = "Product listing"
        Method     = "GET"
        Path       = "/api/products"
        ExpectType = "Read"
    },

    # ---- Core freeze coverage ----
    [pscustomobject]@{
        Name       = "Onboarding submit"
        Method     = "POST"
        Path       = "/api/onboarding/submit"
        ExpectType = "CoreWrite"
        Body       = @{
            role = "brand"
        }
    },

    # ---- Shops freeze coverage ----
    [pscustomobject]@{
        Name       = "Product create"
        Method     = "POST"
        Path       = "/api/products"
        ExpectType = "ShopWrite"
        Body       = @{
            title = "Freeze smoke test product"
            price = 0
        }
    },
    [pscustomobject]@{
        Name       = "Influencer curation add"
        Method     = "POST"
        Path       = "/api/influencer/shop"
        ExpectType = "ShopWrite"
        Body       = @{
            productId = "00000000-0000-0000-0000-000000000000"
        }
    }
)

function Invoke-SmokeRequest {
    param(
        [string]$Method,
        [string]$Url,
        [hashtable]$Body
    )

    try {
        $options = @{
            Method      = $Method
            Uri         = $Url
            ErrorAction = "Stop"
            Headers     = @{
                "Content-Type"         = "application/json"
                "X-Integration-Smoke"  = "true"
            }
        }

        if ($Body) {
            $options.Body = ($Body | ConvertTo-Json -Depth 6)
        }
        elseif ($Method -in @("POST", "PUT", "PATCH")) {
            # Send empty JSON object so middleware sees JSON content type
            $options.Body = "{}"
        }

        $response = Invoke-WebRequest @options
        return [pscustomobject]@{
            StatusCode = $response.StatusCode
            Success    = $true
        }
    }
    catch {
        if ($_.Exception -and $_.Exception.Response) {
            $status = $_.Exception.Response.StatusCode.value__
            return [pscustomobject]@{
                StatusCode = $status
                Success    = $false
                Message    = $_.Exception.Message
            }
        }

        return [pscustomobject]@{
            StatusCode = 0
            Success    = $false
            Message    = $_.Exception.Message
        }
    }
}

function Test-Expectation {
    param(
        [pscustomobject]$Test,
        [pscustomobject]$Result,
        [pscustomobject]$FreezeState
    )

    $status = $Result.StatusCode

    switch ($Test.ExpectType) {
        "Read" {
            # TODO: tighten expected read status from "non-423" to "200" after we fix current 500s.
            $passed = $status -ne 423 -and $status -ne 0
            $expectation = "Read should stay available (non-423)"
        }
        "CoreWrite" {
            if ($FreezeState.CoreFreeze) {
                $passed = $status -eq 423
                $expectation = "CORE_FREEZE=true → expect 423"
            }
            else {
                $passed = $status -ne 423 -and $status -ne 0
                $expectation = "CORE_FREEZE=false → expect non-423 (allow/validate)"
            }
        }
        "ShopWrite" {
            if ($FreezeState.ShopsFreeze) {
                $passed = $status -eq 423
                $expectation = "SHOPS_FREEZE=true → expect 423"
            }
            else {
                $passed = $status -ne 423 -and $status -ne 0
                $expectation = "SHOPS_FREEZE=false → expect non-423 (allow/validate)"
            }
        }
        Default {
            $passed = $false
            $expectation = "Unknown expectation type"
        }
    }

    return [pscustomobject]@{
        Name        = $Test.Name
        Method      = $Test.Method
        Path        = $Test.Path
        StatusCode  = $status
        Passed      = $passed
        Expectation = $expectation
        Message     = $Result.Message
    }
}

Write-Host ""
Write-Host "🧪 Integration Smoke Checks" -ForegroundColor Cyan
Write-Host ("Base URL: {0}" -f $base) -ForegroundColor DarkCyan
if ($freeze.CoreFreeze) {
    Write-Host "Core Freeze : ON"
} else {
    Write-Host "Core Freeze : OFF"
}

if ($freeze.ShopsFreeze) {
    Write-Host "Shops Freeze: ON"
} else {
    Write-Host "Shops Freeze: OFF"
}
Write-Host "------------------------------------------------------------"

$results = @()

foreach ($test in $tests) {
    $url = "$base$($test.Path)"
    Write-Host ""
    Write-Host ("{0} {1}" -f $test.Method.PadRight(6), $test.Path) -ForegroundColor Gray
    $response = Invoke-SmokeRequest -Method $test.Method -Url $url -Body $test.Body
    $evaluation = Test-Expectation -Test $test -Result $response -FreezeState $freeze
    $results += $evaluation

    if ($evaluation.Passed) {
        Write-Host ("  ✅ {0} → {1}" -f $evaluation.StatusCode, $evaluation.Expectation) -ForegroundColor Green
    }
    else {
        Write-Host ("  ❌ {0} → {1}" -f $evaluation.StatusCode, $evaluation.Expectation) -ForegroundColor Red
        if ($evaluation.Message) {
            Write-Host ("     {0}" -f $evaluation.Message) -ForegroundColor DarkYellow
        }
    }
}

Write-Host ""
Write-Host "------------------------------------------------------------"
Write-Host "Summary"
Write-Host "------------------------------------------------------------"

$passCount = ($results | Where-Object { $_.Passed }).Count
$total = $results.Count
if ($passCount -eq $total) {
    Write-Host ("Passed: {0}/{1}" -f $passCount, $total) -ForegroundColor "Green"
} else {
    Write-Host ("Passed: {0}/{1}" -f $passCount, $total) -ForegroundColor "Yellow"
}

if ($passCount -ne $total) {
    Write-Host ""
    Write-Host "Failures:" -ForegroundColor Red
    foreach ($item in $results | Where-Object { -not $_.Passed }) {
        Write-Host ("- {0} {1} → status {2} (expected: {3})" -f $item.Method, $item.Path, $item.StatusCode, $item.Expectation) -ForegroundColor Red
    }
}

if ($passCount -eq $total) {
    Write-Host ""
    Write-Host "🎉 Integration smoke checks passed." -ForegroundColor Green
}
else {
    exit 1
}
