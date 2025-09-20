-- Migration: 002-shop-optimizations.sql
-- Description: Add performance indexes and optional columns for shop optimization
-- Date: 2024-12-19
-- Author: One-Link Development Team

-- =====================================================
-- SHOP OPTIMIZATION MIGRATION
-- =====================================================

-- Add performance indexes for common product queries
-- These indexes will significantly improve search, filtering, and sorting performance

-- Index for product name searches (most common query)
CREATE INDEX IF NOT EXISTS idx_products_name 
ON products USING gin(to_tsvector('english', name));

-- Index for category filtering (frequently used in shop filters)
CREATE INDEX IF NOT EXISTS idx_products_category 
ON products(category) 
WHERE category IS NOT NULL;

-- Index for price range queries and sorting
CREATE INDEX IF NOT EXISTS idx_products_price 
ON products(price) 
WHERE price IS NOT NULL;

-- Index for active products (most common filter)
CREATE INDEX IF NOT EXISTS idx_products_active 
ON products(active) 
WHERE active = true;

-- Composite index for category + price queries (common filter combination)
CREATE INDEX IF NOT EXISTS idx_products_category_price 
ON products(category, price) 
WHERE category IS NOT NULL AND price IS NOT NULL;

-- =====================================================
-- ADD OPTIONAL COLUMNS
-- =====================================================

-- Add rating column for product reviews and sorting
-- Nullable to maintain compatibility with existing products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5);

-- Add review count for rating credibility
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0 CHECK (review_count >= 0);

-- Add tags for better product discovery and filtering
-- Using text array for flexible tag storage
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add popularity score for trending products
-- Calculated based on views, sales, and engagement
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS popularity_score INTEGER DEFAULT 0 CHECK (popularity_score >= 0);

-- =====================================================
-- ADDITIONAL OPTIMIZATION INDEXES
-- =====================================================

-- Index for rating-based sorting and filtering
CREATE INDEX IF NOT EXISTS idx_products_rating 
ON products(rating DESC NULLS LAST) 
WHERE rating IS NOT NULL;

-- Index for popularity-based sorting
CREATE INDEX IF NOT EXISTS idx_products_popularity 
ON products(popularity_score DESC) 
WHERE popularity_score > 0;

-- Index for tags (using GIN for array operations)
CREATE INDEX IF NOT EXISTS idx_products_tags 
ON products USING GIN(tags) 
WHERE array_length(tags, 1) > 0;

-- Index for review count (useful for sorting by popularity)
CREATE INDEX IF NOT EXISTS idx_products_review_count 
ON products(review_count DESC) 
WHERE review_count > 0;

-- =====================================================
-- PERFORMANCE VIEWS
-- =====================================================

-- Create a view for active products with computed fields
-- This provides a clean interface for common queries
CREATE OR REPLACE VIEW active_products AS
SELECT 
    id,
    name,
    description,
    price,
    category,
    rating,
    review_count,
    tags,
    popularity_score,
    active,
    created_at,
    updated_at
FROM products 
WHERE active = true;

-- Create a view for trending products
-- Useful for homepage and recommendations
CREATE OR REPLACE VIEW trending_products AS
SELECT 
    id,
    name,
    price,
    category,
    rating,
    review_count,
    popularity_score
FROM products 
WHERE active = true 
  AND popularity_score > 0
ORDER BY popularity_score DESC, rating DESC NULLS LAST;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to update product popularity score
-- Can be called periodically or on specific events
CREATE OR REPLACE FUNCTION update_product_popularity()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate popularity based on multiple factors
    -- This is a simplified calculation - can be enhanced based on business logic
    NEW.popularity_score = COALESCE(NEW.review_count, 0) * 10 + 
                          COALESCE(NEW.rating, 0) * 20;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update popularity score
CREATE TRIGGER trigger_update_product_popularity
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_product_popularity();

-- =====================================================
-- MIGRATION VERIFICATION
-- =====================================================

-- Verify that all indexes were created successfully
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'products' 
      AND indexname LIKE 'idx_products_%';
    
    IF index_count < 10 THEN
        RAISE EXCEPTION 'Expected at least 10 indexes, found %', index_count;
    END IF;
    
    RAISE NOTICE 'Migration completed successfully. Created % indexes.', index_count;
END $$;

-- =====================================================
-- ROLLBACK NOTES
-- =====================================================
-- To rollback this migration:
-- 1. Drop all created indexes: DROP INDEX IF EXISTS idx_products_*;
-- 2. Drop columns: ALTER TABLE products DROP COLUMN IF EXISTS rating, review_count, tags, popularity_score;
-- 3. Drop views: DROP VIEW IF EXISTS active_products, trending_products;
-- 4. Drop function and trigger: DROP TRIGGER IF EXISTS trigger_update_product_popularity ON products; DROP FUNCTION IF EXISTS update_product_popularity();
