-- ============================================
-- MINIMAL DATABASE SETUP - SAFE ADDITIONS ONLY
-- ============================================
-- This file only adds missing components without assumptions about existing schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ADD ONLY MISSING TABLES
-- ============================================

-- Influencer shop products (safe to add)
CREATE TABLE IF NOT EXISTS influencer_shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL,
  product_id UUID NOT NULL,
  sale_price DECIMAL(10,2),
  custom_title TEXT,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(influencer_id, product_id)
);

-- Verification requests (safe to add)
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('supplier', 'influencer', 'brand', 'admin')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'verified', 'rejected')),
  rejection_reason TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification documents (safe to add)
CREATE TABLE IF NOT EXISTS verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL,
  doc_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ADD FOREIGN KEY CONSTRAINTS (ONLY IF TABLES EXIST)
-- ============================================

-- Add foreign keys only if referenced tables exist
DO $$
BEGIN
  -- Add foreign keys for influencer_shop_products if users and products tables exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    ALTER TABLE influencer_shop_products 
    ADD CONSTRAINT fk_influencer_shop_products_influencer 
    FOREIGN KEY (influencer_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products' AND table_schema = 'public') THEN
    ALTER TABLE influencer_shop_products 
    ADD CONSTRAINT fk_influencer_shop_products_product 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;
  
  -- Add foreign keys for verification_requests if users table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    ALTER TABLE verification_requests 
    ADD CONSTRAINT fk_verification_requests_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    
    ALTER TABLE verification_requests 
    ADD CONSTRAINT fk_verification_requests_reviewer 
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  -- Add foreign key for verification_documents
  ALTER TABLE verification_documents 
  ADD CONSTRAINT fk_verification_documents_request 
  FOREIGN KEY (request_id) REFERENCES verification_requests(id) ON DELETE CASCADE;
  
EXCEPTION
  WHEN duplicate_object THEN
    -- Foreign keys already exist, skip
    NULL;
END $$;

-- ============================================
-- ADD INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_influencer_shop_products_influencer ON influencer_shop_products(influencer_id);
CREATE INDEX IF NOT EXISTS idx_influencer_shop_products_product ON influencer_shop_products(product_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_documents_request ON verification_documents(request_id);

-- ============================================
-- CREATE STORAGE BUCKETS
-- ============================================

-- Create storage buckets
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
-- ENABLE RLS (SAFE)
-- ============================================

ALTER TABLE influencer_shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- BASIC RLS POLICIES (NO ASSUMPTIONS ABOUT USER TABLE STRUCTURE)
-- ============================================

-- Simple policies that don't reference user table columns
DROP POLICY IF EXISTS "Anyone can view published shop products" ON influencer_shop_products;
CREATE POLICY "Anyone can view published shop products" ON influencer_shop_products 
FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "Authenticated users can manage shop products" ON influencer_shop_products;
CREATE POLICY "Authenticated users can manage shop products" ON influencer_shop_products 
FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can manage verification requests" ON verification_requests;
CREATE POLICY "Users can manage verification requests" ON verification_requests 
FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can manage verification documents" ON verification_documents;
CREATE POLICY "Users can manage verification documents" ON verification_documents 
FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================
-- STORAGE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
CREATE POLICY "Authenticated users can view documents" ON storage.objects
FOR SELECT USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
CREATE POLICY "Anyone can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.uid() IS NOT NULL);

-- ============================================
-- FINAL MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Minimal database setup complete!';
  RAISE NOTICE '📦 Added missing tables safely';
  RAISE NOTICE '🔐 Basic security policies enabled';
  RAISE NOTICE '📁 Storage buckets configured';
  RAISE NOTICE '';
  RAISE NOTICE 'Added tables:';
  RAISE NOTICE '- influencer_shop_products';
  RAISE NOTICE '- verification_requests';
  RAISE NOTICE '- verification_documents';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Ready to use!';
END $$;
