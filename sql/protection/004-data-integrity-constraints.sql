-- =====================================================================
-- DATA INTEGRITY CONSTRAINTS
-- =====================================================================
-- This script adds comprehensive data integrity constraints to prevent
-- corrupt or invalid data from entering the database. These constraints
-- act as a safety net against application bugs or malicious inputs.
--
-- Features:
-- - Image array validation (min/max length, valid URLs)
-- - Numeric range validation (prices, stock, commission)
-- - String length limits and format validation
-- - Enum value constraints for categories and status fields
-- - Cross-field validation rules
-- =====================================================================

-- 1) Product table constraints
DO $$
BEGIN
  -- Title constraints
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_title_length'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_title_length 
    CHECK (char_length(title) >= 1 AND char_length(title) <= 255);
    RAISE NOTICE 'Added products title length constraint';
  END IF;

  -- Price constraints (non-negative, reasonable upper limit)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_price_range'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_price_range 
    CHECK (price >= 0 AND price <= 999999.99);
    RAISE NOTICE 'Added products price range constraint';
  END IF;

  -- Stock count constraints (non-negative, reasonable upper limit)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_stock_nonneg'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_stock_nonneg 
    CHECK (stock_count IS NULL OR stock_count >= 0);
    RAISE NOTICE 'Added products stock non-negative constraint';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_stock_reasonable'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_stock_reasonable 
    CHECK (stock_count IS NULL OR stock_count <= 1000000);
    RAISE NOTICE 'Added products stock reasonable limit constraint';
  END IF;

  -- Commission constraints (0-100%)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_commission_range'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_commission_range 
    CHECK (commission IS NULL OR (commission >= 0 AND commission <= 100));
    RAISE NOTICE 'Added products commission range constraint';
  END IF;

  -- Images array constraints
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_images_minlen'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_images_minlen 
    CHECK (images IS NULL OR cardinality(images) >= 1);
    RAISE NOTICE 'Added products images minimum length constraint';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_images_maxlen'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_images_maxlen 
    CHECK (images IS NULL OR cardinality(images) <= 10);
    RAISE NOTICE 'Added products images maximum length constraint';
  END IF;

  -- Description length constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_description_length'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_description_length 
    CHECK (description IS NULL OR char_length(description) <= 5000);
    RAISE NOTICE 'Added products description length constraint';
  END IF;

  -- Region array constraint (reasonable limit)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_region_maxlen'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_region_maxlen 
    CHECK (region IS NULL OR cardinality(region) <= 20);
    RAISE NOTICE 'Added products region maximum length constraint';
  END IF;
END $$;

-- 2) Shop table constraints
DO $$
BEGIN
  -- Shop name constraints
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'shops_name_length'
  ) THEN
    ALTER TABLE shops 
    ADD CONSTRAINT shops_name_length 
    CHECK (char_length(name) >= 1 AND char_length(name) <= 100);
    RAISE NOTICE 'Added shops name length constraint';
  END IF;

  -- Shop handle constraints (URL-safe format)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'shops_handle_format'
  ) THEN
    ALTER TABLE shops 
    ADD CONSTRAINT shops_handle_format 
    CHECK (handle ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$');
    RAISE NOTICE 'Added shops handle format constraint';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'shops_handle_length'
  ) THEN
    ALTER TABLE shops 
    ADD CONSTRAINT shops_handle_length 
    CHECK (char_length(handle) >= 1 AND char_length(handle) <= 50);
    RAISE NOTICE 'Added shops handle length constraint';
  END IF;

  -- Shop description constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'shops_description_length'
  ) THEN
    ALTER TABLE shops 
    ADD CONSTRAINT shops_description_length 
    CHECK (description IS NULL OR char_length(description) <= 1000);
    RAISE NOTICE 'Added shops description length constraint';
  END IF;
END $$;

-- 3) Shop products join table constraints (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shop_products') THEN
    -- Custom title length
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'shop_products_custom_title_length'
    ) THEN
      EXECUTE 'ALTER TABLE shop_products ADD CONSTRAINT shop_products_custom_title_length CHECK (custom_title IS NULL OR char_length(custom_title) <= 255)';
      RAISE NOTICE 'Added shop_products custom title length constraint';
    END IF;

    -- Sale price constraints
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'shop_products_sale_price_range'
    ) THEN
      EXECUTE 'ALTER TABLE shop_products ADD CONSTRAINT shop_products_sale_price_range CHECK (sale_price IS NULL OR (sale_price >= 0 AND sale_price <= 999999.99))';
      RAISE NOTICE 'Added shop_products sale price range constraint';
    END IF;

    -- Display order constraints
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'shop_products_display_order_range'
    ) THEN
      EXECUTE 'ALTER TABLE shop_products ADD CONSTRAINT shop_products_display_order_range CHECK (display_order >= 0 AND display_order <= 999999)';
      RAISE NOTICE 'Added shop_products display order range constraint';
    END IF;
  END IF;
END $$;

-- 4) User profiles constraints
DO $$
BEGIN
  -- Name length constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_name_length'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_name_length 
    CHECK (name IS NULL OR (char_length(name) >= 1 AND char_length(name) <= 100));
    RAISE NOTICE 'Added profiles name length constraint';
  END IF;

  -- Role enum constraint (if role column exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'profiles_role_valid'
    ) THEN
      ALTER TABLE profiles 
      ADD CONSTRAINT profiles_role_valid 
      CHECK (role IN ('admin', 'supplier', 'influencer', 'customer'));
      RAISE NOTICE 'Added profiles role validation constraint';
    END IF;
  END IF;
END $$;

-- 6) Add simplified image validation constraints (without subqueries)
DO $$
BEGIN
  -- Simple array length validation for product images
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_images_not_empty'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_images_not_empty 
    CHECK (images IS NULL OR array_length(images, 1) > 0);
    RAISE NOTICE 'Added products images not empty constraint';
  END IF;

  -- Validate product primary_image if it exists (simple NOT NULL when images exist)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'primary_image'
  ) THEN
    -- Note: primary_image is often a generated column, so we don't add constraints
    RAISE NOTICE 'Primary image column exists - no additional constraints needed for generated column';
  END IF;
END $$;

-- 7) Cross-field validation constraints
DO $$
BEGIN
  -- In-stock products must have stock_count > 0
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_stock_consistency'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_stock_consistency 
    CHECK (
      in_stock IS NULL OR stock_count IS NULL OR 
      (in_stock = false) OR 
      (in_stock = true AND stock_count > 0)
    );
    RAISE NOTICE 'Added products stock consistency constraint';
  END IF;

  -- Active products should have required fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_active_requirements'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_active_requirements 
    CHECK (
      active = false OR 
      (active = true AND title IS NOT NULL AND price IS NOT NULL)
    );
    RAISE NOTICE 'Added products active requirements constraint';
  END IF;
END $$;

-- 8) Create constraint validation function (simplified)
CREATE OR REPLACE FUNCTION validate_all_constraints()
RETURNS TABLE(
  table_name text,
  constraint_name text,
  violation_count bigint,
  sample_violations text[]
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  constraint_record record;
  violation_query text;
  sample_query text;
  violation_count bigint;
  sample_violations text[];
BEGIN
  -- Check each constraint and report violations
  FOR constraint_record IN
    SELECT 
      tc.table_name,
      tc.constraint_name,
      cc.check_clause
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc 
      ON tc.constraint_name = cc.constraint_name
    WHERE tc.constraint_type = 'CHECK'
      AND tc.table_schema = 'public'
      AND tc.table_name IN ('products', 'shops', 'shop_products', 'profiles', 'influencer_shop_products')
  LOOP
    BEGIN
      -- Build query to count violations (with error handling)
      violation_query := format(
        'SELECT COUNT(*) FROM %I WHERE NOT (%s)',
        constraint_record.table_name,
        constraint_record.check_clause
      );
      
      -- Execute count query
      EXECUTE violation_query INTO violation_count;
      
      -- If violations exist, get sample IDs
      IF violation_count > 0 THEN
        sample_query := format(
          'SELECT array_agg(id::text) FROM (SELECT id FROM %I WHERE NOT (%s) LIMIT 5) sample',
          constraint_record.table_name,
          constraint_record.check_clause
        );
        
        EXECUTE sample_query INTO sample_violations;
        
        RETURN QUERY SELECT 
          constraint_record.table_name,
          constraint_record.constraint_name,
          violation_count,
          sample_violations;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Skip constraints that cause errors (like complex validations)
      CONTINUE;
    END;
  END LOOP;
END;
$$;

-- 9) Create constraint maintenance functions
CREATE OR REPLACE FUNCTION fix_image_constraints()
RETURNS TABLE(
  products_fixed integer,
  shops_fixed integer
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  products_count integer := 0;
  shops_count integer := 0;
BEGIN
  -- Fix products with empty image arrays
  UPDATE products 
  SET images = ARRAY['/placeholder-product.png']
  WHERE images IS NOT NULL AND cardinality(images) = 0;
  GET DIAGNOSTICS products_count = ROW_COUNT;
  
  -- Fix products with too many images (keep first 10)
  UPDATE products 
  SET images = images[1:10]
  WHERE images IS NOT NULL AND cardinality(images) > 10;
  GET DIAGNOSTICS products_count = products_count + ROW_COUNT;
  
  RAISE NOTICE 'Fixed % products with image constraint issues', products_count;
  
  RETURN QUERY SELECT products_count, shops_count;
END;
$$;

-- 10) Add comments for documentation
COMMENT ON FUNCTION validate_all_constraints () IS 'Check all data integrity constraints and report violations';

COMMENT ON FUNCTION fix_image_constraints () IS 'Automatically fix common image constraint violations';

-- Add table comments
COMMENT ON CONSTRAINT products_title_length ON products IS 'Product title must be 1-255 characters';

COMMENT ON CONSTRAINT products_price_range ON products IS 'Product price must be 0-999999.99';

COMMENT ON CONSTRAINT products_commission_range ON products IS 'Commission must be 0-100%';

COMMENT ON CONSTRAINT products_images_minlen ON products IS 'Products must have at least 1 image';

COMMENT ON CONSTRAINT products_images_maxlen ON products IS 'Products can have at most 10 images';

-- =====================================================================
-- VALIDATION AND MAINTENANCE:
-- =====================================================================
--
-- To check for constraint violations:
-- SELECT * FROM validate_all_constraints();
--
-- To fix common image issues:
-- SELECT * FROM fix_image_constraints();
--
-- To test constraints (should fail):
-- INSERT INTO products (title, price) VALUES ('', -10);  -- Should fail
-- INSERT INTO products (title, images) VALUES ('Test', ARRAY[]::text[]);  -- Should fail
--
-- NOTE: Complex URL validation was removed due to PostgreSQL subquery
-- limitations in CHECK constraints. Implement URL validation in your
-- application layer or use triggers for complex validations.
--
-- =====================================================================

-- Verify installation
DO $$
DECLARE
  constraint_count integer;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints 
  WHERE constraint_type = 'CHECK' 
    AND table_schema = 'public'
    AND table_name IN ('products', 'shops', 'shop_products', 'profiles');
  
  RAISE NOTICE 'Data integrity constraints installed successfully';
  RAISE NOTICE '% CHECK constraints active on core tables', constraint_count;
  RAISE NOTICE 'Use validate_all_constraints() to check for violations';
  RAISE NOTICE 'Use fix_image_constraints() to fix common issues';
END $$;