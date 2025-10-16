-- Lock profiles.role to UX roles and add JWT helper
-- Idempotent migration; safe to rerun

-- 1) Enum for UX roles only
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('customer','supplier','influencer');
  END IF;
END $$;

-- 2) Cast profiles.role -> user_role if exists and not already
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='role'
  ) THEN
    BEGIN
      ALTER TABLE public.profiles ALTER COLUMN role TYPE user_role USING role::user_role;
    EXCEPTION WHEN others THEN NULL;
    END;
  END IF;
END $$;

-- 3) Ensure RLS enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4) JWT helper to read app_metadata.role
CREATE OR REPLACE FUNCTION public.jwt_app_role() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT COALESCE( (auth.jwt() -> 'app_metadata' ->> 'role')::text, '' )
$$;

-- 5) Policies: self-read; self-update without role change; admin-update without role change
DO $$
BEGIN
  -- self read
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_select_self'
  ) THEN
    CREATE POLICY profiles_select_self ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;

  -- self update no role change
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_update_self_no_role'
  ) THEN
    CREATE POLICY profiles_update_self_no_role ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND (role IS NOT DISTINCT FROM old.role));
  END IF;

  -- admin update no role change (admin from JWT)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_update_admin_no_role'
  ) THEN
    CREATE POLICY profiles_update_admin_no_role ON public.profiles
    FOR UPDATE USING (public.jwt_app_role() = 'admin')
    WITH CHECK (role IS NOT DISTINCT FROM old.role);
  END IF;
END $$;