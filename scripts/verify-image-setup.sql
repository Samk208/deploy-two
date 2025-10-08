-- SQL Script to Ensure Images Display Correctly
-- Run these queries in order to verify and fix image display issues

-- =====================================================
-- STEP 1: Verify Database Schema is Complete
-- =====================================================

-- Check if all required columns exist
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
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

-- Expected results:
-- images: text[], not null (array of image URLs)
-- primary_image: varchar, nullable (auto-generated from images[1])
-- brand: varchar, nullable
-- short_description: text, nullable

-- =====================================================
-- STEP 2: Check if primary_image is Generated Column
-- =====================================================

-- Check if primary_image is a generated column (auto-updates from images array)
SELECT
    column_name,
    is_generated,
    generation_expression
FROM information_schema.columns
WHERE
    table_name = 'products'
    AND column_name = 'primary_image';

-- If is_generated = 'ALWAYS', then primary_image auto-updates from images[1]
-- If is_generated = 'NEVER', then it's a regular column that needs manual updates

-- =====================================================
-- STEP 3: Verify Required Indexes Exist
-- =====================================================

-- Check if performance indexes are created
SELECT indexname, indexdef
FROM pg_indexes
WHERE
    tablename = 'products'
    AND indexname LIKE 'idx_products_%'
ORDER BY indexname;

-- Expected indexes:
-- idx_products_active_instock_stock (for main shop filtering)
-- idx_products_created_at_desc (for sorting)
-- idx_products_category_filter (for category filtering)
-- idx_products_brand_filter (for brand filtering)
-- idx_products_title_trgm (for text search)
-- idx_products_short_description_trgm (for description search)

-- =====================================================
-- STEP 4: Get Supplier ID for Product Insert
-- =====================================================

-- Find existing supplier users
SELECT id, email, name, role, created_at
FROM users
WHERE
    role = 'supplier'
ORDER BY created_at ASC
LIMIT 5;

-- If no suppliers exist, convert an existing user or create one:
-- UPDATE users SET role = 'supplier' WHERE email = 'your-email@example.com';

-- Copy the supplier ID (UUID) for the next step

-- =====================================================
-- STEP 5: Check Current Products
-- =====================================================

-- See what products currently exist
SELECT
    id,
    title,
    brand,
    price,
    array_length (images, 1) as image_count,
    primary_image IS NOT NULL as has_primary_image,
    active,
    in_stock,
    stock_count
FROM products
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- STEP 6: Verify Image URLs are Accessible
-- =====================================================

-- Check if images array contains valid URLs
SELECT 
  title,
  images[1] as first_image,
  primary_image,
  array_length(images, 1) as total_images
FROM products 
WHERE array_length(images, 1) > 0
LIMIT 5;

-- All URLs should start with: https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/

-- =====================================================
-- STEP 7: Fix Primary Image if Not Generated
-- =====================================================

-- If primary_image is NOT a generated column, update it manually
-- (Only run this if Step 2 shows is_generated = 'NEVER')

-- UPDATE products
-- SET primary_image = images[1]
-- WHERE primary_image IS NULL
--   AND array_length(images, 1) > 0;

-- =====================================================
-- STEP 8: Verify Main Shop API Data
-- =====================================================

-- Test the exact query used by the main shop API
SELECT
    id,
    title,
    price,
    primary_image,
    active,
    in_stock,
    stock_count,
    category,
    brand,
    short_description,
    created_at
FROM products
WHERE
    active = true
    AND in_stock = true
    AND stock_count > 0
ORDER BY created_at DESC
LIMIT 10;

-- This should return products with:
-- - primary_image URLs starting with https://mqnwtfbdgcuvqvnloidt.supabase.co/
-- - brand names populated
-- - short_description for product cards

-- =====================================================
-- STEP 9: Create Sample Test Product (if needed)
-- =====================================================

-- If you need a quick test product with images:
/*
INSERT INTO products (
title,
brand,
short_description,
description,
price,
images,
category,
region,
in_stock,
stock_count,
commission,
active,
supplier_id,
sku
) VALUES (
'Test Product with Images',
'Test Brand',
'This is a test product to verify image display functionality.',
'Full description of the test product to verify all features work correctly.',
99.99,
ARRAY[
'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/headphones/sony-xm5-front.jpg',
'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/headphones/sony-xm5-side.jpg'
],
'Electronics',
ARRAY['Global', 'US'],
TRUE,
10,
15.00,
TRUE,
'YOUR_SUPPLIER_ID_HERE',  -- Replace with actual supplier ID
'TEST-PRODUCT-001'
);
*/

-- =====================================================
-- SUMMARY
-- =====================================================

-- After running these checks:
-- 1. Ensure all 3 migrations completed (from project memory)
-- 2. Verify supplier ID exists
-- 3. Insert products using scripts/insert-sample-products-with-images.sql
-- 4. Test main shop: http://localhost:3000/main-shop
-- 5. Check that images display correctly in product cards