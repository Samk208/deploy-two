-- Schema validation script for vo-onelink-google
-- Run this in the Supabase SQL Editor after executing setup-auth-compatible.sql

-- 1) Quick overview: tables present in public
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2) auth.users columns snapshot
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- 3) Profiles shape
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 4) Products shape
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'products'
ORDER BY ordinal_position;

-- 5) Orders shape
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orders'
ORDER BY ordinal_position;

-- 6) Shops shape
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'shops'
ORDER BY ordinal_position;

-- 7) Influencer shop products shape
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'influencer_shop_products'
ORDER BY ordinal_position;

-- 8) Commissions shape
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'commissions'
ORDER BY ordinal_position;

-- 9) Verification requests shape
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'verification_requests'
ORDER BY ordinal_position;

-- 10) Verification documents shape
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'verification_documents'
ORDER BY ordinal_position;

-- 11) Indexes of interest
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_profiles_role',
    'idx_products_supplier','idx_products_category','idx_products_active',
    'idx_orders_customer','idx_orders_status',
    'idx_shops_influencer','idx_shops_handle',
    'idx_influencer_shop_products_influencer','idx_influencer_shop_products_product',
    'idx_commissions_order','idx_commissions_status',
    'idx_verification_requests_user','idx_verification_requests_status',
    'idx_verification_documents_request'
  )
ORDER BY indexname;

-- 12) RLS status overview
SELECT relname AS table_name, relrowsecurity AS rls_enabled
FROM pg_class
JOIN pg_namespace ns ON ns.oid = pg_class.relnamespace
WHERE ns.nspname = 'public'
  AND relkind = 'r'
  AND relname IN ('profiles','products','orders','shops','influencer_shop_products','commissions','verification_requests','verification_documents')
ORDER BY relname;

-- 13) Spot-check policies that reference profiles.role (ensure column exists)
SELECT polname, polrelid::regclass AS table_name, polcmd, polpermissive, polqual, polwithcheck
FROM pg_policy
WHERE polrelid::regclass::text IN ('profiles','products','orders','shops','influencer_shop_products','commissions','verification_requests','verification_documents')
ORDER BY polrelid::regclass::text, polname;

-- 14) Assert required columns exist (raises exception if missing)
DO $$
DECLARE
  missing TEXT[] := ARRAY[]::TEXT[];
  _col TEXT;
BEGIN
  -- profiles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='role') THEN
    missing := missing || 'profiles.role';
  END IF;

  -- products
  FOREACH _col IN ARRAY ARRAY['title','description','price','category','active','supplier_id'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name=_col
    ) THEN
      missing := missing || ('products.' || _col);
    END IF;
  END LOOP;

  -- orders
  FOREACH _col IN ARRAY ARRAY['customer_id','items','total','status','payment_method'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name=_col
    ) THEN
      missing := missing || ('orders.' || _col);
    END IF;
  END LOOP;

  -- commissions
  FOREACH _col IN ARRAY ARRAY['order_id','supplier_id','product_id','amount','rate','status'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='commissions' AND column_name=_col
    ) THEN
      missing := missing || ('commissions.' || _col);
    END IF;
  END LOOP;

  -- verification_requests
  FOREACH _col IN ARRAY ARRAY['user_id','role','status'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='verification_requests' AND column_name=_col
    ) THEN
      missing := missing || ('verification_requests.' || _col);
    END IF;
  END LOOP;

  -- verification_documents
  FOREACH _col IN ARRAY ARRAY['request_id','doc_type','storage_path','mime_type','size_bytes','status'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='verification_documents' AND column_name=_col
    ) THEN
      missing := missing || ('verification_documents.' || _col);
    END IF;
  END LOOP;

  IF array_length(missing,1) IS NOT NULL THEN
    RAISE EXCEPTION 'Missing required columns: %', array_to_string(missing, ', ');
  ELSE
    RAISE NOTICE 'All required columns are present.';
  END IF;
END $$;
