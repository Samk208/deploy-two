-- =====================================================================
-- SUPABASE DATABASE-LEVEL SHOP FREEZE PROTECTION
-- =====================================================================
-- This script implements Row Level Security (RLS) to protect shop data
-- even if the application code misbehaves or has bugs.
--
-- Features:
-- - Database-level freeze flag independent of app
-- - RLS policies block writes when frozen
-- - Service role bypass for emergency operations
-- - Read operations continue during freeze
-- =====================================================================

-- 1) Create app schema and flags table for database-level feature flags
CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE IF NOT EXISTS app.flags (
    name text PRIMARY KEY,
    enabled boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Insert shop freeze flag (default disabled)
INSERT INTO
    app.flags (name, enabled)
VALUES ('shops_freeze', false) ON CONFLICT (name) DO
UPDATE
SET
    enabled = EXCLUDED.enabled,
    updated_at = now();

-- Helper function to check if shops are frozen
CREATE OR REPLACE FUNCTION app.is_shops_frozen()
RETURNS boolean 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT enabled FROM app.flags WHERE name = 'shops_freeze'), 
    false
  )
$$;

-- Add comment for documentation
COMMENT ON FUNCTION app.is_shops_frozen () IS 'Returns true if shop operations are frozen at database level';

-- 2) Enable Row Level Security on critical tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- If you have influencer_shop_products table (curation)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'influencer_shop_products') THEN
    EXECUTE 'ALTER TABLE influencer_shop_products ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- 3) Create read policies (allow public/authenticated reads)
-- Products read policy
DROP POLICY IF EXISTS products_read_public ON products;

CREATE POLICY products_read_public ON products FOR
SELECT USING (true);

-- Shops read policy
DROP POLICY IF EXISTS shops_read_public ON shops;

CREATE POLICY shops_read_public ON shops FOR
SELECT USING (true);

-- Influencer shop products read policy
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'influencer_shop_products') THEN
    EXECUTE 'DROP POLICY IF EXISTS influencer_shop_products_read_public ON influencer_shop_products';
    EXECUTE 'CREATE POLICY influencer_shop_products_read_public ON influencer_shop_products FOR SELECT USING (true)';
  END IF;
END $$;

-- 4) Create write policies that respect freeze state
-- PRODUCTS write policies
DROP POLICY IF EXISTS products_insert_when_unfrozen ON products;
CREATE POLICY products_insert_when_unfrozen ON products
  FOR INSERT 
  TO authenticated 
  WITH CHECK (NOT app.is_shops_frozen());

DROP POLICY IF EXISTS products_update_when_unfrozen ON products;
CREATE POLICY products_update_when_unfrozen ON products
  FOR UPDATE 
  TO authenticated 
  USING (NOT app.is_shops_frozen()) 
  WITH CHECK (NOT app.is_shops_frozen());

DROP POLICY IF EXISTS products_delete_when_unfrozen ON products;
CREATE POLICY products_delete_when_unfrozen ON products
  FOR DELETE 
  TO authenticated 
  USING (NOT app.is_shops_frozen());

-- SHOPS write policies
DROP POLICY IF EXISTS shops_insert_when_unfrozen ON shops;
CREATE POLICY shops_insert_when_unfrozen ON shops
  FOR INSERT 
  TO authenticated 
  WITH CHECK (NOT app.is_shops_frozen());

DROP POLICY IF EXISTS shops_update_when_unfrozen ON shops;
CREATE POLICY shops_update_when_unfrozen ON shops
  FOR UPDATE 
  TO authenticated 
  USING (NOT app.is_shops_frozen()) 
  WITH CHECK (NOT app.is_shops_frozen());

DROP POLICY IF EXISTS shops_delete_when_unfrozen ON shops;
CREATE POLICY shops_delete_when_unfrozen ON shops
  FOR DELETE 
  TO authenticated 
  USING (NOT app.is_shops_frozen());

-- INFLUENCER_SHOP_PRODUCTS write policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'influencer_shop_products') THEN
    EXECUTE 'DROP POLICY IF EXISTS influencer_shop_products_insert_when_unfrozen ON influencer_shop_products';
    EXECUTE 'CREATE POLICY influencer_shop_products_insert_when_unfrozen ON influencer_shop_products FOR INSERT TO authenticated WITH CHECK (NOT app.is_shops_frozen())';
    
    EXECUTE 'DROP POLICY IF EXISTS influencer_shop_products_update_when_unfrozen ON influencer_shop_products';
    EXECUTE 'CREATE POLICY influencer_shop_products_update_when_unfrozen ON influencer_shop_products FOR UPDATE TO authenticated USING (NOT app.is_shops_frozen()) WITH CHECK (NOT app.is_shops_frozen())';
    
    EXECUTE 'DROP POLICY IF EXISTS influencer_shop_products_delete_when_unfrozen ON influencer_shop_products';
    EXECUTE 'CREATE POLICY influencer_shop_products_delete_when_unfrozen ON influencer_shop_products FOR DELETE TO authenticated USING (NOT app.is_shops_frozen())';
  END IF;
END $$;

-- 5) Create service_role bypass policies for emergency operations
-- Service role can always read/write regardless of freeze state
DROP POLICY IF EXISTS products_service_role ON products;
CREATE POLICY products_service_role ON products 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS shops_service_role ON shops;
CREATE POLICY shops_service_role ON shops 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'influencer_shop_products') THEN
    EXECUTE 'DROP POLICY IF EXISTS influencer_shop_products_service_role ON influencer_shop_products';
    EXECUTE 'CREATE POLICY influencer_shop_products_service_role ON influencer_shop_products FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- 6) Create utility functions for freeze management
CREATE OR REPLACE FUNCTION app.freeze_shops()
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER
AS $$
  UPDATE app.flags 
  SET enabled = true, updated_at = now() 
  WHERE name = 'shops_freeze'
  RETURNING enabled;
$$;

CREATE OR REPLACE FUNCTION app.unfreeze_shops()
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER
AS $$
  UPDATE app.flags 
  SET enabled = false, updated_at = now() 
  WHERE name = 'shops_freeze'
  RETURNING NOT enabled;
$$;

-- Add comments
COMMENT ON FUNCTION app.freeze_shops () IS 'Activate database-level shop freeze protection';

COMMENT ON FUNCTION app.unfreeze_shops () IS 'Deactivate database-level shop freeze protection';

-- 7) Create audit log for freeze state changes
CREATE TABLE IF NOT EXISTS app.freeze_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    flag_name text NOT NULL,
    old_state boolean,
    new_state boolean,
    changed_by uuid,
    changed_at timestamptz DEFAULT now(),
    reason text
);

-- Create trigger to log freeze state changes
CREATE OR REPLACE FUNCTION app.log_freeze_changes()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.enabled IS DISTINCT FROM NEW.enabled THEN
    INSERT INTO app.freeze_audit (flag_name, old_state, new_state, changed_by, reason)
    VALUES (NEW.name, OLD.enabled, NEW.enabled, auth.uid(), 'Database freeze state change');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS freeze_audit_trigger ON app.flags;

CREATE TRIGGER freeze_audit_trigger
  AFTER UPDATE ON app.flags
  FOR EACH ROW
  EXECUTE FUNCTION app.log_freeze_changes();

-- =====================================================================
-- USAGE INSTRUCTIONS:
-- =====================================================================
--
-- To ACTIVATE freeze protection:
-- SELECT app.freeze_shops();
--
-- To DEACTIVATE freeze protection:
-- SELECT app.unfreeze_shops();
--
-- To CHECK current freeze status:
-- SELECT app.is_shops_frozen();
--
-- To VIEW freeze history:
-- SELECT * FROM app.freeze_audit ORDER BY changed_at DESC;
--
-- EMERGENCY BYPASS (service_role only):
-- All service_role operations bypass freeze restrictions
--
-- =====================================================================

-- Verify installation
DO $$
DECLARE
  freeze_status boolean;
BEGIN
  SELECT app.is_shops_frozen() INTO freeze_status;
  RAISE NOTICE 'Shop freeze protection installed successfully. Current status: %', 
    CASE WHEN freeze_status THEN 'FROZEN' ELSE 'UNFROZEN' END;
  RAISE NOTICE 'Use SELECT app.freeze_shops(); to activate protection';
  RAISE NOTICE 'Use SELECT app.unfreeze_shops(); to deactivate protection';
END $$;