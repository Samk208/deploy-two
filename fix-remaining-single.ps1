# PowerShell script to fix remaining .single() calls
# Run this in PowerShell to complete the TypeScript fixes

Write-Host "🔧 Fixing remaining .single() calls..." -ForegroundColor Green

# Find all files with .single()
$files = Get-ChildItem -Path "app\api" -Filter "*.ts" -Recurse | 
    Select-String -Pattern "\.single\(\)" -List | 
    Select-Object -ExpandProperty Path

if ($files.Count -eq 0) {
    Write-Host "✅ No .single() calls found!" -ForegroundColor Green
} else {
    Write-Host "Found $($files.Count) files with .single() calls:" -ForegroundColor Yellow
    
    foreach ($file in $files) {
        Write-Host "  📝 $file" -ForegroundColor Cyan
        
        # Read file content
        $content = Get-Content $file -Raw
        
        # Replace .single() with .maybeSingle()
        $newContent = $content -replace '\.single\(\)', '.maybeSingle()'
        
        # Write back to file
        Set-Content -Path $file -Value $newContent -NoNewline
        
        Write-Host "    ✓ Replaced .single() with .maybeSingle()" -ForegroundColor Green
    }
    
    Write-Host "`n✅ Fixed $($files.Count) files" -ForegroundColor Green
}

Write-Host "`n🔍 Running type check..." -ForegroundColor Yellow
pnpm typecheck

Write-Host "`n✅ Script complete!" -ForegroundColor Green
