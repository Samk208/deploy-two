-- =====================================================================
-- SHOP-PRODUCT JOIN TABLE MIGRATION
-- =====================================================================
-- This migration creates a normalized join table for shop-product
-- relationships to replace the current shops.products JSONB array.
-- This provides foreign key constraints and prevents orphaned data.
--
-- Features:
-- - Normalized many-to-many relationship
-- - Foreign key constraints prevent orphaned data
-- - Cascade rules protect against accidental deletions
-- - Migration from existing JSONB array data
-- - Backward compatibility during transition
-- =====================================================================

-- 1) Create the normalized shop_products join table
CREATE TABLE IF NOT EXISTS shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL,
  product_id uuid NOT NULL,

-- Product customization fields (from current JSONB structure)
custom_title text,
sale_price decimal(10, 2),
published boolean NOT NULL DEFAULT true,
display_order integer DEFAULT 0,

-- Metadata
created_at timestamptz DEFAULT now(),
updated_at timestamptz DEFAULT now(),
deleted_at timestamptz, -- For soft deletes

-- Constraints
UNIQUE(shop_id, product_id) );

-- 2) Add foreign key constraints with appropriate cascade rules
-- Shop FK: CASCADE delete (if shop deleted, remove products from shop)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'shop_products_shop_id_fkey'
  ) THEN
    ALTER TABLE shop_products 
    ADD CONSTRAINT shop_products_shop_id_fkey 
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added shop_id foreign key with CASCADE delete';
  END IF;
END $$;

-- Product FK: RESTRICT delete (prevent deleting products used in shops)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'shop_products_product_id_fkey'
  ) THEN
    ALTER TABLE shop_products 
    ADD CONSTRAINT shop_products_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;
    RAISE NOTICE 'Added product_id foreign key with RESTRICT delete';
  END IF;
END $$;

-- 3) Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shop_products_shop_id ON shop_products (shop_id)
WHERE
    deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_shop_products_product_id ON shop_products (product_id)
WHERE
    deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_shop_products_published ON shop_products (
    shop_id,
    published,
    display_order
)
WHERE
    deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_shop_products_display_order ON shop_products (shop_id, display_order)
WHERE
    deleted_at IS NULL
    AND published = true;

-- 4) Enable RLS on the new table
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shop_products
-- Read policy
CREATE POLICY shop_products_read_public ON shop_products FOR
SELECT USING (true);

-- Write policies (respect freeze state)
CREATE POLICY shop_products_insert_when_unfrozen ON shop_products FOR
INSERT
    TO authenticated
WITH
    CHECK (NOT app.is_shops_frozen ());

CREATE POLICY shop_products_update_when_unfrozen ON shop_products FOR
UPDATE TO authenticated USING (NOT app.is_shops_frozen ())
WITH
    CHECK (NOT app.is_shops_frozen ());

-- Block hard deletes for authenticated users (soft delete only)
CREATE POLICY shop_products_delete_denied ON shop_products FOR DELETE TO authenticated USING (false);

-- Service role bypass
CREATE POLICY shop_products_service_role ON shop_products FOR ALL TO service_role USING (true)
WITH
    CHECK (true);

-- 5) Create migration function to move data from JSONB array to join table
CREATE OR REPLACE FUNCTION migrate_shop_products_from_jsonb()
RETURNS TABLE(
  shops_processed integer,
  products_migrated integer,
  errors_encountered integer
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  shop_record record;
  product_item jsonb;
  shops_count integer := 0;
  products_count integer := 0;
  errors_count integer := 0;
  product_uuid uuid;
BEGIN
  -- Process each shop with products array
  FOR shop_record IN 
    SELECT id, products 
    FROM shops 
    WHERE products IS NOT NULL 
    AND jsonb_array_length(products) > 0
  LOOP
    shops_count := shops_count + 1;
    
    -- Process each product in the array
    FOR product_item IN 
      SELECT * FROM jsonb_array_elements(shop_record.products)
    LOOP
      BEGIN
        -- Handle both string UUIDs and object structures
        IF jsonb_typeof(product_item) = 'string' THEN
          -- Simple string UUID format
          product_uuid := (product_item #>> '{}')::uuid;
          
          INSERT INTO shop_products (shop_id, product_id, published)
          VALUES (shop_record.id, product_uuid, true)
          ON CONFLICT (shop_id, product_id) DO NOTHING;
          
        ELSIF jsonb_typeof(product_item) = 'object' THEN
          -- Object format with custom fields
          product_uuid := (product_item ->> 'product_id')::uuid;
          
          INSERT INTO shop_products (
            shop_id, 
            product_id, 
            custom_title, 
            sale_price, 
            published
          ) VALUES (
            shop_record.id,
            product_uuid,
            product_item ->> 'custom_title',
            CASE 
              WHEN product_item ->> 'sale_price' IS NOT NULL 
              THEN (product_item ->> 'sale_price')::decimal(10,2)
              ELSE NULL 
            END,
            COALESCE((product_item ->> 'published')::boolean, true)
          )
          ON CONFLICT (shop_id, product_id) DO UPDATE SET
            custom_title = EXCLUDED.custom_title,
            sale_price = EXCLUDED.sale_price,
            published = EXCLUDED.published,
            updated_at = now();
        END IF;
        
        products_count := products_count + 1;
        
      EXCEPTION WHEN OTHERS THEN
        errors_count := errors_count + 1;
        RAISE WARNING 'Error migrating product for shop %: %', shop_record.id, SQLERRM;
      END;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Migration complete: % shops, % products, % errors', 
    shops_count, products_count, errors_count;
  
  RETURN QUERY SELECT shops_count, products_count, errors_count;
END;
$$;

-- 6) Create helper functions for managing shop products
CREATE OR REPLACE FUNCTION add_product_to_shop(
  p_shop_id uuid,
  p_product_id uuid,
  p_custom_title text DEFAULT NULL,
  p_sale_price decimal(10,2) DEFAULT NULL,
  p_published boolean DEFAULT true
)
RETURNS uuid 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO shop_products (
    shop_id, 
    product_id, 
    custom_title, 
    sale_price, 
    published
  ) VALUES (
    p_shop_id,
    p_product_id,
    p_custom_title,
    p_sale_price,
    p_published
  )
  RETURNING id INTO new_id;
  
  RAISE NOTICE 'Product % added to shop %', p_product_id, p_shop_id;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION remove_product_from_shop(
  p_shop_id uuid,
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
  UPDATE shop_products 
  SET deleted_at = now(), updated_at = now()
  WHERE shop_id = p_shop_id 
    AND product_id = p_product_id 
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  IF rows_affected > 0 THEN
    RAISE NOTICE 'Product % removed from shop %', p_product_id, p_shop_id;
    RETURN true;
  ELSE
    RAISE NOTICE 'Product % not found in shop %', p_product_id, p_shop_id;
    RETURN false;
  END IF;
END;
$$;

-- 7) Create views for easy querying
CREATE OR REPLACE VIEW active_shop_products AS
SELECT
    sp.*,
    p.title as product_title,
    p.price as product_base_price,
    p.images as product_images,
    p.category as product_category,
    s.name as shop_name,
    s.handle as shop_handle
FROM
    shop_products sp
    JOIN products p ON sp.product_id = p.id
    AND p.deleted_at IS NULL
    JOIN shops s ON sp.shop_id = s.id
    AND s.deleted_at IS NULL
WHERE
    sp.deleted_at IS NULL;

CREATE OR REPLACE VIEW published_shop_products AS
SELECT *
FROM active_shop_products
WHERE
    published = true
ORDER BY
    shop_id,
    display_order,
    created_at;

-- 8) Create trigger to maintain updated_at timestamp
CREATE OR REPLACE FUNCTION update_shop_products_timestamp()
RETURNS trigger 
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER shop_products_update_timestamp
  BEFORE UPDATE ON shop_products
  FOR EACH ROW
  EXECUTE FUNCTION update_shop_products_timestamp();

-- 9) Add comments for documentation
COMMENT ON
TABLE shop_products IS 'Normalized many-to-many relationship between shops and products';

COMMENT ON COLUMN shop_products.custom_title IS 'Shop-specific product title override';

COMMENT ON COLUMN shop_products.sale_price IS 'Shop-specific product price override';

COMMENT ON COLUMN shop_products.published IS 'Whether this product is visible in the shop';

COMMENT ON COLUMN shop_products.display_order IS 'Sort order within the shop';

COMMENT ON FUNCTION migrate_shop_products_from_jsonb () IS 'Migrate existing JSONB product arrays to normalized join table';

COMMENT ON FUNCTION add_product_to_shop (
    uuid,
    uuid,
    text,
    decimal,
    boolean
) IS 'Add a product to a shop with optional customization';

COMMENT ON FUNCTION remove_product_from_shop (uuid, uuid) IS 'Soft delete a product from a shop';

COMMENT ON VIEW active_shop_products IS 'All active (non-deleted) shop-product relationships with details';

COMMENT ON VIEW published_shop_products IS 'Published shop-product relationships ordered for display';

-- =====================================================================
-- MIGRATION INSTRUCTIONS:
-- =====================================================================
--
-- 1. Run this script to create the join table structure
--
-- 2. Migrate existing data:
-- SELECT * FROM migrate_shop_products_from_jsonb();
--
-- 3. Verify migration:
-- SELECT
--   (SELECT COUNT(*) FROM shop_products) as join_table_count,
--   (SELECT COUNT(*) FROM shops WHERE jsonb_array_length(products) > 0) as shops_with_products,
--   (SELECT SUM(jsonb_array_length(products)) FROM shops WHERE products IS NOT NULL) as total_jsonb_products;
--
-- 4. Update application code to use join table:
-- Instead of: UPDATE shops SET products = ... WHERE id = $1
-- Use: SELECT add_product_to_shop($1, $2, $3, $4, $5)
--
-- 5. Query examples:
-- -- Get all products in a shop:
-- SELECT * FROM published_shop_products WHERE shop_id = $1;
--
-- -- Add product to shop:
-- SELECT add_product_to_shop(shop_id, product_id, 'Custom Title', 29.99, true);
--
-- -- Remove product from shop:
-- SELECT remove_product_from_shop(shop_id, product_id);
--
-- 6. After full migration and testing, optionally:
-- -- Remove the old products column from shops table
-- -- ALTER TABLE shops DROP COLUMN products;
--
-- =====================================================================

-- Verify installation
DO $$
BEGIN
  RAISE NOTICE 'Shop-product join table created successfully';
  RAISE NOTICE 'Foreign key constraints protect against orphaned data';
  RAISE NOTICE 'Use migrate_shop_products_from_jsonb() to migrate existing data';
  RAISE NOTICE 'Use add_product_to_shop() and remove_product_from_shop() functions for operations';
END $$;