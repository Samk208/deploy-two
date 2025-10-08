-- Quick Check: Current Database State
-- Run this to see what you currently have

-- 1. Check migrations completed
SELECT 1 as step, 'Check if brand column exists' as description;

SELECT column_name
FROM information_schema.columns
WHERE
    table_name = 'products'
    AND column_name = 'brand';

SELECT 2 as step, 'Check if short_description exists' as description;

SELECT column_name
FROM information_schema.columns
WHERE
    table_name = 'products'
    AND column_name = 'short_description';

-- 2. Check current products
SELECT 3 as step, 'Current products count' as description;

SELECT COUNT(*) as total_products FROM products;

-- 3. Check suppliers
SELECT 4 as step, 'Available suppliers' as description;

SELECT id, email, name FROM users WHERE role = 'supplier' LIMIT 3;

-- 4. Check main shop query readiness
SELECT 5 as step, 'Products ready for main shop' as description;

SELECT COUNT(*) as ready_products
FROM products
WHERE
    active = true
    AND in_stock = true
    AND stock_count > 0;