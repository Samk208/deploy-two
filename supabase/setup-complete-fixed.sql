-- ============================================
-- ONE-LINK COMPATIBLE DATABASE SETUP
-- ============================================
-- This file works with existing migrations and adds missing components
-- Run this entire file in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ADD MISSING TABLES (only if they don't exist)
-- ============================================

-- Influencer shop products (products in influencer shops)
CREATE TABLE IF NOT EXISTS influencer_shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sale_price DECIMAL(10,2),
  custom_title TEXT,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(influencer_id, product_id)
);

-- Verification requests table
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Email verifications table already exists from migration - skip creation

-- ============================================
-- ADD MISSING INDEXES
-- ============================================

-- Additional indexes for new tables
CREATE INDEX IF NOT EXISTS idx_influencer_shop_products_influencer ON influencer_shop_products(influencer_id);
CREATE INDEX IF NOT EXISTS idx_influencer_shop_products_product ON influencer_shop_products(product_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_documents_request ON verification_documents(request_id);
-- Email verification indexes already exist from migration - skip creation

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
-- CREATE TRIGGERS FOR NEW TABLES
-- ============================================

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
-- ADD RLS POLICIES FOR NEW TABLES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE influencer_shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
-- Email verifications RLS already enabled from migration

-- Influencer shop products policies
DROP POLICY IF EXISTS "Anyone can view published shop products" ON influencer_shop_products;
CREATE POLICY "Anyone can view published shop products" ON influencer_shop_products 
FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "Influencers can manage own shop products" ON influencer_shop_products;
CREATE POLICY "Influencers can manage own shop products" ON influencer_shop_products 
FOR ALL USING (
  influencer_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Verification requests policies
DROP POLICY IF EXISTS "Users can view own verification requests" ON verification_requests;
CREATE POLICY "Users can view own verification requests" ON verification_requests 
FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can manage own verification requests" ON verification_requests;
CREATE POLICY "Users can manage own verification requests" ON verification_requests 
FOR ALL USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Verification documents policies
DROP POLICY IF EXISTS "Users can view own verification documents" ON verification_documents;
CREATE POLICY "Users can view own verification documents" ON verification_documents 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM verification_requests vr WHERE vr.id = request_id AND vr.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can manage own verification documents" ON verification_documents;
CREATE POLICY "Users can manage own verification documents" ON verification_documents 
FOR ALL USING (
  EXISTS (SELECT 1 FROM verification_requests vr WHERE vr.id = request_id AND vr.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Email verifications policies already exist from migration - skip creation

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Storage policies for documents bucket
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
   EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
);

DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
CREATE POLICY "Users can delete own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND 
  (auth.uid()::text = (string_to_array(name, '/'))[1] OR
   EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
);

-- Storage policies for public buckets
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
-- SEED DATA (Sample data for testing)
-- ============================================

-- Create sample products (only if no products exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products LIMIT 1) THEN
    -- Get a supplier user ID
    INSERT INTO products (title, description, price, original_price, category, stock_count, commission, supplier_id, images) 
    SELECT 
      'Wireless Bluetooth Headphones', 
      'Premium noise-cancelling wireless headphones with 30-hour battery life', 
      149.99, 
      199.99, 
      'Electronics', 
      50, 
      15, 
      u.id,
      ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500']
    FROM users u WHERE u.role = 'supplier' LIMIT 1;

    INSERT INTO products (title, description, price, original_price, category, stock_count, commission, supplier_id, images) 
    SELECT 
      'Organic Cotton T-Shirt', 
      'Sustainable, soft organic cotton t-shirt in multiple colors', 
      29.99, 
      39.99, 
      'Fashion', 
      100, 
      20, 
      u.id,
      ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500']
    FROM users u WHERE u.role = 'supplier' LIMIT 1;

    INSERT INTO products (title, description, price, original_price, category, stock_count, commission, supplier_id, images) 
    SELECT 
      'Smart Fitness Watch', 
      'Advanced fitness tracker with heart rate monitoring and GPS', 
      199.99, 
      299.99, 
      'Electronics', 
      30, 
      18, 
      u.id,
      ARRAY['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500']
    FROM users u WHERE u.role = 'supplier' LIMIT 1;

    INSERT INTO products (title, description, price, original_price, category, stock_count, commission, supplier_id, images) 
    SELECT 
      'Yoga Mat Premium', 
      'Extra thick, non-slip yoga mat with carrying strap', 
      49.99, 
      69.99, 
      'Sports', 
      75, 
      25, 
      u.id,
      ARRAY['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500']
    FROM users u WHERE u.role = 'supplier' LIMIT 1;

    INSERT INTO products (title, description, price, original_price, category, stock_count, commission, supplier_id, images) 
    SELECT 
      'Stainless Steel Water Bottle', 
      'Insulated water bottle keeps drinks cold for 24 hours', 
      34.99, 
      44.99, 
      'Home', 
      200, 
      30, 
      u.id,
      ARRAY['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500']
    FROM users u WHERE u.role = 'supplier' LIMIT 1;

    RAISE NOTICE '✅ Sample products added';
  ELSE
    RAISE NOTICE 'ℹ️ Products already exist, skipping sample data';
  END IF;
END $$;

-- Create sample shop for influencer (only if no shops exist)
DO $$
DECLARE
  influencer_user_id UUID;
BEGIN
  SELECT id INTO influencer_user_id FROM users WHERE role = 'influencer' LIMIT 1;
  
  IF influencer_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM shops LIMIT 1) THEN
    INSERT INTO shops (influencer_id, handle, name, description) VALUES
      (influencer_user_id, 'sampleinfluencer', 'Sample Influencer Shop', 'Curated products by Sample Influencer');

    -- Add products to influencer shop
    INSERT INTO influencer_shop_products (influencer_id, product_id, published) 
    SELECT influencer_user_id, id, true 
    FROM products 
    LIMIT 3;

    RAISE NOTICE '✅ Sample shop created';
  ELSE
    RAISE NOTICE 'ℹ️ Shops already exist or no influencer found, skipping sample shop';
  END IF;
END $$;

-- ============================================
-- FINAL MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Database setup complete!';
  RAISE NOTICE '📦 Missing tables and components added';
  RAISE NOTICE '🔐 Security policies configured';
  RAISE NOTICE '📁 Storage buckets ready';
  RAISE NOTICE '';
  RAISE NOTICE 'Your database now includes:';
  RAISE NOTICE '- All required tables for the application';
  RAISE NOTICE '- Document verification system';
  RAISE NOTICE '- Influencer shop products';
  RAISE NOTICE '- Email verification system';
  RAISE NOTICE '- Proper RLS policies';
  RAISE NOTICE '- Storage buckets for files';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Ready for production use!';
END $$;
