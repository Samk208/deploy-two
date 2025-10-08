# Alternative method using npx supabase sql
$sqlContent = Get-Content "scripts/fix-influencer-shop-products.sql" -Raw

Write-Host "Executing fix script using Supabase CLI..." -ForegroundColor Green

try {
    # Write SQL content to a temp file and execute
    $tempFile = "temp-fix.sql"
    $sqlContent | Out-File -FilePath $tempFile -Encoding UTF8
    
    # Execute using supabase cli
    npx supabase db push --db-url "postgresql://postgres:UKAlKUCE6v9GixcV@db.mqnwtfbdgcuvqvnloidt.supabase.co:5432/postgres" --include-schema public --include-functions --include-triggers --dry-run=false
    
    Write-Host "`nFix script completed!" -ForegroundColor Green
    Write-Host "Cleaning up temp file..." -ForegroundColor Yellow
    Remove-Item $tempFile -ErrorAction SilentlyContinue
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Remove-Item $tempFile -ErrorAction SilentlyContinue
}