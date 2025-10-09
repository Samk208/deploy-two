-- =====================================================================
-- SOFT DELETE PROTECTION MIGRATION
-- =====================================================================
-- This migration converts hard deletes to soft deletes to prevent
-- accidental data loss. Products and shops are marked as deleted
-- instead of being permanently removed.
--
-- Features:
-- - Adds deleted_at columns for soft delete tracking
-- - Blocks hard deletes for authenticated users
-- - Allows service_role emergency operations
-- - Provides helper functions for soft delete operations
-- =====================================================================

-- 1) Add soft delete columns if they don't exist
DO $$
BEGIN
  -- Add deleted_at to products table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE products ADD COLUMN deleted_at timestamptz;
    RAISE NOTICE 'Added deleted_at column to products table';
  END IF;

  -- Add deleted_at to shops table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shops' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE shops ADD COLUMN deleted_at timestamptz;
    RAISE NOTICE 'Added deleted_at column to shops table';
  END IF;

  -- Add deleted_at to influencer_shop_products if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'influencer_shop_products') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'influencer_shop_products' AND column_name = 'deleted_at'
    ) THEN
      EXECUTE 'ALTER TABLE influencer_shop_products ADD COLUMN deleted_at timestamptz';
      RAISE NOTICE 'Added deleted_at column to influencer_shop_products table';
    END IF;
  END IF;
END $$;

-- 2) Create indexes for soft delete performance
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products (deleted_at)
WHERE
    deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_active ON products (id)
WHERE
    deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_shops_deleted_at ON shops (deleted_at)
WHERE
    deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shops_active ON shops (id)
WHERE
    deleted_at IS NULL;

-- Index for influencer_shop_products if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'influencer_shop_products') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_influencer_shop_products_deleted_at ON influencer_shop_products (deleted_at) WHERE deleted_at IS NOT NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_influencer_shop_products_active ON influencer_shop_products (influencer_id, product_id) WHERE deleted_at IS NULL';
  END IF;
END $$;

-- 3) Update existing RLS policies to deny hard deletes for authenticated users
-- Only service_role can perform hard deletes for emergency cleanup

-- Products: Block hard deletes for authenticated users
DROP POLICY IF EXISTS products_delete_when_unfrozen ON products;
CREATE POLICY products_delete_denied ON products
  FOR DELETE 
  TO authenticated 
  USING (false);

-- Shops: Block hard deletes for authenticated users  
DROP POLICY IF EXISTS shops_delete_when_unfrozen ON shops;
CREATE POLICY shops_delete_denied ON shops
  FOR DELETE 
  TO authenticated 
  USING (false);

-- Influencer shop products: Block hard deletes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'influencer_shop_products') THEN
    EXECUTE 'DROP POLICY IF EXISTS influencer_shop_products_delete_when_unfrozen ON influencer_shop_products';
    EXECUTE 'CREATE POLICY influencer_shop_products_delete_denied ON influencer_shop_products FOR DELETE TO authenticated USING (false)';
  END IF;
END $$;

-- 4) Create soft delete helper functions
CREATE OR REPLACE FUNCTION soft_delete_product(product_id uuid)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  rows_affected integer;
BEGIN
  UPDATE products 
  SET deleted_at = now(), updated_at = now()
  WHERE id = product_id AND deleted_at IS NULL;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  IF rows_affected > 0 THEN
    RAISE NOTICE 'Product % soft deleted successfully', product_id;
    RETURN true;
  ELSE
    RAISE NOTICE 'Product % not found or already deleted', product_id;
    RETURN false;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION soft_delete_shop(shop_id uuid)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  rows_affected integer;
BEGIN
  UPDATE shops 
  SET deleted_at = now(), updated_at = now()
  WHERE id = shop_id AND deleted_at IS NULL;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  IF rows_affected > 0 THEN
    RAISE NOTICE 'Shop % soft deleted successfully', shop_id;
    RETURN true;
  ELSE
    RAISE NOTICE 'Shop % not found or already deleted', shop_id;
    RETURN false;
  END IF;
END;
$$;

-- 5) Create restore functions for accidental deletions
CREATE OR REPLACE FUNCTION restore_product(product_id uuid)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  rows_affected integer;
BEGIN
  UPDATE products 
  SET deleted_at = NULL, updated_at = now()
  WHERE id = product_id AND deleted_at IS NOT NULL;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  IF rows_affected > 0 THEN
    RAISE NOTICE 'Product % restored successfully', product_id;
    RETURN true;
  ELSE
    RAISE NOTICE 'Product % not found in deleted items', product_id;
    RETURN false;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION restore_shop(shop_id uuid)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  rows_affected integer;
BEGIN
  UPDATE shops 
  SET deleted_at = NULL, updated_at = now()
  WHERE id = shop_id AND deleted_at IS NOT NULL;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  IF rows_affected > 0 THEN
    RAISE NOTICE 'Shop % restored successfully', shop_id;
    RETURN true;
  ELSE
    RAISE NOTICE 'Shop % not found in deleted items', shop_id;
    RETURN false;
  END IF;
END;
$$;

-- 6) Create cleanup function for permanently removing old soft-deleted items
CREATE OR REPLACE FUNCTION cleanup_old_deletions(days_old integer DEFAULT 90)
RETURNS TABLE(
  products_cleaned integer,
  shops_cleaned integer
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  products_count integer := 0;
  shops_count integer := 0;
  cutoff_date timestamptz;
BEGIN
  cutoff_date := now() - (days_old || ' days')::interval;
  
  -- Delete old products (hard delete after retention period)
  DELETE FROM products 
  WHERE deleted_at IS NOT NULL 
    AND deleted_at < cutoff_date;
  GET DIAGNOSTICS products_count = ROW_COUNT;
  
  -- Delete old shops (hard delete after retention period)
  DELETE FROM shops 
  WHERE deleted_at IS NOT NULL 
    AND deleted_at < cutoff_date;
  GET DIAGNOSTICS shops_count = ROW_COUNT;
  
  RAISE NOTICE 'Cleanup complete: % products, % shops permanently deleted', 
    products_count, shops_count;
  
  RETURN QUERY SELECT products_count, shops_count;
END;
$$;

-- 7) Create views for easy access to active (non-deleted) records
CREATE OR REPLACE VIEW active_products AS
SELECT *
FROM products
WHERE
    deleted_at IS NULL;

CREATE OR REPLACE VIEW active_shops AS
SELECT *
FROM shops
WHERE
    deleted_at IS NULL;

CREATE OR REPLACE VIEW deleted_products AS
SELECT *
FROM products
WHERE
    deleted_at IS NOT NULL;

CREATE OR REPLACE VIEW deleted_shops AS
SELECT *
FROM shops
WHERE
    deleted_at IS NOT NULL;

-- 8) Add comments for documentation
COMMENT ON COLUMN products.deleted_at IS 'Soft delete timestamp. NULL = active, NOT NULL = deleted';

COMMENT ON COLUMN shops.deleted_at IS 'Soft delete timestamp. NULL = active, NOT NULL = deleted';

COMMENT ON FUNCTION soft_delete_product (uuid) IS 'Safely soft delete a product by ID';

COMMENT ON FUNCTION soft_delete_shop (uuid) IS 'Safely soft delete a shop by ID';

COMMENT ON FUNCTION restore_product (uuid) IS 'Restore a soft deleted product';

COMMENT ON FUNCTION restore_shop (uuid) IS 'Restore a soft deleted shop';

COMMENT ON FUNCTION cleanup_old_deletions (integer) IS 'Permanently delete soft-deleted items older than specified days (default 90)';

COMMENT ON VIEW active_products IS 'View of all non-deleted products';

COMMENT ON VIEW active_shops IS 'View of all non-deleted shops';

COMMENT ON VIEW deleted_products IS 'View of all soft-deleted products';

COMMENT ON VIEW deleted_shops IS 'View of all soft-deleted shops';

-- =====================================================================
-- USAGE INSTRUCTIONS:
-- =====================================================================
--
-- Instead of DELETE statements, use soft delete functions:
-- SELECT soft_delete_product('uuid-here');
-- SELECT soft_delete_shop('uuid-here');
--
-- To restore accidentally deleted items:
-- SELECT restore_product('uuid-here');
-- SELECT restore_shop('uuid-here');
--
-- To view active records only:
-- SELECT * FROM active_products;
-- SELECT * FROM active_shops;
--
-- To view deleted items:
-- SELECT * FROM deleted_products;
-- SELECT * FROM deleted_shops;
--
-- To cleanup old deletions (90+ days old):
-- SELECT * FROM cleanup_old_deletions();
-- SELECT * FROM cleanup_old_deletions(30); -- 30 days
--
-- APPLICATION CODE CHANGES NEEDED:
-- Replace: DELETE FROM products WHERE id = $1
-- With:    SELECT soft_delete_product($1)
--
-- Add to queries: WHERE deleted_at IS NULL
-- Or use views: SELECT * FROM active_products
--
-- =====================================================================

-- Verify installation
DO $$
BEGIN
  RAISE NOTICE 'Soft delete protection installed successfully';
  RAISE NOTICE 'Hard deletes are now blocked for authenticated users';
  RAISE NOTICE 'Use soft_delete_product() and soft_delete_shop() functions instead';
  RAISE NOTICE 'Service role can still perform emergency hard deletes';
END $$;