param(
  [Parameter(Mandatory=$true)] [string]$Destination
)

# Export Auth + Onboarding into a standalone folder without modifying source
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\scripts\export-auth-onboarding.ps1 -Destination "C:\temp\auth-onboarding-starter"

$ErrorActionPreference = 'Stop'

function New-DirIfMissing([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

function Copy-Rel([string]$RelPath) {
  $src = Join-Path -Path $PSScriptRoot -ChildPath "..\$RelPath" | Resolve-Path -Relative:$false -ErrorAction SilentlyContinue
  if (-not $src) { return }
  $src = $src.ToString()
  $dst = Join-Path -Path $Destination -ChildPath $RelPath
  $dstDir = Split-Path -Parent $dst
  New-DirIfMissing $dstDir

  if (Test-Path -LiteralPath $src -PathType Container) {
    Copy-Item -LiteralPath $src -Destination $dst -Recurse -Force
  } elseif (Test-Path -LiteralPath $src -PathType Leaf) {
    Copy-Item -LiteralPath $src -Destination $dst -Force
  }
}

Write-Host "Exporting to $Destination" -ForegroundColor Cyan
New-DirIfMissing $Destination

# Core pages and APIs
$paths = @(
  # Auth pages
  'app\(auth)\sign-in',
  'app\(auth)\sign-up',
  'app\(auth)\reset',
  'app\(auth)\update-password',
  
  # Onboarding UI
  'app\auth\onboarding',

  # Auth API
  'app\api\auth\sign-in',
  'app\api\auth\sign-up',
  'app\api\auth\reset',
  'app\api\auth\callback', # optional

  # Onboarding APIs
  'app\api\onboarding\brand',
  'app\api\onboarding\influencer',
  'app\api\onboarding\check-handle',
  'app\api\onboarding\send-otp',
  'app\api\onboarding\verify-otp',
  'app\api\onboarding\progress',
  'app\api\onboarding\step-1',
  'app\api\onboarding\step-2',
  'app\api\onboarding\step-3',
  'app\api\onboarding\step-4',
  'app\api\onboarding\submit',
  'app\api\onboarding\docs',
  'app\api\onboarding\docs\[id]' # optional
)

# Libraries and hooks
$paths += @(
  'lib\supabase',
  'lib\auth-helpers.ts',
  'lib\auth-context.tsx',
  'lib\storage.ts',
  'lib\validation',
  'lib\validators.ts',
  'lib\utils\api-helpers.ts',
  'lib\types.ts',
  'hooks\use-toast.ts'
)

# UI components (copy full ui set to avoid missing deps)
$paths += @(
  'components\ui',
  'components\client-providers.tsx'
)

# Middleware
$paths += @(
  'middleware.ts',
  'middleware\admin-auth.ts' # optional
)

# Supabase config + migrations
$paths += @(
  'supabase\migrations',
  'supabase\config.toml',
  'supabase\check-schema.sql'
)

# Config and docs
$paths += @(
  'env.example',
  'next.config.mjs',
  'docs\EXTRACT_AUTH_ONBOARDING.md',
  'docs\setup\database-setup.md',
  'ONBOARDING_SCHEMA.md',
  'ONBOARDING_WORKFLOW_FIX.md'
)

foreach ($p in $paths) {
  try {
    Copy-Rel $p
    Write-Host "Copied: $p" -ForegroundColor Green
  } catch {
    Write-Warning "Skipped (not found or error): $p - $($_.Exception.Message)"
  }
}

Write-Host "Export complete." -ForegroundColor Cyan
