-- Migration: Main Shop Performance Indexes
-- Date: 2025-10-07
-- Description: Add additional indexes for main shop catalog filtering and search performance
-- Note: This migration uses IF NOT EXISTS to avoid conflicts with existing indexes

-- Composite index for the most common query pattern (active + in_stock + stock_count)
CREATE INDEX IF NOT EXISTS idx_products_active_instock_stock ON public.products(active, in_stock, stock_count);

-- Individual indexes that may not exist yet
CREATE INDEX IF NOT EXISTS idx_products_created_at_desc ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category_filter ON public.products(category) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_products_brand_filter ON public.products(brand) WHERE active = true;

-- Enable pg_trgm extension for better text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram index for faster ILIKE searches on title
CREATE INDEX IF NOT EXISTS idx_products_title_trgm ON public.products USING gin (title gin_trgm_ops);

-- Comments for documentation
COMMENT ON INDEX idx_products_active_instock_stock IS 'Composite index for main shop base query filtering';
COMMENT ON INDEX idx_products_title_trgm IS 'Trigram index for fast case-insensitive title search';
