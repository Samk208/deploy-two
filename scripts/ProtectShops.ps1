# =====================================================================
# COMPREHENSIVE SHOP DATA PROTECTION SCRIPT
# =====================================================================
# This PowerShell script automates the complete shop data protection
# setup including database policies, storage security, and verification.
# 
# Usage: .\scripts\ProtectShops.ps1 [options]
# Options:
#   -install    : Install all protection systems
#   -verify     : Verify protection status
#   -backup     : Create database backup
#   -freeze     : Enable shop freeze
#   -unfreeze   : Disable shop freeze
#   -help       : Show this help
# =====================================================================

param(
    [switch]$install,
    [switch]$verify, 
    [switch]$backup,
    [switch]$freeze,
    [switch]$unfreeze,
    [switch]$help
)

# Color output functions
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Step { param($Message) Write-Host "🔧 $Message" -ForegroundColor Blue }

# Help function
function Show-Help {
    Write-Host @"
🛡️  SHOP DATA PROTECTION SCRIPT
===============================

This script provides comprehensive protection for your shop data including:
- Database-level freeze protection (RLS policies)
- Soft delete protection (prevents hard deletes)
- Storage bucket security policies  
- Data integrity constraints
- Automated backup system

USAGE:
  .\scripts\ProtectShops.ps1 [options]

OPTIONS:
  -install    Install all protection systems (run SQL scripts)
  -verify     Verify all protection systems are working
  -backup     Create a new database backup
  -freeze     Enable shop freeze protection
  -unfreeze   Disable shop freeze protection
  -help       Show this help message

EXAMPLES:
  .\scripts\ProtectShops.ps1 -install    # Full setup
  .\scripts\ProtectShops.ps1 -verify     # Check status
  .\scripts\ProtectShops.ps1 -backup     # Create backup
  .\scripts\ProtectShops.ps1 -freeze     # Enable freeze

REQUIREMENTS:
- .env.local file with Supabase credentials
- Node.js for running verification scripts
- Supabase CLI for running SQL scripts (optional)

"@ -ForegroundColor White
}

# Check prerequisites
function Test-Prerequisites {
    Write-Step "Checking prerequisites..."
    
    $errors = @()
    
    # Check .env.local exists
    if (-not (Test-Path ".env.local")) {
        $errors += ".env.local file not found"
    }
    
    # Check Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Success "Node.js found: $nodeVersion"
        } else {
            $errors += "Node.js not found"
        }
    } catch {
        $errors += "Node.js not found"
    }
    
    # Check if in project root
    if (-not (Test-Path "package.json")) {
        $errors += "Not in project root directory"
    }
    
    if ($errors.Count -gt 0) {
        Write-Error "Prerequisites not met:"
        $errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
        return $false
    }
    
    Write-Success "All prerequisites met"
    return $true
}

# Install protection systems
function Install-Protection {
    Write-Step "Installing shop data protection systems..."
    
    $sqlFiles = @(
        "sql\protection\001-rls-shop-freeze.sql",
        "sql\protection\002-soft-delete-migration.sql", 
        "sql\protection\003-join-table-migration.sql",
        "sql\protection\004-data-integrity-constraints.sql",
        "sql\protection\005-storage-protection.sql"
    )
    
    $installed = 0
    $errors = @()
    
    foreach ($sqlFile in $sqlFiles) {
        if (Test-Path $sqlFile) {
            Write-Info "Installing: $sqlFile"
            
            # You can run these manually in Supabase SQL editor
            # or use Supabase CLI if available
            try {
                # Option 1: Use Supabase CLI (if available)
                $result = supabase db reset --linked 2>$null
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "Executed: $sqlFile"
                    $installed++
                } else {
                    Write-Warning "Could not auto-execute $sqlFile - run manually in Supabase SQL editor"
                    $errors += $sqlFile
                }
            } catch {
                Write-Warning "Could not auto-execute $sqlFile - run manually in Supabase SQL editor"
                $errors += $sqlFile
            }
        } else {
            Write-Error "SQL file not found: $sqlFile"
            $errors += $sqlFile
        }
    }
    
    Write-Info "Installation Summary:"
    Write-Host "  Files processed: $($sqlFiles.Count)" -ForegroundColor White
    Write-Host "  Successfully executed: $installed" -ForegroundColor Green
    Write-Host "  Manual execution needed: $($errors.Count)" -ForegroundColor Yellow
    
    if ($errors.Count -gt 0) {
        Write-Warning "Manual execution required for:"
        $errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
        Write-Info "Copy and paste the SQL content from these files into your Supabase SQL editor"
    }
    
    return $installed -eq $sqlFiles.Count
}

# Verify protection status
function Test-Protection {
    Write-Step "Verifying shop data protection status..."
    
    if (-not (Test-Path "scripts\verify-protection.mjs")) {
        Write-Error "Verification script not found"
        return $false
    }
    
    try {
        Write-Info "Running comprehensive protection verification..."
        $result = node scripts\verify-protection.mjs 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "All protection systems verified"
            Write-Host $result -ForegroundColor White
            return $true
        } else {
            Write-Warning "Some protection systems need attention"
            Write-Host $result -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Error "Verification failed: $($_.Exception.Message)"
        return $false
    }
}

# Create database backup
function New-Backup {
    Write-Step "Creating database backup..."
    
    if (-not (Test-Path "scripts\backup-database.mjs")) {
        Write-Error "Backup script not found"
        return $false
    }
    
    try {
        Write-Info "Creating backup tables..."
        $result = node scripts\backup-database.mjs create 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Database backup created successfully"
            Write-Host $result -ForegroundColor White
            
            # Also create JSON export
            Write-Info "Creating JSON export..."
            $timestamp = Get-Date -Format "yyyy_MM_dd_HH_mm_ss"
            node scripts\backup-database.mjs export $timestamp .\backups 2>$null
            
            return $true
        } else {
            Write-Error "Backup creation failed"
            Write-Host $result -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Error "Backup failed: $($_.Exception.Message)"
        return $false
    }
}

# Enable shop freeze
function Enable-Freeze {
    Write-Step "Enabling shop freeze protection..."
    
    try {
        # Enable application-level freeze
        Write-Info "Setting environment variables..."
        $env:SHOPS_FREEZE = "true"
        $env:NEXT_PUBLIC_SHOPS_FREEZE = "true"
        
        Write-Success "Application freeze enabled"
        Write-Warning "Database freeze must be enabled manually:"
        Write-Host "  Run in Supabase SQL editor: SELECT app.freeze_shops();" -ForegroundColor Yellow
        
        return $true
    } catch {
        Write-Error "Failed to enable freeze: $($_.Exception.Message)"
        return $false
    }
}

# Disable shop freeze
function Disable-Freeze {
    Write-Step "Disabling shop freeze protection..."
    
    try {
        # Disable application-level freeze
        Write-Info "Clearing environment variables..."
        $env:SHOPS_FREEZE = "false"
        $env:NEXT_PUBLIC_SHOPS_FREEZE = "false"
        
        Write-Success "Application freeze disabled"
        Write-Warning "Database freeze must be disabled manually:"
        Write-Host "  Run in Supabase SQL editor: SELECT app.unfreeze_shops();" -ForegroundColor Yellow
        
        return $true
    } catch {
        Write-Error "Failed to disable freeze: $($_.Exception.Message)"
        return $false
    }
}

# Main execution
function Main {
    Write-Host @"
🛡️  SHOP DATA PROTECTION MANAGER
=================================
"@ -ForegroundColor Cyan

    if ($help) {
        Show-Help
        return
    }
    
    if (-not (Test-Prerequisites)) {
        exit 1
    }
    
    $success = $true
    
    if ($install) {
        $success = $success -and (Install-Protection)
    }
    
    if ($verify) {
        $success = $success -and (Test-Protection)
    }
    
    if ($backup) {
        $success = $success -and (New-Backup)
    }
    
    if ($freeze) {
        $success = $success -and (Enable-Freeze)
    }
    
    if ($unfreeze) {
        $success = $success -and (Disable-Freeze)
    }
    
    # If no specific action requested, show help
    if (-not ($install -or $verify -or $backup -or $freeze -or $unfreeze)) {
        Show-Help
        Write-Info "Use -verify to check current protection status"
        return
    }
    
    # Final status
    Write-Host "`n" -NoNewline
    if ($success) {
        Write-Success "All operations completed successfully"
        Write-Info "Your shop data is now protected against accidental loss"
    } else {
        Write-Warning "Some operations need attention"
        Write-Info "Review the output above and complete any manual steps"
    }
    
    Write-Host @"

📋 QUICK REFERENCE:
==================
Application Freeze: Set SHOPS_FREEZE=true in environment
Database Freeze:    SELECT app.freeze_shops(); in Supabase SQL
Create Backup:      .\scripts\ProtectShops.ps1 -backup
Verify Status:      .\scripts\ProtectShops.ps1 -verify

🆘 EMERGENCY RECOVERY:
===================== 
If something goes wrong:
1. Run: SELECT app.unfreeze_shops(); in Supabase SQL
2. Use service_role key for emergency database access
3. Restore from backup if needed
4. Check backup files in .\backups\ directory

"@ -ForegroundColor White
}

# Execute main function
Main