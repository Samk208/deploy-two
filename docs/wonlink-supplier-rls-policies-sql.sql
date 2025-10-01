-- Supplier RLS policies (ownership by products.supplier_id)
-- Usage: execute in Supabase SQL editor or via CLI (psql)

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
-- Optional: force RLS even for table owners
-- ALTER TABLE public.products FORCE ROW LEVEL SECURITY;

-- Suppliers can read their own products
CREATE POLICY supplier_select_own_products ON public.products FOR
SELECT USING (auth.uid () = supplier_id);

-- Suppliers can insert only rows they own
CREATE POLICY supplier_insert_own_products ON public.products FOR
INSERT
WITH
    CHECK (auth.uid () = supplier_id);

-- Suppliers can update only rows they own
CREATE POLICY supplier_update_own_products ON public.products FOR
UPDATE USING (auth.uid () = supplier_id)
WITH
    CHECK (auth.uid () = supplier_id);

-- Suppliers can delete only rows they own
CREATE POLICY supplier_delete_own_products ON public.products FOR DELETE USING (auth.uid () = supplier_id);

-- Notes:
-- 1) Admin/service-role bypasses RLS automatically via the service key.
-- 2) Our API handlers filter by products.supplier_id = user.id already.
-- 3) Orders currently do not carry supplier linkage in the typed schema. If you later
--    need supplier-scoped orders under RLS, consider:
--    - Adding a linking table/view (e.g. order_items with product_id), and
--    - Creating RLS policies on that relation keyed by products.supplier_id.
--    The dashboard endpoint is designed to avoid joins that would violate RLS.