# ====== ROBUST PRODUCT IMAGE DOWNLOADER ======
# Downloads real product images from multiple sources with fallbacks
# Saves locally first, then optionally uploads to Supabase

# ====== CONFIG ======
$LocalImagePath = "C:\Users\Lenovo\Desktop\Workspce\vo-onelink-google\Main Shop Imp\images"
$SupabaseUrl = "https://mqnwtfbdgcuvqvnloidt.supabase.co"
$Bucket = "product-images"
$ServiceRole = $Env:SUPABASE_SERVICE_ROLE_KEY

# Create local directory if it doesn't exist
if (-not (Test-Path $LocalImagePath)) {
    New-Item -ItemType Directory -Path $LocalImagePath -Force | Out-Null
    Write-Host "Created directory: $LocalImagePath" -ForegroundColor Green
}

# ====== PRODUCT IMAGE SOURCES ======
# Multiple image URLs per product for redundancy
$Products = @(
    @{
        Sku = "SONY-WH1000XM5-BLK"
        Name = "Sony WH-1000XM5 Headphones"
        Folder = "headphones/sony-xm5"
        Images = @(
            @{File="front.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1545127398-14699f92334b?w=1200&h=1200&fit=crop&q=80"
            )},
            @{File="side.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1200&h=1200&fit=crop&q=80"
            )},
            @{File="case.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1577174881658-0f30157d126c?w=1200&h=1200&fit=crop&q=80"
            )}
        )
    },
    @{
        Sku = "BOSE-QC45-BLK"
        Name = "Bose QuietComfort 45"
        Folder = "headphones/bose-qc45"
        Images = @(
            @{File="main.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1528148343865-51218c4a13e6?w=1200&h=1200&fit=crop&q=80"
            )},
            @{File="detail.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1577174881658-0f30157d126c?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=1200&h=1200&fit=crop&q=80"
            )},
            @{File="lifestyle.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1518448144081-38e2005a2b1f?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1200&h=1200&fit=crop&q=80"
            )}
        )
    },
    @{
        Sku = "APPLE-WATCH-S9-ALU"
        Name = "Apple Watch Series 9"
        Folder = "wearables/apple-watch-s9"
        Images = @(
            @{File="front.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=1200&h=1200&fit=crop&q=80"
            )},
            @{File="side.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1510017803434-a899398421b3?w=1200&h=1200&fit=crop&q=80"
            )},
            @{File="detail.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=1200&h=1200&fit=crop&q=80"
            )}
        )
    },
    @{
        Sku = "SAMSUNG-WATCH6-CLASSIC"
        Name = "Samsung Galaxy Watch 6 Classic"
        Folder = "wearables/galaxy-watch6"
        Images = @(
            @{File="main.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=1200&h=1200&fit=crop&q=80"
            )},
            @{File="angle.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1518441902111-a9e9271a7e36?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1617625802912-cdf629f1fe78?w=1200&h=1200&fit=crop&q=80"
            )},
            @{File="lifestyle.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=1200&h=1200&fit=crop&q=80"
            )}
        )
    },
    @{
        Sku = "PD-EVERYDAY-BP-V2"
        Name = "Peak Design Everyday Backpack V2"
        Folder = "accessories/pd-everyday-bp-v2"
        Images = @(
            @{File="front.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?w=1200&h=1200&fit=crop&q=80"
            )},
            @{File="back.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=1200&h=1200&fit=crop&q=80"
            )},
            @{File="detail.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1516383607781-913a19294fd1?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=1200&h=1200&fit=crop&q=80"
            )}
        )
    },
    @{
        Sku = "LOGI-MX-MASTER3S"
        Name = "Logitech MX Master 3S"
        Folder = "peripherals/logi-mx-master3s"
        Images = @(
            @{File="top.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1527814050087-3793815479db?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=1200&h=1200&fit=crop&q=80"
            )},
            @{File="side.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1563297007-0686b7003af7?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&h=1200&fit=crop&q=80"
            )},
            @{File="detail.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1605647540924-852290f6b0d5?w=1200&h=1200&fit=crop&q=80"
            )}
        )
    },
    @{
        Sku = "KEYCHRON-K2-V2"
        Name = "Keychron K2 V2 Keyboard"
        Folder = "peripherals/keychron-k2"
        Images = @(
            @{File="main.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=1200&h=1200&fit=crop&q=80"
            )},
            @{File="angle.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1595225476474-87563907a212?w=1200&h=1200&fit=crop&q=80"
            )},
            @{File="close.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1560762484-813fc97650a0?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1541140134513-85a161dc4a00?w=1200&h=1200&fit=crop&q=80"
            )}
        )
    },
    @{
        Sku = "JBL-FLIP6"
        Name = "JBL Flip 6 Speaker"
        Folder = "audio/jbl-flip6"
        Images = @(
            @{File="front.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=1200&h=1200&fit=crop&q=80"
            )},
            @{File="side.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=1200&h=1200&fit=crop&q=80"
            )},
            @{File="lifestyle.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1507878866276-a947ef722fee?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1558584673-c834fb1cc3ca?w=1200&h=1200&fit=crop&q=80"
            )}
        )
    },
    @{
        Sku = "CANON-EOS-R50"
        Name = "Canon EOS R50 Camera"
        Folder = "camera/canon-eos-r50"
        Images = @(
            @{File="front.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1519183071298-a2962be96f83?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1606980707239-6d664d5c34e4?w=1200&h=1200&fit=crop&q=80"
            )},
            @{File="side.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1200&h=1200&fit=crop&q=80"
            )},
            @{File="detail.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1526178613552-2b45c6c302f0?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1606980707239-6d664d5c34e4?w=1200&h=1200&fit=crop&q=80"
            )}
        )
    },
    @{
        Sku = "NIKE-AIR-FORCE-1"
        Name = "Nike Air Force 1"
        Folder = "sneakers/nike-af1"
        Images = @(
            @{File="main.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&h=1200&fit=crop&q=80"
            )},
            @{File="side.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1200&h=1200&fit=crop&q=80"
            )},
            @{File="detail.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1200&h=1200&fit=crop&q=80"
            )}
        )
    },
    @{
        Sku = "ADIDAS-ULTRABOOST-22"
        Name = "Adidas Ultraboost 22"
        Folder = "sneakers/adidas-ultraboost"
        Images = @(
            @{File="main.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1200&h=1200&fit=crop&q=80"
            )},
            @{File="angle.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1200&h=1200&fit=crop&q=80"
            )},
            @{File="lifestyle.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1200&h=1200&fit=crop&q=80"
            )}
        )
    },
    @{
        Sku = "HYDRO-FLASK-32OZ"
        Name = "Hydro Flask 32oz"
        Folder = "accessories/hydro-flask"
        Images = @(
            @{File="main.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1624276638844-1e9cf565e4a5?w=1200&h=1200&fit=crop&q=80"
            )},
            @{File="color.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1618921422754-b1c0e2c8dc97?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=1200&h=1200&fit=crop&q=80"
            )},
            @{File="lifestyle.jpg"; Urls=@(
                "https://images.unsplash.com/photo-1582046037313-fee9a14c0364?w=1200&h=1200&fit=crop&q=80",
                "https://images.unsplash.com/photo-1603833797131-3c0a18fcb6b1?w=1200&h=1200&fit=crop&q=80"
            )}
        )
    }
)

# ====== DOWNLOAD FUNCTION WITH RETRY ======
function Download-ImageWithRetry {
    param(
        [string[]]$Urls,
        [string]$DestinationPath,
        [int]$MaxRetries = 3
    )
    
    foreach ($url in $Urls) {
        for ($i = 1; $i -le $MaxRetries; $i++) {
            try {
                Write-Host "  Attempting download from: $url (Attempt $i/$MaxRetries)" -ForegroundColor Cyan
                
                $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30
                
                if ($response.Content.Length -gt 1000) {
                    [System.IO.File]::WriteAllBytes($DestinationPath, $response.Content)
                    $sizeKB = [math]::Round($response.Content.Length / 1KB, 2)
                    Write-Host "  [OK] Downloaded successfully ($sizeKB KB)" -ForegroundColor Green
                    return $true
                }
            }
            catch {
                Write-Host "  [FAIL] Failed: $($_.Exception.Message)" -ForegroundColor Yellow
                if ($i -lt $MaxRetries) {
                    Start-Sleep -Seconds 2
                }
            }
        }
    }
    
    Write-Host "  [X] All download attempts failed for this image" -ForegroundColor Red
    return $false
}

# ====== SUPABASE UPLOAD FUNCTION ======
function Upload-ToSupabase {
    param(
        [string]$LocalPath,
        [string]$StoragePath
    )
    
    if (-not $ServiceRole) {
        Write-Host "  [SKIP] Skipping upload (no service role key)" -ForegroundColor DarkGray
        return $null
    }
    
    try {
        $bytes = [System.IO.File]::ReadAllBytes($LocalPath)
        $uri = "$SupabaseUrl/storage/v1/object/$Bucket/$StoragePath"
        $headers = @{
            "Authorization" = "Bearer $ServiceRole"
            "apikey" = $ServiceRole
            "x-upsert" = "true"
            "Cache-Control" = "public, max-age=31536000, immutable"
        }
        
        $response = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -Body $bytes -ContentType "image/jpeg"
        $publicUrl = "$SupabaseUrl/storage/v1/object/public/$Bucket/$StoragePath"
        Write-Host "  [OK] Uploaded to Supabase" -ForegroundColor Green
        return $publicUrl
    }
    catch {
        Write-Host "  [FAIL] Upload failed: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# ====== MAIN EXECUTION ======
Write-Host "`n====== PRODUCT IMAGE DOWNLOADER ======`n" -ForegroundColor Magenta

$TotalProducts = $Products.Count
$TotalImages = ($Products | ForEach-Object { $_.Images.Count } | Measure-Object -Sum).Sum
$DownloadedCount = 0
$FailedCount = 0
$SqlLines = @()

Write-Host "Products to process: $TotalProducts" -ForegroundColor White
Write-Host "Total images to download: $TotalImages" -ForegroundColor White
Write-Host "Local save path: $LocalImagePath`n" -ForegroundColor White

foreach ($product in $Products) {
    Write-Host "[$($product.Sku)] $($product.Name)" -ForegroundColor Magenta
    
    # Create product folder
    $productPath = Join-Path $LocalImagePath $product.Folder
    if (-not (Test-Path $productPath)) {
        New-Item -ItemType Directory -Path $productPath -Force | Out-Null
    }
    
    $publicUrls = @()
    
    foreach ($imageInfo in $product.Images) {
        $localFile = Join-Path $productPath $imageInfo.File
        Write-Host "  Downloading: $($imageInfo.File)" -ForegroundColor White
        
        $success = Download-ImageWithRetry -Urls $imageInfo.Urls -DestinationPath $localFile
        
        if ($success) {
            $DownloadedCount++
            
            # Try to upload to Supabase if service role is set
            $storagePath = "$($product.Folder)/$($imageInfo.File)"
            $publicUrl = Upload-ToSupabase -LocalPath $localFile -StoragePath $storagePath
            
            if ($publicUrl) {
                $publicUrls += $publicUrl
            }
        }
        else {
            $FailedCount++
        }
    }
    
    # Generate SQL if we have public URLs
    if ($publicUrls.Count -gt 0) {
        $urlsSql = $publicUrls | ForEach-Object { "  '$_'" } | Join-String -Separator ",`n"
        $SqlLines += @"
-- $($product.Sku) - $($product.Name)
UPDATE products
SET images = ARRAY[
$urlsSql
]
WHERE sku = '$($product.Sku)';

"@
    }
    
    Write-Host ""
}

# ====== SUMMARY AND SQL GENERATION ======
Write-Host "====== DOWNLOAD SUMMARY ======" -ForegroundColor Magenta
Write-Host "[OK] Successfully downloaded: $DownloadedCount/$TotalImages" -ForegroundColor Green
Write-Host "[FAIL] Failed downloads: $FailedCount/$TotalImages" -ForegroundColor $(if ($FailedCount -gt 0) { "Red" } else { "Green" })
Write-Host "Local images saved to: $LocalImagePath`n" -ForegroundColor Cyan

# Generate SQL file
if ($SqlLines.Count -gt 0) {
    $sqlFile = Join-Path $LocalImagePath "update-product-images.sql"
    $sqlHeader = @"
-- Generated Product Image Updates
-- Run this in Supabase SQL Editor after verifying SKUs match your database
-- Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

"@
    $sqlContent = $sqlHeader + ($SqlLines -join "`n")
    Set-Content -Path $sqlFile -Value $sqlContent -Encoding UTF8
    
    Write-Host "SQL file generated: $sqlFile" -ForegroundColor Green
    Write-Host "Review the SQL file and run it in your Supabase SQL Editor`n" -ForegroundColor Yellow
}

Write-Host "====== NEXT STEPS ======" -ForegroundColor Magenta
Write-Host "1. Check downloaded images in: $LocalImagePath" -ForegroundColor White
Write-Host "2. If Supabase upload was skipped, set: `$Env:SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor White
Write-Host "3. Review and run the SQL file in Supabase SQL Editor" -ForegroundColor White
Write-Host "4. Verify images appear correctly in your application`n" -ForegroundColor White