-- CLEAN DATABASE FIX - Handles existing policies
-- Copy this into Supabase SQL Editor

-- Step 1: Drop existing policies (ignore errors if they don't exist)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can view active products" ON products;
    DROP POLICY IF EXISTS "Suppliers can manage own products" ON products;
    DROP POLICY IF EXISTS "Users can view profiles" ON users;
    DROP POLICY IF EXISTS "Users can update own profile" ON users;
    DROP POLICY IF EXISTS "Users can insert own profile" ON users;
    DROP POLICY IF EXISTS "Anyone can view active shops" ON shops;
    DROP POLICY IF EXISTS "Influencers can manage own shops" ON shops;
    DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
    DROP POLICY IF EXISTS "Customers can create orders" ON orders;
    DROP POLICY IF EXISTS "Users can view own commissions" ON commissions;
EXCEPTION 
    WHEN OTHERS THEN NULL;
END $$;

-- Step 2: Create fresh policies
CREATE POLICY "Anyone can view active products" ON products 
FOR SELECT USING (active = true);

CREATE POLICY "Suppliers can manage own products" ON products 
FOR ALL USING (supplier_id = auth.uid());

CREATE POLICY "Users can view profiles" ON users 
FOR SELECT USING (auth.uid() = id OR verified = true);

CREATE POLICY "Users can update own profile" ON users 
FOR UPDATE USING (auth.uid() = id);

-- Step 3: Add test users (only if they don't exist)
INSERT INTO users (id, email, name, role, verified, avatar) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'supplier@test.com', 'TechGear Supplier', 'supplier', true, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150')
ON CONFLICT (id) DO NOTHING;

-- Step 4: Add test products
INSERT INTO products (
  title, description, price, original_price, images, category, region,
  in_stock, stock_count, commission, active, supplier_id, sku
) VALUES 
(
  'Wireless Gaming Headset',
  'Premium wireless gaming headset with noise cancellation',
  149.99,
  199.99,
  ARRAY['https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=500'],
  'Electronics',
  ARRAY['US', 'EU'],
  true,
  25,
  15.00,
  true,
  '550e8400-e29b-41d4-a716-446655440001',
  'HEADSET-001'
),
(
  'Cotton T-Shirt Premium',
  'Ultra-soft premium cotton t-shirt with modern fit',
  39.99,
  49.99,
  ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'],
  'Fashion',
  ARRAY['US', 'EU'],
  true,
  50,
  20.00,
  true,
  '550e8400-e29b-41d4-a716-446655440001',
  'TSHIRT-001'
),
(
  'Smart Fitness Tracker',
  'Advanced fitness tracker with heart rate monitoring',
  99.99,
  129.99,
  ARRAY['https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500'],
  'Sports',
  ARRAY['US'],
  true,
  30,
  18.00,
  true,
  '550e8400-e29b-41d4-a716-446655440001',
  'FITNESS-001'
)
ON CONFLICT (supplier_id, sku) DO NOTHING;

-- Step 5: Verify the data
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN active = true THEN 1 END) as active_products,
  COUNT(CASE WHEN in_stock = true THEN 1 END) as in_stock_products
FROM products;

-- Show the products we just added
SELECT title, price, category, in_stock, active 
FROM products 
WHERE supplier_id = '550e8400-e29b-41d4-a716-446655440001'
ORDER BY created_at DESC;