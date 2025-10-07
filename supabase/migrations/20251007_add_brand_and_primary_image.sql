-- Migration: Add brand and primary_image columns to products table
-- Date: 2025-10-07
-- Description: Add missing brand and primary_image fields for main shop functionality

-- Add brand column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'brand'
  ) THEN
    ALTER TABLE products ADD COLUMN brand VARCHAR;
  END IF;
END $$;

-- Add primary_image column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'primary_image'
  ) THEN
    ALTER TABLE products ADD COLUMN primary_image VARCHAR;
  END IF;
END $$;

-- Update existing products to set primary_image from first image in images array
UPDATE products
SET primary_image = images[1]
WHERE primary_image IS NULL AND array_length(images, 1) > 0;

-- Add comment
COMMENT ON COLUMN products.brand IS 'Product brand name';
COMMENT ON COLUMN products.primary_image IS 'Primary product image URL (first image from images array)';
