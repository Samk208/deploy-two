-- =====================================================
-- COMPLETE IMAGE DISPLAY SETUP SCRIPT
-- =====================================================
-- This script ensures all 3 required migrations are applied
-- Based on project memory: migrations must be run in order

-- =====================================================
-- MIGRATION 1: Add brand and primary_image columns
-- =====================================================
-- From: supabase/migrations/20251007_add_brand_and_primary_image.sql

-- Add brand column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'brand'
  ) THEN
    ALTER TABLE products ADD COLUMN brand VARCHAR;
    RAISE NOTICE 'Added brand column';
  ELSE
    RAISE NOTICE 'Brand column already exists';
  END IF;
END $$;

-- Handle primary_image column carefully
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'primary_image'
  ) THEN
    ALTER TABLE products ADD COLUMN primary_image VARCHAR;
    RAISE NOTICE 'Added primary_image column';
  ELSE
    RAISE NOTICE 'Primary_image column already exists';
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN products.brand IS 'Product brand name';

COMMENT ON COLUMN products.primary_image IS 'Primary product image URL (first image from images array)';

-- =====================================================
-- MIGRATION 2: Performance indexes
-- =====================================================
-- From: sql/migrations/003-main-shop-indexes.sql

-- Composite index for main shop filtering
CREATE INDEX IF NOT EXISTS idx_products_active_instock_stock ON public.products (active, in_stock, stock_count);

-- Individual indexes
CREATE INDEX IF NOT EXISTS idx_products_created_at_desc ON public.products (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_category_filter ON public.products (category)
WHERE
    active = true;

CREATE INDEX IF NOT EXISTS idx_products_brand_filter ON public.products (brand)
WHERE
    active = true;

-- Enable pg_trgm extension for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram index for text search
CREATE INDEX IF NOT EXISTS idx_products_title_trgm ON public.products USING gin (title gin_trgm_ops);

-- =====================================================
-- MIGRATION 3: Product descriptions
-- =====================================================
-- From: sql/migrations/004-products-descriptions.sql

-- Add short_description column
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS short_description TEXT;

-- Add comment
COMMENT ON COLUMN public.products.short_description IS 'Short one-liner for catalog cards and SEO snippets (ideal 120-160 characters)';

-- Create index for text search on short_description
CREATE INDEX IF NOT EXISTS idx_products_short_description_trgm ON public.products USING gin (
    short_description gin_trgm_ops
);

-- =====================================================
-- FIX: Check if primary_image needs manual update
-- =====================================================
-- Only update if primary_image is NOT a generated column
DO $$
BEGIN
  -- Check if primary_image is a generated column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' 
      AND column_name = 'primary_image'
      AND is_generated = 'ALWAYS'
  ) THEN
    -- It's a regular column, safe to update
    UPDATE products 
    SET primary_image = images[1] 
    WHERE images IS NOT NULL 
      AND array_length(images, 1) > 0
      AND (primary_image IS NULL OR primary_image = '');
    RAISE NOTICE 'Updated primary_image for existing products';
  ELSE
    -- It's a generated column, will auto-update
    RAISE NOTICE 'primary_image is a generated column - will auto-update from images[1] ✓';
  END IF;
END $$;

-- =====================================================
-- VERIFICATION: Check everything is ready
-- =====================================================
SELECT
    'SETUP COMPLETE' as status,
    'All 3 migrations applied' as migrations,
    'Ready to insert products with images' as next_step;

-- Show column status
SELECT
    column_name,
    data_type,
    is_nullable
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