-- Migration: Fix FKs to auth.users and add auto-profile trigger + admin view
-- Safe to run multiple times (uses IF EXISTS and CREATE OR REPLACE where possible)

-- Phase 1: Fix foreign keys to reference auth.users
ALTER TABLE IF EXISTS public.products
  DROP CONSTRAINT IF EXISTS products_supplier_id_fkey,
  ADD CONSTRAINT products_supplier_id_fkey
    FOREIGN KEY (supplier_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.shops
  DROP CONSTRAINT IF EXISTS shops_influencer_id_fkey,
  ADD CONSTRAINT shops_influencer_id_fkey
    FOREIGN KEY (influencer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.orders
  DROP CONSTRAINT IF EXISTS orders_customer_id_fkey,
  ADD CONSTRAINT orders_customer_id_fkey
    FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.influencer_shop_products
  DROP CONSTRAINT IF EXISTS influencer_shop_products_influencer_id_fkey,
  ADD CONSTRAINT influencer_shop_products_influencer_id_fkey
    FOREIGN KEY (influencer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.commissions
  DROP CONSTRAINT IF EXISTS commissions_influencer_id_fkey,
  ADD CONSTRAINT commissions_influencer_id_fkey
    FOREIGN KEY (influencer_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  DROP CONSTRAINT IF EXISTS commissions_supplier_id_fkey,
  ADD CONSTRAINT commissions_supplier_id_fkey
    FOREIGN KEY (supplier_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Ensure profiles.id references auth.users
ALTER TABLE IF EXISTS public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey,
  ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Phase 2: Auto-profile creation trigger on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'User'),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Phase 3: Admin view that joins profiles with auth.users to expose email
CREATE OR REPLACE VIEW public.user_admin_view AS
SELECT
  p.id,
  au.email,
  p.name,
  p.role,
  p.verified,
  p.created_at,
  p.updated_at
FROM public.profiles p
JOIN auth.users au ON au.id = p.id;

-- Restrict read access: DO NOT expose to anon/authenticated; allow only admin-scoped roles
DO $$
BEGIN
  -- Revoke any broad grants
  BEGIN
    EXECUTE 'REVOKE SELECT ON public.user_admin_view FROM authenticated';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    EXECUTE 'REVOKE SELECT ON public.user_admin_view FROM anon';
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Grant only to admin roles (create roles out of band if needed)
  BEGIN
    EXECUTE 'GRANT SELECT ON public.user_admin_view TO admin';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    EXECUTE 'GRANT SELECT ON public.user_admin_view TO app_admin';
  EXCEPTION WHEN OTHERS THEN NULL; END;
END$$;

-- Phase 4: Optional indexes to keep things snappy
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON public.profiles(verified);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
