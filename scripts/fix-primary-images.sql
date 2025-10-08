-- Fix Primary Images Script
-- Run this if primary_image column is not auto-populating

-- =====================================================
-- OPTION 1: If primary_image is a regular column
-- =====================================================

-- Update primary_image from images array for all products
UPDATE products 
SET primary_image = images[1] 
WHERE images IS NOT NULL 
  AND array_length(images, 1) > 0
  AND (primary_image IS NULL OR primary_image = '');

-- =====================================================
-- OPTION 2: If you need to create it as a generated column
-- =====================================================

-- First, drop the existing column if it's not generated
-- ALTER TABLE products DROP COLUMN IF EXISTS primary_image;

-- Then create it as a generated column (auto-updates from images[1])
-- ALTER TABLE products
-- ADD COLUMN primary_image VARCHAR
-- GENERATED ALWAYS AS (
--   CASE
--     WHEN array_length(images, 1) > 0 THEN images[1]
--     ELSE NULL
--   END
-- ) STORED;

-- =====================================================
-- VERIFY THE FIX
-- =====================================================

-- Check that primary_image is now populated
SELECT 
  title,
  primary_image,
  images[1] as first_image_from_array,
  array_length(images, 1) as image_count
FROM products 
WHERE images IS NOT NULL 
  AND array_length(images, 1) > 0
LIMIT 5;

-- Both primary_image and first_image_from_array should match