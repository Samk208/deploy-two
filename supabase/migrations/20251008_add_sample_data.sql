-- Add sample brand and descriptions to test products
-- Run this in Supabase SQL Editor to see the improvements immediately
-- Note: primary_image is a generated column, so we don't update it manually

-- Update E2E Test Product A
UPDATE products 
SET 
  brand = 'Premium Audio',
  short_description = 'Professional wireless headphones with active noise cancellation and 30-hour battery life for immersive sound.'
WHERE title = 'E2E Test Product A';

-- Update E2E Test Product B
UPDATE products 
SET 
  brand = 'Tech Essentials',
  short_description = 'High-performance gadget designed for everyday use with premium materials and cutting-edge technology.'
WHERE title = 'E2E Test Product B';

-- Update E2E Test Product C
UPDATE products 
SET 
  brand = 'Daily Comfort',
  short_description = 'Affordable quality product perfect for daily tasks and budget-conscious shoppers seeking value.'
WHERE title = 'E2E Test Product C';

-- Verify the updates
SELECT id, title, brand, short_description, primary_image 
FROM products 
WHERE title LIKE 'E2E Test Product%'
ORDER BY title;
