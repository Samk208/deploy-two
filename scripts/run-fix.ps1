# Run the fix script to link real products to influencer shops
$connectionString = "postgresql://postgres:UKAlKUCE6v9GixcV@db.mqnwtfbdgcuvqvnloidt.supabase.co:5432/postgres"
$sqlFile = "fix-influencer-shop-products.sql"

Write-Host "Executing fix script to link real products to influencer shops..." -ForegroundColor Green

try {
    # Execute the SQL file
    psql $connectionString -f $sqlFile
    
    Write-Host "`nFix script completed successfully!" -ForegroundColor Green
    Write-Host "The influencer shops should now show real products instead of test products." -ForegroundColor Yellow
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Visit http://localhost:3000/shops to see the influencer shops" -ForegroundColor White
    Write-Host "2. Click on individual shops to verify they show real products" -ForegroundColor White
    Write-Host "3. Check that products have proper images and discounts" -ForegroundColor White
}
catch {
    Write-Host "Error executing fix script: $_" -ForegroundColor Red
}