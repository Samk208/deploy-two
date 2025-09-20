-- supabase/seed-dev-data.sql
-- Development-only seed data. DO NOT run in production.
-- Guard: abort if app.environment indicates production. You can set this GUC per session:
--   SELECT set_config('app.environment', 'development', true);

DO $$
BEGIN
  IF COALESCE(current_setting('app.environment', true), '') ILIKE 'prod%' THEN
    RAISE EXCEPTION 'Refusing to run dev seed in production environment (app.environment=%).', current_setting('app.environment', true);
  END IF;
END $$;

-- Test auth user for local development ONLY. Prefer using Supabase Auth API/admin or dashboard.
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '12345678-1234-1234-1234-123456789012'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'supplier@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"name":"Test Supplier","role":"supplier"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Ensure profile exists for the test user
INSERT INTO public.profiles (id, name, role, verified) VALUES (
  '12345678-1234-1234-1234-123456789012'::uuid,
  'Test Supplier',
  'supplier',
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  verified = EXCLUDED.verified;

-- Seed demonstration products
INSERT INTO public.products (
  title,
  description,
  price,
  original_price,
  images,
  category,
  region,
  in_stock,
  stock_count,
  commission,
  active,
  supplier_id,
  sku
) VALUES 
(
  'Premium Headphones',
  'High-quality wireless headphones with noise cancellation',
  299.99,
  399.99,
  ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'],
  'Electronics',
  ARRAY['US', 'Canada'],
  true,
  50,
  15.0,
  true,
  '12345678-1234-1234-1234-123456789012'::uuid,
  'HP-001'
),
(
  'Stylish Backpack',
  'Durable backpack perfect for travel and daily use',
  79.99,
  99.99,
  ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500'],
  'Fashion',
  ARRAY['US', 'Europe'],
  true,
  25,
  12.0,
  true,
  '12345678-1234-1234-1234-123456789012'::uuid,
  'BP-002'
),
(
  'Smart Watch',
  'Feature-rich smartwatch with health tracking',
  249.99,
  299.99,
  ARRAY['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'],
  'Electronics',
  ARRAY['Worldwide'],
  true,
  30,
  20.0,
  true,
  '12345678-1234-1234-1234-123456789012'::uuid,
  'SW-003'
);

-- Dev influencer shop
INSERT INTO public.shops (
  influencer_id,
  handle,
  name,
  description,
  logo,
  banner
) VALUES (
  '12345678-1234-1234-1234-123456789012'::uuid,
  'techreviews',
  'Tech Reviews Shop',
  'Curated tech products reviewed and recommended',
  'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=200',
  'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800'
) ON CONFLICT DO NOTHING;

-- Link products to the dev influencer shop
INSERT INTO public.influencer_shop_products (
  influencer_id,
  product_id,
  published
)
SELECT 
  '12345678-1234-1234-1234-123456789012'::uuid,
  p.id,
  true
FROM public.products p 
WHERE p.title IN ('Premium Headphones', 'Smart Watch')
ON CONFLICT DO NOTHING;
