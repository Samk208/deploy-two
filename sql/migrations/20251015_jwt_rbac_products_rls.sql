-- JWT-based RLS for products (supplier owns rows; admin full)
-- Idempotent-ish: tries to drop and recreate with final form

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Helper exists from profiles migration; create defensively
CREATE OR REPLACE FUNCTION public.jwt_app_role() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT COALESCE( (auth.jwt() -> 'app_metadata' ->> 'role')::text, '' )
$$;

-- Drop overlapping policies if present to avoid duplicates
DO $$
BEGIN
  BEGIN EXECUTE 'DROP POLICY IF EXISTS products_supplier_read ON public.products'; EXCEPTION WHEN others THEN NULL; END;
  BEGIN EXECUTE 'DROP POLICY IF EXISTS products_supplier_write ON public.products'; EXCEPTION WHEN others THEN NULL; END;
  BEGIN EXECUTE 'DROP POLICY IF EXISTS products_supplier_update ON public.products'; EXCEPTION WHEN others THEN NULL; END;
  BEGIN EXECUTE 'DROP POLICY IF EXISTS products_supplier_delete ON public.products'; EXCEPTION WHEN others THEN NULL; END;
  BEGIN EXECUTE 'DROP POLICY IF EXISTS products_admin_all ON public.products'; EXCEPTION WHEN others THEN NULL; END;
END $$;

-- Suppliers: CRUD own rows
CREATE POLICY products_supplier_read ON public.products
FOR SELECT USING (public.jwt_app_role() = 'supplier' AND supplier_id = auth.uid());

CREATE POLICY products_supplier_write ON public.products
FOR INSERT WITH CHECK (public.jwt_app_role() = 'supplier' AND supplier_id = auth.uid());

CREATE POLICY products_supplier_update ON public.products
FOR UPDATE USING (public.jwt_app_role() = 'supplier' AND supplier_id = auth.uid())
WITH CHECK (public.jwt_app_role() = 'supplier' AND supplier_id = auth.uid());

CREATE POLICY products_supplier_delete ON public.products
FOR DELETE USING (public.jwt_app_role() = 'supplier' AND supplier_id = auth.uid());

-- Admin: full access via JWT claim
CREATE POLICY products_admin_all ON public.products
FOR ALL USING (public.jwt_app_role() = 'admin');