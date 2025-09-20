-- ============================================
-- AUTH-COMPATIBLE DATABASE SETUP
-- ============================================
-- This file works with Supabase auth.users table structure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- CREATE CUSTOM USERS PROFILE TABLE
-- ============================================

-- Create a profiles table that extends auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  role TEXT CHECK (role IN ('supplier', 'influencer', 'customer', 'admin')),
  avatar TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure required columns exist on profiles even if the table pre-existed without them
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS avatar TEXT,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ensure the role check constraint exists (name it deterministically)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_check'
  ) THEN
    -- Drop any anonymous check constraint that may conflict, then add ours
    -- Note: This is conservative; if another constraint already enforces the same domain, this will simply add another named one.
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_role_check CHECK (role IN ('supplier', 'influencer', 'customer', 'admin'));
  END IF;
END $$;

-- ============================================
-- CREATE APPLICATION TABLES
-- ============================================

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  original_price DECIMAL(10,2) CHECK (original_price >= 0),
  images TEXT[] DEFAULT '{}',
  category TEXT NOT NULL,
  region TEXT[] DEFAULT '{}',
  in_stock BOOLEAN DEFAULT true,
  stock_count INTEGER DEFAULT 0 CHECK (stock_count >= 0),
  commission DECIMAL(5,2) DEFAULT 10 CHECK (commission >= 0 AND commission <= 100),
  active BOOLEAN DEFAULT true,
  supplier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sku TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure required columns exist on products even if the table pre-existed without them
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS stock_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission DECIMAL(5,2) DEFAULT 10,
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS supplier_id UUID,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- If supplier_id exists but lacks FK, try to add it safely
DO $$
BEGIN
  -- Add FK only if products.supplier_id exists and there is no existing FK named products_supplier_id_fkey
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'supplier_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints c
    WHERE c.table_schema = 'public' AND c.table_name = 'products' AND c.constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_supplier_id_fkey
      FOREIGN KEY (supplier_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  shipping_address JSONB DEFAULT '{}',
  billing_address JSONB DEFAULT '{}',
  payment_method TEXT NOT NULL,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure required columns exist on orders even if the table pre-existed without them
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_id UUID,
  ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS total DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS shipping_address JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS billing_address JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- If customer_id exists but lacks FK, try to add it safely
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints c
    WHERE c.table_schema = 'public' AND c.table_name = 'orders' AND c.constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Shops table
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo TEXT,
  banner TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure required columns exist on shops even if the table pre-existed without them
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS influencer_id UUID,
  ADD COLUMN IF NOT EXISTS handle TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS logo TEXT,
  ADD COLUMN IF NOT EXISTS banner TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Influencer shop products
CREATE TABLE IF NOT EXISTS influencer_shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sale_price DECIMAL(10,2),
  custom_title TEXT,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(influencer_id, product_id)
);

-- Ensure required columns exist on influencer_shop_products even if the table pre-existed
ALTER TABLE influencer_shop_products
  ADD COLUMN IF NOT EXISTS influencer_id UUID,
  ADD COLUMN IF NOT EXISTS product_id UUID,
  ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS custom_title TEXT,
  ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  influencer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  supplier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  rate DECIMAL(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'disputed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Ensure required columns exist on commissions even if the table pre-existed without them
ALTER TABLE commissions
  ADD COLUMN IF NOT EXISTS order_id UUID,
  ADD COLUMN IF NOT EXISTS influencer_id UUID,
  ADD COLUMN IF NOT EXISTS supplier_id UUID,
  ADD COLUMN IF NOT EXISTS product_id UUID,
  ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS rate DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Verification requests
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('supplier', 'influencer', 'brand', 'admin')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'verified', 'rejected')),
  rejection_reason TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure required columns exist on verification_requests even if the table pre-existed
ALTER TABLE verification_requests
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Verification documents
CREATE TABLE IF NOT EXISTS verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES verification_requests(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure required columns exist on verification_documents even if the table pre-existed
ALTER TABLE verification_documents
  ADD COLUMN IF NOT EXISTS request_id UUID,
  ADD COLUMN IF NOT EXISTS doc_type TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS size_bytes INTEGER,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_shops_influencer ON shops(influencer_id);
CREATE INDEX IF NOT EXISTS idx_shops_handle ON shops(handle);
CREATE INDEX IF NOT EXISTS idx_influencer_shop_products_influencer ON influencer_shop_products(influencer_id);
CREATE INDEX IF NOT EXISTS idx_influencer_shop_products_product ON influencer_shop_products(product_id);
CREATE INDEX IF NOT EXISTS idx_commissions_order ON commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_documents_request ON verification_documents(request_id);

-- ============================================
-- CREATE FUNCTIONS
-- ============================================

-- Function to decrement stock
CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, quantity INT)
RETURNS INT AS $$
DECLARE
  new_stock INT;
BEGIN
  UPDATE products 
  SET stock_count = GREATEST(0, stock_count - quantity)
  WHERE id = product_id
  RETURNING stock_count INTO new_stock;
  
  RETURN COALESCE(new_stock, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CREATE TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_shops_updated_at ON shops;
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_influencer_shop_products_updated_at ON influencer_shop_products;
CREATE TRIGGER update_influencer_shop_products_updated_at BEFORE UPDATE ON influencer_shop_products
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_verification_requests_updated_at ON verification_requests;
CREATE TRIGGER update_verification_requests_updated_at BEFORE UPDATE ON verification_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_verification_documents_updated_at ON verification_documents;
CREATE TRIGGER update_verification_documents_updated_at BEFORE UPDATE ON verification_documents
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- CREATE STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'products', 
  'products', 
  true,
  5242880 -- 5MB limit
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'avatars', 
  'avatars', 
  true,
  2097152 -- 2MB limit
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE RLS POLICIES
-- ============================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Remove legacy/redundant policies if present
DROP POLICY IF EXISTS "Users can view own profile details" ON profiles;

-- Products policies
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Suppliers can manage own products" ON products;
CREATE POLICY "Suppliers can manage own products" ON products FOR ALL USING (
  auth.uid() = supplier_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Remove legacy/redundant policies if present
DROP POLICY IF EXISTS "Products are publicly readable" ON products;

-- Orders policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (
  auth.uid() = customer_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can create own orders" ON orders;
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Remove legacy/redundant policies if present
DROP POLICY IF EXISTS "Customers can view own orders" ON orders;

-- Shops policies
DROP POLICY IF EXISTS "Anyone can view shops" ON shops;
CREATE POLICY "Anyone can view shops" ON shops FOR SELECT USING (true);

DROP POLICY IF EXISTS "Influencers can manage own shops" ON shops;
CREATE POLICY "Influencers can manage own shops" ON shops FOR ALL USING (
  auth.uid() = influencer_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Remove legacy/redundant policies if present
DROP POLICY IF EXISTS "Shops are publicly readable" ON shops;

-- Influencer shop products policies
DROP POLICY IF EXISTS "Anyone can view published shop products" ON influencer_shop_products;
CREATE POLICY "Anyone can view published shop products" ON influencer_shop_products 
FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "Influencers can manage own shop products" ON influencer_shop_products;
CREATE POLICY "Influencers can manage own shop products" ON influencer_shop_products 
FOR ALL USING (
  auth.uid() = influencer_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Commissions policies
DROP POLICY IF EXISTS "Users can view own commissions" ON commissions;
CREATE POLICY "Users can view own commissions" ON commissions FOR SELECT USING (
  auth.uid() = influencer_id OR 
  auth.uid() = supplier_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Verification requests policies
DROP POLICY IF EXISTS "Users can view own verification requests" ON verification_requests;
CREATE POLICY "Users can view own verification requests" ON verification_requests 
FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can manage own verification requests" ON verification_requests;
CREATE POLICY "Users can manage own verification requests" ON verification_requests 
FOR ALL USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Verification documents policies
DROP POLICY IF EXISTS "Users can view own verification documents" ON verification_documents;
CREATE POLICY "Users can view own verification documents" ON verification_documents 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM verification_requests vr WHERE vr.id = request_id AND vr.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can manage own verification documents" ON verification_documents;
CREATE POLICY "Users can manage own verification documents" ON verification_documents 
FOR ALL USING (
  EXISTS (SELECT 1 FROM verification_requests vr WHERE vr.id = request_id AND vr.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- STORAGE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
CREATE POLICY "Users can upload own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND 
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
CREATE POLICY "Users can view own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND 
  (auth.uid()::text = (string_to_array(name, '/'))[1] OR
   EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
);

DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
CREATE POLICY "Anyone can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Create sample profiles (only if none exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles LIMIT 1) THEN
    -- Insert sample profiles for existing auth users (if any)
    INSERT INTO profiles (id, name, role, verified)
    SELECT 
      au.id,
      COALESCE(au.raw_user_meta_data->>'name', 'Sample User'),
      'customer',
      true
    FROM auth.users au
    WHERE au.email IS NOT NULL
    LIMIT 4
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE '✅ Sample profiles created for existing users';
  ELSE
    RAISE NOTICE 'ℹ️ Profiles already exist, skipping sample data';
  END IF;
END $$;

-- ============================================
-- FINAL MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Auth-compatible database setup complete!';
  RAISE NOTICE '📦 All tables created with proper auth.users references';
  RAISE NOTICE '🔐 Security policies configured';
  RAISE NOTICE '📁 Storage buckets ready';
  RAISE NOTICE '';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '- profiles (extends auth.users)';
  RAISE NOTICE '- products, orders, shops';
  RAISE NOTICE '- influencer_shop_products';
  RAISE NOTICE '- commissions';
  RAISE NOTICE '- verification_requests';
  RAISE NOTICE '- verification_documents';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Ready for production use!';
END $$;
