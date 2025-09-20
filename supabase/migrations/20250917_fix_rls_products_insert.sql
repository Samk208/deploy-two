-- Tighten RLS on products: require WITH CHECK for inserts/updates
-- to ensure only suppliers/admins can create or modify products.

-- Keep public read policy for active products (already exists in base setup),
-- but replace the broad FOR ALL policy with explicit ones.

DROP POLICY IF EXISTS "Suppliers can manage own products" ON public.products;

-- Allow suppliers and admins to insert products only for themselves
CREATE POLICY "Products insert by supplier or admin"
ON public.products
FOR INSERT
WITH CHECK (
  (
    auth.uid() = supplier_id
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supplier')
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Allow suppliers and admins to update products they own
CREATE POLICY "Products update by supplier or admin"
ON public.products
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
);

-- Allow suppliers and admins to delete products they own
CREATE POLICY "Products delete by supplier or admin"
ON public.products
FOR DELETE
USING (
  (
    auth.uid() = supplier_id
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supplier')
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
