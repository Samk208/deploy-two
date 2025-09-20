-- Tighten products RLS to require supplier role (or admin) for writes

-- Consolidation note:
-- This migration is idempotent and non-destructive. It aligns policies to the
-- final role-aware form without dropping existing ones. If the policies already
-- exist (e.g., created by 20250917_fix_rls_products_insert.sql), we ALTER them;
-- otherwise we CREATE them. This avoids churn in the migration history.

DO $$
BEGIN
  -- INSERT policy: ensure role-aware WITH CHECK
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'products'
      AND policyname = 'Products insert by supplier or admin'
  ) THEN
    EXECUTE $$
      ALTER POLICY "Products insert by supplier or admin" ON public.products
      WITH CHECK (
        (
          auth.uid() = supplier_id
          AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supplier')
        )
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      )
    $$;
  ELSE
    EXECUTE $$
      CREATE POLICY "Products insert by supplier or admin" ON public.products
      FOR INSERT
      WITH CHECK (
        (
          auth.uid() = supplier_id
          AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supplier')
        )
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      )
    $$;
  END IF;

  -- UPDATE policy: ensure role-aware USING and WITH CHECK
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'products'
      AND policyname = 'Products update by supplier or admin'
  ) THEN
    EXECUTE $$
      ALTER POLICY "Products update by supplier or admin" ON public.products
      USING (
        (
          auth.uid() = supplier_id
          AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supplier')
        )
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      )
      WITH CHECK (
        (
          auth.uid() = supplier_id
          AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supplier')
        )
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      )
    $$;
  ELSE
    EXECUTE $$
      CREATE POLICY "Products update by supplier or admin" ON public.products
      FOR UPDATE
      USING (
        (
          auth.uid() = supplier_id
          AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supplier')
        )
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      )
      WITH CHECK (
        (
          auth.uid() = supplier_id
          AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supplier')
        )
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      )
    $$;
  END IF;

  -- DELETE policy: ensure role-aware USING
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'products'
      AND policyname = 'Products delete by supplier or admin'
  ) THEN
    EXECUTE $$
      ALTER POLICY "Products delete by supplier or admin" ON public.products
      USING (
        (
          auth.uid() = supplier_id
          AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supplier')
        )
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      )
    $$;
  ELSE
    EXECUTE $$
      CREATE POLICY "Products delete by supplier or admin" ON public.products
      FOR DELETE
      USING (
        (
          auth.uid() = supplier_id
          AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supplier')
        )
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      )
    $$;
  END IF;
END$$;
