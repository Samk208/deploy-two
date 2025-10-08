-- =====================================================
-- DATABASE VERIFICATION CHECKLIST FOR IMAGE DISPLAY
-- =====================================================
-- Copy and paste this entire script into Supabase SQL Editor
-- Then share the results with me

-- =====================================================
-- CHECK 1: Schema Completeness (Required Columns)
-- =====================================================
SELECT
    '1. SCHEMA CHECK' as check_type,
    column_name,
    data_type,
    is_nullable,
    CASE
        WHEN column_name = 'images' THEN 'Should be: text[] (array)'
        WHEN column_name = 'primary_image' THEN 'Should be: varchar/text (nullable)'
        WHEN column_name = 'brand' THEN 'Should be: varchar (nullable)'
        WHEN column_name = 'short_description' THEN 'Should be: text (nullable)'
        ELSE 'Expected column'
    END as expected_type
FROM information_schema.columns
WHERE
    table_name = 'products'
    AND column_name IN (
        'images',
        'primary_image',
        'brand',
        'short_description'
    )
ORDER BY column_name;

-- =====================================================
-- CHECK 2: Migration Status (Required Indexes)
-- =====================================================
SELECT
    '2. INDEXES CHECK' as check_type,
    indexname,
    'Present' as status
FROM pg_indexes
WHERE
    tablename = 'products'
    AND indexname IN (
        'idx_products_active_instock_stock',
        'idx_products_created_at_desc',
        'idx_products_category_filter',
        'idx_products_brand_filter',
        'idx_products_title_trgm',
        'idx_products_short_description_trgm'
    )
ORDER BY indexname;

-- =====================================================
-- CHECK 3: Primary Image Generation Type
-- =====================================================
SELECT
    '3. PRIMARY_IMAGE TYPE' as check_type,
    column_name,
    is_generated,
    generation_expression,
    CASE
        WHEN is_generated = 'ALWAYS' THEN 'Auto-updates from images[1] ✓'
        WHEN is_generated = 'NEVER' THEN 'Manual column - needs UPDATE ⚠️'
        ELSE 'Unknown type'
    END as status
FROM information_schema.columns
WHERE
    table_name = 'products'
    AND column_name = 'primary_image';

-- =====================================================
-- CHECK 4: Extensions Required
-- =====================================================
SELECT
    '4. EXTENSIONS CHECK' as check_type,
    extname as extension_name,
    'Installed' as status
FROM pg_extension
WHERE
    extname IN ('pg_trgm');

-- =====================================================
-- CHECK 5: User/Supplier Status
-- =====================================================
SELECT
    '5. SUPPLIER CHECK' as check_type,
    COUNT(*) as supplier_count,
    CASE
        WHEN COUNT(*) > 0 THEN 'Suppliers available ✓'
        ELSE 'No suppliers found ⚠️'
    END as status
FROM users
WHERE
    role = 'supplier';

-- Show first supplier ID for reference
SELECT
    '5b. FIRST SUPPLIER' as check_type,
    id as supplier_id,
    email,
    name
FROM users
WHERE
    role = 'supplier'
ORDER BY created_at ASC
LIMIT 1;

-- =====================================================
-- CHECK 6: Current Products Status
-- =====================================================
SELECT
    '6. PRODUCTS OVERVIEW' as check_type,
    COUNT(*) as total_products,
    COUNT(*) FILTER (
        WHERE
            active = true
    ) as active_products,
    COUNT(*) FILTER (
        WHERE
            active = true
            AND in_stock = true
            AND stock_count > 0
    ) as displayable_products,
    COUNT(*) FILTER (
        WHERE
            images IS NOT NULL
            AND array_length (images, 1) > 0
    ) as products_with_images,
    COUNT(*) FILTER (
        WHERE
            primary_image IS NOT NULL
            AND primary_image != ''
    ) as products_with_primary_image
FROM products;

-- =====================================================
-- CHECK 7: Image URL Validation
-- =====================================================
SELECT 
  '7. IMAGE URLS CHECK' as check_type,
  id,
  title,
  images[1] as first_image_url,
  primary_image,
  CASE 
    WHEN images[1] LIKE 'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/%' 
    THEN 'Valid Supabase URL ✓'
    WHEN images[1] IS NULL THEN 'No images ⚠️'
    ELSE 'Invalid URL format ❌'
  END as url_status,
  array_length(images, 1) as total_images
FROM products 
WHERE images IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 5;

-- =====================================================
-- CHECK 8: Main Shop API Readiness
-- =====================================================
SELECT
    '8. MAIN SHOP READY' as check_type,
    COUNT(*) as products_for_main_shop,
    CASE
        WHEN COUNT(*) > 0 THEN 'Products ready for display ✓'
        ELSE 'No products ready ⚠️'
    END as status
FROM products
WHERE
    active = true
    AND in_stock = true
    AND stock_count > 0
    AND images IS NOT NULL
    AND array_length (images, 1) > 0;

-- Show sample of ready products
SELECT
    '8b. SAMPLE READY PRODUCTS' as check_type,
    title,
    brand,
    price,
    stock_count,
    CASE
        WHEN primary_image IS NOT NULL THEN 'Has primary_image ✓'
        ELSE 'Missing primary_image ⚠️'
    END as image_status
FROM products
WHERE
    active = true
    AND in_stock = true
    AND stock_count > 0
ORDER BY created_at DESC
LIMIT 3;

-- =====================================================
-- CHECK 9: Storage Bucket Access Test
-- =====================================================
-- Note: This checks if any products have the expected image URL pattern
SELECT 
  '9. STORAGE PATTERN CHECK' as check_type,
  COUNT(*) FILTER (
    WHERE images[1] LIKE 'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/%'
  ) as correct_pattern_count,
  COUNT(*) FILTER (
    WHERE images IS NOT NULL AND array_length(images, 1) > 0
  ) as total_with_images,
  CASE 
    WHEN COUNT(*) FILTER (
      WHERE images[1] LIKE 'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/%'
    ) > 0 THEN 'Uploaded images detected ✓'
    ELSE 'No uploaded images found ⚠️'
  END as status
FROM products;

-- =====================================================
-- SUMMARY REPORT
-- =====================================================
SELECT
    'SUMMARY' as check_type,
    'Run this script and share ALL results with me' as instruction,
    'I will analyze and provide next steps' as next_action;