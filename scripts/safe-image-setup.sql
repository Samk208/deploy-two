-- =====================================================
-- SAFE IMAGE SETUP SCRIPT (Generated Column Compatible)
-- =====================================================
-- This script works with your existing generated primary_image column

-- =====================================================
-- STEP 1: Ensure brand column exists
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'brand'
  ) THEN
    ALTER TABLE products ADD COLUMN brand VARCHAR;
    COMMENT ON COLUMN products.brand IS 'Product brand name';
    RAISE NOTICE 'Added brand column ✓';
  ELSE
    RAISE NOTICE 'Brand column already exists ✓';
  END IF;
END $$;

-- =====================================================
-- STEP 2: Ensure short_description column exists
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'short_description'
  ) THEN
    ALTER TABLE products ADD COLUMN short_description TEXT;
    COMMENT ON COLUMN products.short_description IS 'Short one-liner for catalog cards and SEO snippets (ideal 120-160 characters)';
    RAISE NOTICE 'Added short_description column ✓';
  ELSE
    RAISE NOTICE 'Short_description column already exists ✓';
  END IF;
END $$;

-- =====================================================
-- STEP 3: Create performance indexes
-- =====================================================
-- Main shop filter index
CREATE INDEX IF NOT EXISTS idx_products_active_instock_stock ON public.products (active, in_stock, stock_count);

-- Sorting and filtering indexes
CREATE INDEX IF NOT EXISTS idx_products_created_at_desc ON public.products (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_category_filter ON public.products (category)
WHERE
    active = true;

-- Brand filter index (only if brand column exists)
CREATE INDEX IF NOT EXISTS idx_products_brand_filter ON public.products (brand)
WHERE
    active = true;

-- Text search setup
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_products_title_trgm ON public.products USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_short_description_trgm ON public.products USING gin (
    short_description gin_trgm_ops
);

-- =====================================================
-- STEP 4: Verify primary_image is generated column
-- =====================================================
SELECT
    'PRIMARY_IMAGE STATUS' as check_type,
    column_name,
    is_generated,
    CASE
        WHEN is_generated = 'ALWAYS' THEN 'Generated column ✓ - will auto-update from images[1]'
        WHEN is_generated = 'NEVER' THEN 'Regular column - would need manual updates'
        ELSE 'Unknown type'
    END as status
FROM information_schema.columns
WHERE
    table_name = 'products'
    AND column_name = 'primary_image';

-- =====================================================
-- STEP 5: Final verification
-- =====================================================
SELECT
    'SETUP VERIFICATION' as check_type,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE
                table_name = 'products'
                AND column_name = 'images'
        ) THEN 'images: ✓'
        ELSE 'images: ❌'
    END as images_col,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE
                table_name = 'products'
                AND column_name = 'primary_image'
        ) THEN 'primary_image: ✓'
        ELSE 'primary_image: ❌'
    END as primary_col,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE
                table_name = 'products'
                AND column_name = 'brand'
        ) THEN 'brand: ✓'
        ELSE 'brand: ❌'
    END as brand_col,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE
                table_name = 'products'
                AND column_name = 'short_description'
        ) THEN 'short_description: ✓'
        ELSE 'short_description: ❌'
    END as desc_col;

-- =====================================================
-- READY STATUS
-- =====================================================
SELECT
    'READY FOR PRODUCTS' as status,
    'Database schema ready ✓' as schema_status,
    'Generated primary_image will auto-populate ✓' as image_status,
    'Ready to insert products with supplier ID: d9ff2682-be35-4250-bd69-419b74621236' as next_step;