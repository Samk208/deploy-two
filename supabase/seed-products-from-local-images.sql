-- supabase/seed-products-from-local-images.sql
-- Purpose: Ensure ~10 products with 3 images each using local repo images under public/seed-images
-- Safety: Run only in local development (uses image paths like /seed-images/..). Set GUC:
--   SELECT set_config('app.environment', 'development', true);

DO $$
DECLARE
  v_env TEXT := COALESCE(current_setting('app.environment', true), '');
  v_supplier UUID;
BEGIN
  IF v_env ILIKE 'prod%' THEN
    RAISE EXCEPTION 'Refusing to run dev seed in production (app.environment=%).', v_env;
  END IF;

  SELECT id INTO v_supplier FROM auth.users WHERE email = 'supplier@example.com';
  IF v_supplier IS NULL THEN
    RAISE EXCEPTION 'Supplier user missing. Run supabase/seed-ensure-users.sql first.';
  END IF;

  -- Helper to upsert a product by SKU, set images, and recompute primary_image
  -- Note: primary_image is generated/guarded; set images and use DEFAULT for primary_image on update

  -- 1) JBL Flip 6
  INSERT INTO public.products (
    title, sku, price, original_price, images, category, region, in_stock, stock_count, commission, active, supplier_id, short_description, brand
  ) SELECT 'JBL Flip 6 Bluetooth Speaker','JBL-FLIP6',99.99,129.99,
           ARRAY['/seed-images/jbl-flip6/front.jpg','/seed-images/jbl-flip6/lifestyle.jpg','/seed-images/jbl-flip6/side.jpg'],
           'Electronics', ARRAY['US'], true, 50, 15, true, v_supplier, 'Portable waterproof speaker','JBL'
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku='JBL-FLIP6');
  UPDATE public.products SET images=ARRAY['/seed-images/jbl-flip6/front.jpg','/seed-images/jbl-flip6/lifestyle.jpg','/seed-images/jbl-flip6/side.jpg'], primary_image=DEFAULT WHERE sku='JBL-FLIP6';

  -- 2) Bose QC45
  INSERT INTO public.products (title, sku, price, original_price, images, category, region, in_stock, stock_count, commission, active, supplier_id, short_description, brand)
  SELECT 'Bose QuietComfort 45','BOSE-QC45',299.00,349.00,
         ARRAY['/seed-images/bose-qc45/main.jpg','/seed-images/bose-qc45/lifestyle.jpg','/seed-images/bose-qc45/detail.jpg'],
         'Electronics', ARRAY['US'], true, 25, 15, true, v_supplier, 'Noise cancelling over-ear','Bose'
  WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku='BOSE-QC45');
  UPDATE public.products SET images=ARRAY['/seed-images/bose-qc45/main.jpg','/seed-images/bose-qc45/lifestyle.jpg','/seed-images/bose-qc45/detail.jpg'], primary_image=DEFAULT WHERE sku='BOSE-QC45';

  -- 3) Sony XM5
  INSERT INTO public.products (title, sku, price, original_price, images, category, region, in_stock, stock_count, commission, active, supplier_id, short_description, brand)
  SELECT 'Sony WH-1000XM5','SONY-XM5',349.99,399.99,
         ARRAY['/seed-images/sony-xm5/front.jpg','/seed-images/sony-xm5/side.jpg','/seed-images/sony-xm5/case.jpg'],
         'Electronics', ARRAY['US'], true, 35, 18, true, v_supplier, 'Industry-leading ANC','Sony'
  WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku='SONY-XM5');
  UPDATE public.products SET images=ARRAY['/seed-images/sony-xm5/front.jpg','/seed-images/sony-xm5/side.jpg','/seed-images/sony-xm5/case.jpg'], primary_image=DEFAULT WHERE sku='SONY-XM5';

  -- 4) Logitech MX Master 3S
  INSERT INTO public.products (title, sku, price, original_price, images, category, region, in_stock, stock_count, commission, active, supplier_id, short_description, brand)
  SELECT 'Logitech MX Master 3S','LOGI-MX-3S',99.99,119.99,
         ARRAY['/seed-images/logi-mx-master-3s/detail.jpg','/seed-images/logi-mx-master-3s/side.jpg','/seed-images/logi-mx-master-3s/top.jpg'],
         'Electronics', ARRAY['US'], true, 40, 12, true, v_supplier, 'Ergo productivity mouse','Logitech'
  WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku='LOGI-MX-3S');
  UPDATE public.products SET images=ARRAY['/seed-images/logi-mx-master-3s/detail.jpg','/seed-images/logi-mx-master-3s/side.jpg','/seed-images/logi-mx-master-3s/top.jpg'], primary_image=DEFAULT WHERE sku='LOGI-MX-3S';

  -- 5) Keychron K2
  INSERT INTO public.products (title, sku, price, original_price, images, category, region, in_stock, stock_count, commission, active, supplier_id, short_description, brand)
  SELECT 'Keychron K2','KEYCHRON-K2',79.99,89.99,
         ARRAY['/seed-images/keychron-k2/main.jpg','/seed-images/keychron-k2/angle.jpg','/seed-images/keychron-k2/close.jpg'],
         'Electronics', ARRAY['US'], true, 30, 12, true, v_supplier, 'Compact mechanical keyboard','Keychron'
  WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku='KEYCHRON-K2');
  UPDATE public.products SET images=ARRAY['/seed-images/keychron-k2/main.jpg','/seed-images/keychron-k2/angle.jpg','/seed-images/keychron-k2/close.jpg'], primary_image=DEFAULT WHERE sku='KEYCHRON-K2';

  -- 6) Apple Watch S9
  INSERT INTO public.products (title, sku, price, original_price, images, category, region, in_stock, stock_count, commission, active, supplier_id, short_description, brand)
  SELECT 'Apple Watch Series 9','APPLE-WATCH-S9',399.00,449.00,
         ARRAY['/seed-images/apple-watch-s9/front.jpg','/seed-images/apple-watch-s9/side.jpg','/seed-images/apple-watch-s9/detail.jpg'],
         'Wearables', ARRAY['US'], true, 20, 15, true, v_supplier, 'Advanced health features','Apple'
  WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku='APPLE-WATCH-S9');
  UPDATE public.products SET images=ARRAY['/seed-images/apple-watch-s9/front.jpg','/seed-images/apple-watch-s9/side.jpg','/seed-images/apple-watch-s9/detail.jpg'], primary_image=DEFAULT WHERE sku='APPLE-WATCH-S9';

  -- 7) Adidas Ultraboost
  INSERT INTO public.products (title, sku, price, original_price, images, category, region, in_stock, stock_count, commission, active, supplier_id, short_description, brand)
  SELECT 'Adidas Ultraboost','ADIDAS-ULTRA',159.99,189.99,
         ARRAY['/seed-images/adidas-ultraboost/main.jpg','/seed-images/adidas-ultraboost/angle.jpg','/seed-images/adidas-ultraboost/lifestyle.jpg'],
         'Footwear', ARRAY['US'], true, 28, 12, true, v_supplier, 'Responsive running shoes','Adidas'
  WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku='ADIDAS-ULTRA');
  UPDATE public.products SET images=ARRAY['/seed-images/adidas-ultraboost/main.jpg','/seed-images/adidas-ultraboost/angle.jpg','/seed-images/adidas-ultraboost/lifestyle.jpg'], primary_image=DEFAULT WHERE sku='ADIDAS-ULTRA';

  -- 8) Nike Air Force 1
  INSERT INTO public.products (title, sku, price, original_price, images, category, region, in_stock, stock_count, commission, active, supplier_id, short_description, brand)
  SELECT 'Nike Air Force 1','NIKE-AF1',110.00,130.00,
         ARRAY['/seed-images/nike-af1/main.jpg','/seed-images/nike-af1/side.jpg','/seed-images/nike-af1/detail.jpg'],
         'Footwear', ARRAY['US'], true, 34, 12, true, v_supplier, 'Classic everyday sneakers','Nike'
  WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku='NIKE-AF1');
  UPDATE public.products SET images=ARRAY['/seed-images/nike-af1/main.jpg','/seed-images/nike-af1/side.jpg','/seed-images/nike-af1/detail.jpg'], primary_image=DEFAULT WHERE sku='NIKE-AF1';

  -- 9) Hydro Flask 32oz
  INSERT INTO public.products (title, sku, price, original_price, images, category, region, in_stock, stock_count, commission, active, supplier_id, short_description, brand)
  SELECT 'Hydro Flask 32oz','HYDRO-FLASK-32',44.95,54.95,
         ARRAY['/seed-images/hydro-flask/main.jpg','/seed-images/hydro-flask/color.jpg','/seed-images/hydro-flask/lifestyle.jpg'],
         'Accessories', ARRAY['US'], true, 60, 10, true, v_supplier, 'Insulated stainless bottle','Hydro Flask'
  WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku='HYDRO-FLASK-32');
  UPDATE public.products SET images=ARRAY['/seed-images/hydro-flask/main.jpg','/seed-images/hydro-flask/color.jpg','/seed-images/hydro-flask/lifestyle.jpg'], primary_image=DEFAULT WHERE sku='HYDRO-FLASK-32';

  -- 10) Peak Design Everyday Backpack v2
  INSERT INTO public.products (title, sku, price, original_price, images, category, region, in_stock, stock_count, commission, active, supplier_id, short_description, brand)
  SELECT 'Peak Design Everyday Backpack v2','PD-EBP-V2',279.95,299.95,
         ARRAY['/seed-images/pd-everyday-bp-v2/front.jpg','/seed-images/pd-everyday-bp-v2/back.jpg','/seed-images/pd-everyday-bp-v2/detail.jpg'],
         'Accessories', ARRAY['US'], true, 18, 12, true, v_supplier, 'Versatile camera/day pack','Peak Design'
  WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku='PD-EBP-V2');
  UPDATE public.products SET images=ARRAY['/seed-images/pd-everyday-bp-v2/front.jpg','/seed-images/pd-everyday-bp-v2/back.jpg','/seed-images/pd-everyday-bp-v2/detail.jpg'], primary_image=DEFAULT WHERE sku='PD-EBP-V2';

  RAISE NOTICE '✅ Seeded/updated ~10 products with local images.';
END $$;