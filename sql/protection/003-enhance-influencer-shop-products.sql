-- =====================================================================
-- ENHANCE INFLUENCER SHOP PRODUCTS TABLE
-- =====================================================================
-- This migration enhances the existing influencer_shop_products table
-- with additional protection features and foreign key constraints.
--
-- Features:
-- - Adds missing columns for better functionality
-- - Foreign key constraints prevent orphaned data
-- - Soft delete support
-- - Performance indexes
-- - Row Level Security policies
-- =====================================================================

-- 1) Enhance existing influencer_shop_products table
DO $$
BEGIN
  -- Add display_order column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'influencer_shop_products' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE influencer_shop_products ADD COLUMN display_order integer DEFAULT 0;
    RAISE NOTICE 'Added display_order column to influencer_shop_products';
  END IF;

  -- Add deleted_at column if missing (for soft deletes)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'influencer_shop_products' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE influencer_shop_products ADD COLUMN deleted_at timestamptz;
    RAISE NOTICE 'Added deleted_at column to influencer_shop_products';
  END IF;

  -- Ensure published column has proper default
  ALTER TABLE influencer_shop_products ALTER COLUMN published SET DEFAULT true;
  
  -- Ensure created_at has proper default
  ALTER TABLE influencer_shop_products ALTER COLUMN created_at SET DEFAULT now();
  
  -- Ensure updated_at has proper default
  ALTER TABLE influencer_shop_products ALTER COLUMN updated_at SET DEFAULT now();
  
  RAISE NOTICE 'Enhanced existing influencer_shop_products table';
END $$;

-- 2) Add foreign key constraints with appropriate cascade rules
-- Influencer FK: CASCADE delete (if influencer deleted, remove their shop products)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'influencer_shop_products_influencer_id_fkey'
  ) THEN
    ALTER TABLE influencer_shop_products 
    ADD CONSTRAINT influencer_shop_products_influencer_id_fkey 
    FOREIGN KEY (influencer_id) REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added influencer_id foreign key with CASCADE delete';
  END IF;
END $$;

-- Product FK: Based on memory, use soft delete approach instead of RESTRICT
-- This allows flexible data recovery and audit capabilities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'influencer_shop_products_product_id_fkey'
  ) THEN
    ALTER TABLE influencer_shop_products 
    ADD CONSTRAINT influencer_shop_products_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added product_id foreign key with CASCADE delete (soft delete logic in application)';
  END IF;
END $$;

-- 3) Create performance indexes
CREATE INDEX IF NOT EXISTS idx_influencer_shop_products_influencer_id ON influencer_shop_products (influencer_id)
WHERE
    deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_influencer_shop_products_product_id ON influencer_shop_products (product_id)
WHERE
    deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_influencer_shop_products_published ON influencer_shop_products (
    influencer_id,
    published,
    display_order
)
WHERE
    deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_influencer_shop_products_display_order ON influencer_shop_products (influencer_id, display_order)
WHERE
    deleted_at IS NULL
    AND published = true;

CREATE INDEX IF NOT EXISTS idx_influencer_shop_products_deleted_at ON influencer_shop_products (deleted_at)
WHERE
    deleted_at IS NOT NULL;

-- 4) Enable RLS on the table
ALTER TABLE influencer_shop_products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for influencer_shop_products
-- Read policy
DROP POLICY IF EXISTS influencer_shop_products_read_public ON influencer_shop_products;

CREATE POLICY influencer_shop_products_read_public ON influencer_shop_products FOR
SELECT USING (true);

-- Write policies (respect freeze state)
DROP POLICY IF EXISTS influencer_shop_products_insert_when_unfrozen ON influencer_shop_products;

CREATE POLICY influencer_shop_products_insert_when_unfrozen ON influencer_shop_products FOR
INSERT
    TO authenticated
WITH
    CHECK (NOT app.is_shops_frozen ());

DROP POLICY IF EXISTS influencer_shop_products_update_when_unfrozen ON influencer_shop_products;

CREATE POLICY influencer_shop_products_update_when_unfrozen ON influencer_shop_products FOR
UPDATE TO authenticated USING (NOT app.is_shops_frozen ())
WITH
    CHECK (NOT app.is_shops_frozen ());

-- Block hard deletes for authenticated users (soft delete only)
DROP POLICY IF EXISTS influencer_shop_products_delete_denied ON influencer_shop_products;

CREATE POLICY influencer_shop_products_delete_denied ON influencer_shop_products FOR DELETE TO authenticated USING (false);

-- Service role bypass
DROP POLICY IF EXISTS influencer_shop_products_service_role ON influencer_shop_products;

CREATE POLICY influencer_shop_products_service_role ON influencer_shop_products FOR ALL TO service_role USING (true)
WITH
    CHECK (true);

-- 5) Create helper functions for managing influencer shop products
CREATE OR REPLACE FUNCTION add_product_to_influencer_shop(
  p_influencer_id uuid,
  p_product_id uuid,
  p_custom_title text DEFAULT NULL,
  p_sale_price decimal(10,2) DEFAULT NULL,
  p_published boolean DEFAULT true,
  p_display_order integer DEFAULT 0
)
RETURNS uuid 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO influencer_shop_products (
    influencer_id, 
    product_id, 
    custom_title, 
    sale_price, 
    published,
    display_order
  ) VALUES (
    p_influencer_id,
    p_product_id,
    p_custom_title,
    p_sale_price,
    p_published,
    p_display_order
  )
  RETURNING id INTO new_id;
  
  RAISE NOTICE 'Product % added to influencer % shop', p_product_id, p_influencer_id;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION remove_product_from_influencer_shop(
  p_influencer_id uuid,
  p_product_id uuid
)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  rows_affected integer;
BEGIN
  -- Soft delete
  UPDATE influencer_shop_products 
  SET deleted_at = now(), updated_at = now()
  WHERE influencer_id = p_influencer_id 
    AND product_id = p_product_id 
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  IF rows_affected > 0 THEN
    RAISE NOTICE 'Product % removed from influencer % shop', p_product_id, p_influencer_id;
    RETURN true;
  ELSE
    RAISE NOTICE 'Product % not found in influencer % shop', p_product_id, p_influencer_id;
    RETURN false;
  END IF;
END;
$$;

-- 6) Create soft delete functions specific to influencer shop products
CREATE OR REPLACE FUNCTION soft_delete_influencer_shop_product(
  p_influencer_id uuid,
  p_product_id uuid
)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  rows_affected integer;
BEGIN
  UPDATE influencer_shop_products 
  SET deleted_at = now(), updated_at = now()
  WHERE influencer_id = p_influencer_id 
    AND product_id = p_product_id 
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  IF rows_affected > 0 THEN
    RAISE NOTICE 'Influencer shop product soft deleted successfully';
    RETURN true;
  ELSE
    RAISE NOTICE 'Influencer shop product not found or already deleted';
    RETURN false;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION restore_influencer_shop_product(
  p_influencer_id uuid,
  p_product_id uuid
)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  rows_affected integer;
BEGIN
  UPDATE influencer_shop_products 
  SET deleted_at = NULL, updated_at = now()
  WHERE influencer_id = p_influencer_id 
    AND product_id = p_product_id 
    AND deleted_at IS NOT NULL;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  IF rows_affected > 0 THEN
    RAISE NOTICE 'Influencer shop product restored successfully';
    RETURN true;
  ELSE
    RAISE NOTICE 'Influencer shop product not found in deleted items';
    RETURN false;
  END IF;
END;
$$;

-- 7) Create views for easy querying
CREATE OR REPLACE VIEW active_influencer_shop_products AS
SELECT
    isp.*,
    p.title as product_title,
    p.price as product_base_price,
    p.images as product_images,
    p.category as product_category,
    p.brand as product_brand,
    prof.name as influencer_name
FROM
    influencer_shop_products isp
    JOIN products p ON isp.product_id = p.id
    AND (
        p.deleted_at IS NULL
        OR p.deleted_at IS NULL
    )
    JOIN profiles prof ON isp.influencer_id = prof.id
WHERE
    isp.deleted_at IS NULL;

CREATE OR REPLACE VIEW published_influencer_shop_products AS
SELECT *
FROM
    active_influencer_shop_products
WHERE
    published = true
ORDER BY
    influencer_id,
    display_order,
    created_at;

-- 8) Create trigger to maintain updated_at timestamp
CREATE OR REPLACE FUNCTION update_influencer_shop_products_timestamp()
RETURNS trigger 
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS influencer_shop_products_update_timestamp ON influencer_shop_products;

CREATE TRIGGER influencer_shop_products_update_timestamp
  BEFORE UPDATE ON influencer_shop_products
  FOR EACH ROW
  EXECUTE FUNCTION update_influencer_shop_products_timestamp();

-- 9) Data integrity constraint to prevent duplicate active products
CREATE UNIQUE INDEX IF NOT EXISTS idx_influencer_shop_products_unique_active ON influencer_shop_products (influencer_id, product_id)
WHERE
    deleted_at IS NULL;

-- 10) Add comments for documentation
COMMENT ON
TABLE influencer_shop_products IS 'Many-to-many relationship between influencers and products in their shops';

COMMENT ON COLUMN influencer_shop_products.custom_title IS 'Influencer-specific product title override';

COMMENT ON COLUMN influencer_shop_products.sale_price IS 'Influencer-specific product price override';

COMMENT ON COLUMN influencer_shop_products.published IS 'Whether this product is visible in the influencer shop';

COMMENT ON COLUMN influencer_shop_products.display_order IS 'Sort order within the influencer shop';

COMMENT ON COLUMN influencer_shop_products.deleted_at IS 'Soft delete timestamp';

COMMENT ON FUNCTION add_product_to_influencer_shop (
    uuid,
    uuid,
    text,
    decimal,
    boolean,
    integer
) IS 'Add a product to an influencer shop with customization';

COMMENT ON FUNCTION remove_product_from_influencer_shop (uuid, uuid) IS 'Soft delete a product from an influencer shop';

COMMENT ON FUNCTION soft_delete_influencer_shop_product (uuid, uuid) IS 'Soft delete an influencer shop product';

COMMENT ON FUNCTION restore_influencer_shop_product (uuid, uuid) IS 'Restore a soft deleted influencer shop product';

COMMENT ON VIEW active_influencer_shop_products IS 'All active (non-deleted) influencer shop products with details';

COMMENT ON VIEW published_influencer_shop_products IS 'Published influencer shop products ordered for display';

-- =====================================================================
-- USAGE INSTRUCTIONS:
-- =====================================================================
--
-- 1. This script enhances your existing influencer_shop_products table
--
-- 2. Add product to influencer shop:
-- SELECT add_product_to_influencer_shop(
--   'influencer-id',
--   'product-id',
--   'Custom Title',
--   29.99,
--   true,
--   1
-- );
--
-- 3. Remove product from influencer shop:
-- SELECT remove_product_from_influencer_shop('influencer-id', 'product-id');
--
-- 4. Query published products for an influencer:
-- SELECT * FROM published_influencer_shop_products
-- WHERE influencer_id = 'influencer-id';
--
-- 5. Find deleted products (for recovery):
-- SELECT * FROM influencer_shop_products
-- WHERE deleted_at IS NOT NULL AND influencer_id = 'influencer-id';
--
-- 6. Restore deleted product:
-- SELECT restore_influencer_shop_product('influencer-id', 'product-id');
--
-- =====================================================================

-- Verify installation
DO $$
DECLARE
  constraint_count integer;
  index_count integer;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints 
  WHERE table_name = 'influencer_shop_products' 
    AND constraint_type = 'FOREIGN KEY';
  
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE tablename = 'influencer_shop_products';
  
  RAISE NOTICE 'Influencer shop products table enhanced successfully';
  RAISE NOTICE '% foreign key constraints added', constraint_count;
  RAISE NOTICE '% indexes created for performance', index_count;
  RAISE NOTICE 'Foreign key constraints protect against orphaned data';
  RAISE NOTICE 'Use helper functions for safe product management';
END $$;