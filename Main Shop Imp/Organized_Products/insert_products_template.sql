-- ============================================
-- INSERT NEW PRODUCTS WITH IMAGE URLS
-- ============================================
-- Total Products: 5
-- 
-- INSTRUCTIONS:
-- 1. Upload images to Supabase Storage
-- 2. Replace [YOUR_SUPABASE_URL] with your actual Supabase project URL
-- 3. Run this SQL in Supabase SQL Editor
-- ============================================


-- Canon EOS R6 Mark II Camera
INSERT INTO products (title, sku, price, category, brand, primary_image, created_at) 
VALUES (
    'Canon EOS R6 Mark II Camera',
    'CANON-EOS-R6-MKII',
    2499.99,
    'Electronics',
    'Canon',
    '[YOUR_SUPABASE_URL]/storage/v1/object/public/product-images/new-products/CANON-EOS-R6-MKII-1.webp',
    NOW()
);


-- Nike Air Zoom Pegasus 40
INSERT INTO products (title, sku, price, category, brand, primary_image, created_at) 
VALUES (
    'Nike Air Zoom Pegasus 40',
    'NIKE-PEGASUS-40',
    139.99,
    'Footwear',
    'Nike',
    '[YOUR_SUPABASE_URL]/storage/v1/object/public/product-images/new-products/NIKE-PEGASUS-40-1.webp',
    NOW()
);


-- Fjallraven Kanken 17" Laptop Backpack
INSERT INTO products (title, sku, price, category, brand, primary_image, created_at) 
VALUES (
    'Fjallraven Kanken 17" Laptop Backpack',
    'FJALLRAVEN-KANKEN-17',
    115.0,
    'Accessories',
    'Fjallraven',
    '[YOUR_SUPABASE_URL]/storage/v1/object/public/product-images/new-products/FJALLRAVEN-KANKEN-17-1.webp',
    NOW()
);


-- Logitech MX Master 3S Wireless Mouse
INSERT INTO products (title, sku, price, category, brand, primary_image, created_at) 
VALUES (
    'Logitech MX Master 3S Wireless Mouse',
    'LOGITECH-MX-MASTER-3S',
    99.99,
    'Electronics',
    'Logitech',
    '[YOUR_SUPABASE_URL]/storage/v1/object/public/product-images/new-products/LOGITECH-MX-MASTER-3S-1.webp',
    NOW()
);


-- Patagonia Nano Puff Jacket
INSERT INTO products (title, sku, price, category, brand, primary_image, created_at) 
VALUES (
    'Patagonia Nano Puff Jacket',
    'PATAGONIA-NANO-PUFF',
    249.0,
    'Apparel',
    'Patagonia',
    '[YOUR_SUPABASE_URL]/storage/v1/object/public/product-images/new-products/PATAGONIA-NANO-PUFF-1.webp',
    NOW()
);


-- ============================================
-- VERIFY INSERTS
-- ============================================
SELECT * FROM products WHERE sku IN (
    'CANON-EOS-R6-MKII',
    'NIKE-PEGASUS-40',
    'FJALLRAVEN-KANKEN-17',
    'LOGITECH-MX-MASTER-3S',
    'PATAGONIA-NANO-PUFF'
);
