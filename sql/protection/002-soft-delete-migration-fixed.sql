-- =====================================================================
-- SIMPLIFIED SOFT DELETE MIGRATION (Schema-Specific)
-- =====================================================================
-- This is a simplified version that works with your exact schema
-- without making assumptions about column names.
--
-- Your schema:
-- - influencer_shop_products (influencer_id, product_id)
-- - products (standard columns)
-- - shops (standard columns)
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
      ALTER TABLE influencer_shop_products ADD COLUMN deleted_at timestamptz;
      RAISE NOTICE 'Added deleted_at column to influencer_shop_products table';
    END IF;
  END IF;
END $$;

-- 2) Create basic indexes for soft delete performance
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

-- Only create influencer_shop_products indexes if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'influencer_shop_products') THEN
    -- Check what columns actually exist before creating indexes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'influencer_shop_products' AND column_name = 'deleted_at') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_influencer_shop_products_deleted_at ON influencer_shop_products (deleted_at) WHERE deleted_at IS NOT NULL';
      RAISE NOTICE 'Created deleted_at index for influencer_shop_products';
    END IF;
    
    -- Create index on existing columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'influencer_shop_products' AND column_name = 'influencer_id') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'influencer_shop_products' AND column_name = 'product_id') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_influencer_shop_products_active ON influencer_shop_products (influencer_id, product_id)';
      RAISE NOTICE 'Created active products index for influencer_shop_products';
    END IF;
  END IF;
END $$;

-- 3) Block hard deletes for authenticated users (soft delete only)
-- Products: Block hard deletes for authenticated users
DROP POLICY IF EXISTS products_delete_denied ON products;
CREATE POLICY products_delete_denied ON products
  FOR DELETE 
  TO authenticated 
  USING (false);

-- Shops: Block hard deletes for authenticated users  
DROP POLICY IF EXISTS shops_delete_denied ON shops;
CREATE POLICY shops_delete_denied ON shops
  FOR DELETE 
  TO authenticated 
  USING (false);

-- Influencer shop products: Block hard deletes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'influencer_shop_products') THEN
    EXECUTE 'DROP POLICY IF EXISTS influencer_shop_products_delete_denied ON influencer_shop_products';
    EXECUTE 'CREATE POLICY influencer_shop_products_delete_denied ON influencer_shop_products FOR DELETE TO authenticated USING (false)';
    RAISE NOTICE 'Created delete denial policy for influencer_shop_products';
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

-- 6) Create views for easy access to active (non-deleted) records
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

-- 7) Add comments for documentation
COMMENT ON COLUMN products.deleted_at IS 'Soft delete timestamp. NULL = active, NOT NULL = deleted';

COMMENT ON COLUMN shops.deleted_at IS 'Soft delete timestamp. NULL = active, NOT NULL = deleted';

COMMENT ON FUNCTION soft_delete_product (uuid) IS 'Safely soft delete a product by ID';

COMMENT ON FUNCTION soft_delete_shop (uuid) IS 'Safely soft delete a shop by ID';

COMMENT ON FUNCTION restore_product (uuid) IS 'Restore a soft deleted product';

COMMENT ON FUNCTION restore_shop (uuid) IS 'Restore a soft deleted shop';

COMMENT ON VIEW active_products IS 'View of all non-deleted products';

COMMENT ON VIEW active_shops IS 'View of all non-deleted shops';

COMMENT ON VIEW deleted_products IS 'View of all soft-deleted products';

COMMENT ON VIEW deleted_shops IS 'View of all soft-deleted shops';

-- Verify installation
DO $$
BEGIN
  RAISE NOTICE 'Simplified soft delete protection installed successfully';
  RAISE NOTICE 'Hard deletes are now blocked for authenticated users';
  RAISE NOTICE 'Use soft_delete_product() and soft_delete_shop() functions instead';
  RAISE NOTICE 'Service role can still perform emergency hard deletes';
END $$;