-- Local-only seed: requires a local Auth user created via Admin API or Studio
-- This script will use that user's id to insert example products

DO $$
DECLARE
  v_supplier_id uuid;
BEGIN
  -- Find supplier user created in local Auth (via Studio or Admin API)
  SELECT id INTO v_supplier_id FROM auth.users WHERE email = 'supplier@example.com';
  IF v_supplier_id IS NULL THEN
    RAISE EXCEPTION 'Seed precondition failed: create local auth user supplier@example.com first (Admin API or Studio)';
  END IF;

  -- Insert sample products (primary_image is computed from images[1])
  INSERT INTO public.products
    (title, description, price, original_price, images, category, region, in_stock, stock_count, commission, active, supplier_id, short_description, brand)
  VALUES
    ('Wireless Bluetooth Headphones', 'Noise-cancelling headphones', 149.99, 199.99,
      ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'], 'Electronics', ARRAY['US'], true, 50, 15, true, v_supplier_id, 'Premium ANC', 'Sony'),
    ('Smart Fitness Watch', 'GPS fitness tracker', 199.99, 299.99,
      ARRAY['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'], 'Electronics', ARRAY['US'], true, 30, 18, true, v_supplier_id, 'All‑day health', 'Apple'),
    ('Portable Bluetooth Speaker', 'Waterproof speaker', 79.99, 119.99,
      ARRAY['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800'], 'Electronics', ARRAY['US'], true, 35, 20, true, v_supplier_id, '360° sound', 'Bose')
  ON CONFLICT DO NOTHING;
END $$;