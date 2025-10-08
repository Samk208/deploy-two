-- =====================================================
-- FIXED DATABASE VERIFICATION FOR IMAGE DISPLAY
-- =====================================================
-- This script works regardless of whether you use 'users' or 'profiles' table

-- =====================================================
-- CHECK 1: Identify User Table Structure
-- =====================================================
-- First, let's see what user-related tables exist
SELECT
    '1. USER TABLES' as check_type,
    table_name,
    CASE
        WHEN table_name = 'users' THEN 'Custom users table'
        WHEN table_name = 'profiles' THEN 'Supabase profiles table'
        ELSE 'Other user-related table'
    END as table_type
FROM information_schema.tables
WHERE
    table_schema = 'public'
    AND (
        table_name LIKE '%user%'
        OR table_name LIKE '%profile%'
    )
ORDER BY table_name;

-- =====================================================
-- CHECK 2: Products Table Schema
-- =====================================================
SELECT
    '2. PRODUCTS SCHEMA' as check_type,
    column_name,
    data_type,
    is_nullable,
    CASE
        WHEN column_name IN (
            'images',
            'primary_image',
            'brand',
            'short_description'
        ) THEN 'IMAGE RELATED ✓'
        WHEN column_name IN ('supplier_id') THEN 'USER REFERENCE'
        ELSE 'OTHER'
    END as importance
FROM information_schema.columns
WHERE
    table_name = 'products'
    AND table_schema = 'public'
ORDER BY
    CASE
        WHEN column_name IN (
            'images',
            'primary_image',
            'brand',
            'short_description'
        ) THEN 1
        ELSE 2
    END,
    column_name;

-- =====================================================
-- CHECK 3: Find Suppliers (Try Both Tables)
-- =====================================================
-- Try profiles table first (most common in Supabase setups)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
      RAISE NOTICE '3a. PROFILES TABLE WITH ROLE COLUMN EXISTS';
    END IF;
  END IF;
END $$;

-- Check profiles table for suppliers
SELECT '3a. PROFILES SUPPLIERS' as check_type, COUNT(*) as supplier_count
FROM profiles
WHERE
    role = 'supplier';

-- Show first supplier from profiles
SELECT '3b. FIRST SUPPLIER (PROFILES)' as check_type, id, COALESCE(name, 'No name') as name, role
FROM profiles
WHERE
    role = 'supplier'
LIMIT 1;

-- =====================================================
-- CHECK 4: Migration Status Check
-- =====================================================
-- Check if brand column exists (from migration 1)
SELECT
    '4a. BRAND COLUMN' as check_type,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE
                table_name = 'products'
                AND column_name = 'brand'
        ) THEN 'EXISTS ✓'
        ELSE 'MISSING - Need migration 1'
    END as status;

-- Check if short_description exists (from migration 3)
SELECT
    '4b. SHORT_DESCRIPTION COLUMN' as check_type,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE
                table_name = 'products'
                AND column_name = 'short_description'
        ) THEN 'EXISTS ✓'
        ELSE 'MISSING - Need migration 3'
    END as status;

-- =====================================================
-- CHECK 5: Current Products Status
-- =====================================================
SELECT
    '5. PRODUCTS STATUS' as check_type,
    COUNT(*) as total_products,
    COUNT(*) FILTER (
        WHERE
            images IS NOT NULL
            AND array_length (images, 1) > 0
    ) as with_images,
    COUNT(*) FILTER (
        WHERE
            primary_image IS NOT NULL
    ) as with_primary_image,
    COUNT(*) FILTER (
        WHERE
            active = true
            AND in_stock = true
            AND stock_count > 0
    ) as displayable
FROM products;

-- =====================================================
-- CHECK 6: Sample Product Data
-- =====================================================
SELECT
    '6. SAMPLE PRODUCTS' as check_type,
    id,
    title,
    CASE
        WHEN images IS NOT NULL
        AND array_length (images, 1) > 0 THEN 'Has images ✓'
        ELSE 'No images ❌'
    END as image_status,
    CASE
        WHEN primary_image IS NOT NULL THEN 'Has primary ✓'
        ELSE 'No primary ❌'
    END as primary_status
FROM products
ORDER BY created_at DESC
LIMIT 3;

-- =====================================================
-- CHECK 7: Required Indexes
-- =====================================================
SELECT
    '7. REQUIRED INDEXES' as check_type,
    COUNT(*) as index_count,
    CASE
        WHEN COUNT(*) >= 3 THEN 'Sufficient indexes ✓'
        ELSE 'Need more indexes ⚠️'
    END as status
FROM pg_indexes
WHERE
    tablename = 'products'
    AND indexname LIKE 'idx_products_%';

-- =====================================================
-- SUMMARY & NEXT STEPS
-- =====================================================
SELECT 'NEXT STEPS' as check_type, 'Based on results above, I will provide exact fixes' as instruction;