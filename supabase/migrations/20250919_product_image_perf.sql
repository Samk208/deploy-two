-- Safe migration: product image enhancements and performance indexes
-- This file is idempotent and matches the app's existing schema.

-- STEP 1: Add missing image optimization columns
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS image_alt_text text[],
  ADD COLUMN IF NOT EXISTS image_metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text;

-- STEP 2: Add performance indexes for shop queries
CREATE INDEX IF NOT EXISTS idx_products_active_stock ON public.products (active, in_stock, stock_count)
WHERE
    active = true
    AND in_stock = true;

CREATE INDEX IF NOT EXISTS idx_products_supplier_active ON public.products (
    supplier_id,
    active,
    created_at DESC
)
WHERE
    active = true;

CREATE INDEX IF NOT EXISTS idx_influencer_shop_products_lookup ON public.influencer_shop_products (
    influencer_id,
    published,
    created_at DESC
)
WHERE
    published = true;

-- STEP 3: Backfill image metadata for rows missing it
UPDATE public.products 
SET 
  image_alt_text = COALESCE(image_alt_text, ARRAY[
    title || ' - Product Image 1',
    title || ' - Product Image 2'
  ]),
  image_metadata = CASE 
    WHEN image_metadata IS NULL OR image_metadata = '{}'::jsonb THEN jsonb_build_object(
      'dimensions', jsonb_build_object('width', 500, 'height', 500),
      'format', 'webp',
      'source', 'unsplash'
    )
    ELSE image_metadata
  END
WHERE image_alt_text IS NULL OR image_metadata IS NULL OR image_metadata = '{}'::jsonb;