-- ============================================
-- ONE-LINK COMPLETE DATABASE SETUP
-- ============================================
-- This file creates all tables, functions, policies, and seed data
-- Run this entire file in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- CLEAN UP (Optional - remove existing tables)
-- ============================================
-- Uncomment these lines if you want to start fresh
-- DROP TABLE IF EXISTS verification_documents CASCADE;
-- DROP TABLE IF EXISTS verification_requests CASCADE;
-- DROP TABLE IF EXISTS email_verifications CASCADE;
-- DROP TABLE IF EXISTS commissions CASCADE;
-- DROP TABLE IF EXISTS influencer_shop_products CASCADE;
-- DROP TABLE IF EXISTS shops CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- CREATE TABLES
-- ============================================

-- Users table (core user profiles)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('supplier', 'influencer', 'customer', 'admin')),
  avatar TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sku TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- Shops table (influencer shops)
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  influencer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  handle TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo TEXT,
  banner TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Influencer shop products (products in influencer shops)
CREATE TABLE IF NOT EXISTS influencer_shop_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  influencer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sale_price DECIMAL(10,2),
  custom_title TEXT,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(influencer_id, product_id)
);

-- Commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  influencer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  rate DECIMAL(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'disputed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Verification requests table
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('supplier', 'influencer', 'brand', 'admin')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'verified', 'rejected')),
  rejection_reason TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification documents table
CREATE TABLE IF NOT EXISTS verification_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Email verifications table
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_shops_influencer ON shops(influencer_id);
CREATE INDEX IF NOT EXISTS idx_shops_handle ON shops(handle);
CREATE INDEX IF NOT EXISTS idx_commissions_order ON commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);

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

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_verification_requests_updated_at BEFORE UPDATE ON verification_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- CREATE STORAGE BUCKETS
-- ============================================

-- Create documents bucket for verification documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Create products bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'products', 
  'products', 
  true,
  5242880 -- 5MB limit
) ON CONFLICT (id) DO NOTHING;

-- Create avatars bucket for user avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'avatars', 
  'avatars', 
  true,
  2097152 -- 2MB limit
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CREATE ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Products policies
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (active = true);
CREATE POLICY "Suppliers can manage own products" ON products FOR ALL USING (auth.uid()::text = supplier_id::text);

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid()::text = customer_id::text);
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (auth.uid()::text = customer_id::text);

-- Shops policies
CREATE POLICY "Anyone can view shops" ON shops FOR SELECT USING (true);
CREATE POLICY "Influencers can manage own shops" ON shops FOR ALL USING (auth.uid()::text = influencer_id::text);

-- Storage policies for documents bucket
CREATE POLICY "Users can upload own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND 
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

CREATE POLICY "Users can view own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

CREATE POLICY "Users can delete own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Storage policies for public buckets
CREATE POLICY "Anyone can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can upload own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- ============================================
-- SEED DATA (Sample data for testing)
-- ============================================

-- Create sample users
INSERT INTO users (id, email, name, role, verified) VALUES
  ('11111111-1111-1111-1111-111111111111', 'supplier@example.com', 'Test Supplier', 'supplier', true),
  ('22222222-2222-2222-2222-222222222222', 'influencer@example.com', 'Test Influencer', 'influencer', true),
  ('33333333-3333-3333-3333-333333333333', 'customer@example.com', 'Test Customer', 'customer', true),
  ('44444444-4444-4444-4444-444444444444', 'admin@example.com', 'Admin User', 'admin', true)
ON CONFLICT (id) DO NOTHING;

-- Create sample products
INSERT INTO products (title, description, price, original_price, category, stock_count, commission, supplier_id, images) VALUES
  ('Wireless Bluetooth Headphones', 'Premium noise-cancelling wireless headphones with 30-hour battery life', 149.99, 199.99, 'Electronics', 50, 15, '11111111-1111-1111-1111-111111111111', ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500']),
  ('Organic Cotton T-Shirt', 'Sustainable, soft organic cotton t-shirt in multiple colors', 29.99, 39.99, 'Fashion', 100, 20, '11111111-1111-1111-1111-111111111111', ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500']),
  ('Smart Fitness Watch', 'Advanced fitness tracker with heart rate monitoring and GPS', 199.99, 299.99, 'Electronics', 30, 18, '11111111-1111-1111-1111-111111111111', ARRAY['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500']),
  ('Yoga Mat Premium', 'Extra thick, non-slip yoga mat with carrying strap', 49.99, 69.99, 'Sports', 75, 25, '11111111-1111-1111-1111-111111111111', ARRAY['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500']),
  ('Stainless Steel Water Bottle', 'Insulated water bottle keeps drinks cold for 24 hours', 34.99, 44.99, 'Home', 200, 30, '11111111-1111-1111-1111-111111111111', ARRAY['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500']),
  ('Wireless Charging Pad', 'Fast wireless charger compatible with all Qi-enabled devices', 39.99, 59.99, 'Electronics', 60, 22, '11111111-1111-1111-1111-111111111111', ARRAY['https://images.unsplash.com/photo-1591290619762-d3f2e6b6d3e0?w=500']),
  ('Leather Wallet', 'Genuine leather bifold wallet with RFID protection', 59.99, 89.99, 'Fashion', 40, 15, '11111111-1111-1111-1111-111111111111', ARRAY['https://images.unsplash.com/photo-1627123424574-724758594e93?w=500']),
  ('Portable Bluetooth Speaker', 'Waterproof speaker with 360-degree sound', 79.99, 119.99, 'Electronics', 35, 20, '11111111-1111-1111-1111-111111111111', ARRAY['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500'])
ON CONFLICT DO NOTHING;

-- Create sample shop for influencer
INSERT INTO shops (influencer_id, handle, name, description) VALUES
  ('22222222-2222-2222-2222-222222222222', 'testinfluencer', 'Test Influencer Shop', 'Curated products by Test Influencer')
ON CONFLICT DO NOTHING;

-- Add products to influencer shop
INSERT INTO influencer_shop_products (influencer_id, product_id, published) 
SELECT '22222222-2222-2222-2222-222222222222', id, true 
FROM products 
LIMIT 5
ON CONFLICT DO NOTHING;

-- ============================================
-- FINAL MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database setup complete!';
  RAISE NOTICE '📦 Sample products added';
  RAISE NOTICE '👥 Sample users created';
  RAISE NOTICE '🏪 Sample shop created';
  RAISE NOTICE '🔐 Security policies enabled';
  RAISE NOTICE '📁 Storage buckets configured';
  RAISE NOTICE '';
  RAISE NOTICE 'Test credentials:';
  RAISE NOTICE '- Supplier: supplier@example.com';
  RAISE NOTICE '- Influencer: influencer@example.com';
  RAISE NOTICE '- Customer: customer@example.com';
  RAISE NOTICE '- Admin: admin@example.com';
END $$;
