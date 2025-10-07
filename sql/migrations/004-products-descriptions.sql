-- ========================================
-- Migration 004: Add Product Descriptions
-- ========================================
-- Purpose: Add short_description field for catalog cards and SEO snippets
-- Note: The 'description' column already exists from the initial schema
-- Date: 2025-10-07
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ========================================

-- Add short_description column for catalog cards and SEO snippets (120-160 chars)
-- This is used on product cards and meta descriptions
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS short_description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.products.short_description IS
  'Short one-liner for catalog cards and SEO snippets (ideal 120-160 characters)';

-- Note: The 'description' column already exists and serves as the full product description
-- No need to add it here. It was created in 20250102_initial_schema.sql as TEXT NOT NULL

-- Optional: If you want to make the existing description nullable to allow gradual migration
-- ALTER TABLE public.products ALTER COLUMN description DROP NOT NULL;

-- Create index for text search on short_description (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_products_short_description_trgm
  ON public.products USING gin (short_description gin_trgm_ops);

-- Verify pg_trgm extension exists (needed for text search)
-- This should already exist from migration 003, but we ensure it here
CREATE EXTENSION IF NOT EXISTS pg_trgm;
