-- Sample Products with Real Uploaded Images
-- Run this after the image upload script
-- All images are now stored in Supabase Storage

-- First, get a supplier ID (you'll need to replace this with actual supplier UUID)
-- SELECT id FROM users WHERE role = 'supplier' LIMIT 1;

-- Note: Replace 'd9ff2682-be35-4250-bd69-419b74621236' with the actual supplier UUID from your database

-- HEADPHONES CATEGORY
INSERT INTO products (
  title,
  brand,
  short_description,
  description,
  price,
  original_price,
  images,
  category,
  region,
  in_stock,
  stock_count,
  commission,
  active,
  supplier_id,
  sku
) VALUES 
-- Sony WH-1000XM5
(
  'Sony WH-1000XM5 Wireless Headphones',
  'Sony',
  'Industry-leading noise cancellation with 30-hour battery life and premium sound quality.',
  'Experience premium sound quality with the Sony WH-1000XM5. Features advanced noise cancellation, 30-hour battery life, multipoint connection, and comfortable design perfect for travel and daily use. Quick attention mode and speak-to-chat technology make conversations effortless.',
  349.99,
  399.99,
  ARRAY[
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/headphones/sony-xm5-front.jpg',
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/headphones/sony-xm5-side.jpg',
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/headphones/sony-xm5-case.jpg'
  ],
  'Electronics',
  ARRAY['Global', 'US', 'EU', 'Asia'],
  TRUE,
  45,
  15.00,
  TRUE,
  'd9ff2682-be35-4250-bd69-419b74621236',
  'SONY-WH1000XM5-BLK'
),

-- Bose QuietComfort 45
(
  'Bose QuietComfort 45 Headphones',
  'Bose',
  'Legendary Bose noise cancellation meets exceptional comfort for all-day wear.',
  'Experience world-class noise cancellation and premium audio with the Bose QuietComfort 45. Lightweight design and plush ear cushions provide unmatched comfort for extended listening sessions. Perfect for travel, work, and entertainment.',
  329.99,
  359.99,
  ARRAY[
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/headphones/bose-qc45-main.jpg',
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/headphones/bose-qc45-detail.jpg',
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/headphones/bose-qc45-lifestyle.jpg'
  ],
  'Electronics',
  ARRAY['Global', 'US', 'EU'],
  TRUE,
  30,
  15.00,
  TRUE,
  'd9ff2682-be35-4250-bd69-419b74621236',
  'BOSE-QC45-BLK'
),

-- WEARABLES CATEGORY
-- Apple Watch Series 9
(
  'Apple Watch Series 9 GPS + Cellular',
  'Apple',
  'Advanced health tracking, fitness features, and seamless iPhone integration.',
  'Stay connected, active, and healthy with the Apple Watch Series 9. Features include ECG, blood oxygen monitoring, crash detection, and a brighter always-on Retina display. Track workouts, monitor heart rate, and receive notifications right on your wrist.',
  429.99,
  459.99,
  ARRAY[
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/wearables/apple-watch-s9-front.jpg',
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/wearables/apple-watch-s9-side.jpg',
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/wearables/apple-watch-s9-detail.jpg'
  ],
  'Wearables',
  ARRAY['Global', 'US', 'EU'],
  TRUE,
  60,
  12.00,
  TRUE,
  'd9ff2682-be35-4250-bd69-419b74621236',
  'APPLE-WATCH-S9-GPS'
),

-- Samsung Galaxy Watch6
(
  'Samsung Galaxy Watch6',
  'Samsung',
  'Advanced health monitoring with sleek design and long battery life.',
  'The Samsung Galaxy Watch6 combines style and functionality with advanced health tracking capabilities. Monitor your sleep, heart rate, and fitness goals while staying connected with smart notifications and apps.',
  329.99,
  369.99,
  ARRAY[
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/wearables/galaxy-watch6-main.jpg',
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/wearables/galaxy-watch6-lifestyle.jpg'
  ],
  'Wearables',
  ARRAY['Global', 'US', 'EU', 'Asia'],
  TRUE,
  40,
  12.00,
  TRUE,
  'd9ff2682-be35-4250-bd69-419b74621236',
  'SAMSUNG-GW6-40MM'
),

-- SNEAKERS CATEGORY
-- Nike Air Force 1
(
  'Nike Air Force 1 ''07',
  'Nike',
  'Iconic basketball-inspired sneakers with timeless style and comfort.',
  'The Nike Air Force 1 ''07 brings a fresh take on the iconic basketball shoe that changed the game. Crisp leather upper, classic silhouette, and Air-Sole unit deliver comfort and style that lasts.',
  110.00,
  120.00,
  ARRAY[
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/sneakers/nike-af1-main.jpg',
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/sneakers/nike-af1-side.jpg',
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/sneakers/nike-af1-detail.jpg'
  ],
  'Footwear',
  ARRAY['Global', 'US', 'EU'],
  TRUE,
  80,
  18.00,
  TRUE,
  'd9ff2682-be35-4250-bd69-419b74621236',
  'NIKE-AF1-07-WHT'
),

-- Adidas Ultraboost 22
(
  'Adidas Ultraboost 22',
  'Adidas',
  'Energy-returning running shoes with Boost midsole technology.',
  'The Adidas Ultraboost 22 delivers incredible energy return with every step. Featuring responsive Boost midsole, Primeknit upper, and Continental rubber outsole for superior grip and comfort.',
  190.00,
  210.00,
  ARRAY[
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/sneakers/adidas-ultraboost-main.jpg',
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/sneakers/adidas-ultraboost-angle.jpg',
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/sneakers/adidas-ultraboost-lifestyle.jpg'
  ],
  'Footwear',
  ARRAY['Global', 'US', 'EU'],
  TRUE,
  65,
  16.00,
  TRUE,
  'd9ff2682-be35-4250-bd69-419b74621236',
  'ADIDAS-UB22-BLK'
),

-- ACCESSORIES CATEGORY
-- Peak Design Everyday Backpack
(
  'Peak Design Everyday Backpack V2',
  'Peak Design',
  'Versatile photography and everyday carry backpack with weatherproof design.',
  'The Peak Design Everyday Backpack combines sleek aesthetics with practical functionality. Perfect for photographers, travelers, and urban commuters who demand quality and organization. Features customizable dividers and lifetime warranty.',
  279.95,
  299.95,
  ARRAY[
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/accessories/pd-everyday-bp-v2-front.jpg',
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/accessories/pd-everyday-bp-v2-back.jpg',
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/accessories/pd-everyday-bp-v2-detail.jpg'
  ],
  'Accessories',
  ARRAY['Global', 'US', 'EU'],
  TRUE,
  25,
  20.00,
  TRUE,
  'd9ff2682-be35-4250-bd69-419b74621236',
  'PEAK-EB-V2-20L'
),

-- Hydro Flask Water Bottle
(
  'Hydro Flask Standard Mouth 21 oz',
  'Hydro Flask',
  'Insulated stainless steel water bottle that keeps drinks cold for 24 hours.',
  'The Hydro Flask Standard Mouth water bottle features TempShield insulation technology to keep beverages cold for up to 24 hours or hot for up to 12 hours. Made from durable stainless steel with a powder coat finish.',
  39.95,
  44.95,
  ARRAY[
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/accessories/hydro-flask-main.jpg',
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/accessories/hydro-flask-color.jpg',
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/accessories/hydro-flask-lifestyle.jpg'
  ],
  'Accessories',
  ARRAY['Global', 'US', 'EU'],
  TRUE,
  100,
  25.00,
  TRUE,
  'd9ff2682-be35-4250-bd69-419b74621236',
  'HF-SM-21OZ-BLU'
),

-- PERIPHERALS CATEGORY
-- Keychron K2 Keyboard
(
  'Keychron K2 Wireless Mechanical Keyboard',
  'Keychron',
  'Compact 75% layout mechanical keyboard with hot-swappable switches.',
  'The Keychron K2 is a compact wireless mechanical keyboard designed for Mac and Windows. Features hot-swappable Gateron switches, RGB backlighting, and up to 72 hours of typing with backlight off.',
  89.99,
  99.99,
  ARRAY[
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/peripherals/keychron-k2-main.jpg',
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/peripherals/keychron-k2-angle.jpg',
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/peripherals/keychron-k2-close.jpg'
  ],
  'Electronics',
  ARRAY['Global', 'US', 'EU'],
  TRUE,
  35,
  22.00,
  TRUE,
  'd9ff2682-be35-4250-bd69-419b74621236',
  'KEYCHRON-K2-RGB'
),

-- Logitech MX Master 3S
(
  'Logitech MX Master 3S Wireless Mouse',
  'Logitech',
  'Advanced wireless mouse with ultra-precise scrolling and customizable buttons.',
  'The Logitech MX Master 3S is designed for power users who demand precision and comfort. Features 8K DPI sensor, ultra-fast scrolling, and works on virtually any surface including glass.',
  99.99,
  109.99,
  ARRAY[
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/peripherals/logi-mx-master3s-top.jpg',
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/peripherals/logi-mx-master3s-side.jpg',
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/peripherals/logi-mx-master3s-detail.jpg'
  ],
  'Electronics',
  ARRAY['Global', 'US', 'EU'],
  TRUE,
  50,
  20.00,
  TRUE,
  'd9ff2682-be35-4250-bd69-419b74621236',
  'LOGI-MXM3S-GRY'
),

-- AUDIO CATEGORY
-- JBL Flip 6 Bluetooth Speaker
(
  'JBL Flip 6 Portable Bluetooth Speaker',
  'JBL',
  'Waterproof portable speaker with powerful JBL Original Pro Sound.',
  'The JBL Flip 6 delivers powerful JBL Original Pro Sound with exceptional clarity. IP67 waterproof and dustproof rating makes it perfect for outdoor adventures. Up to 12 hours of playtime.',
  129.95,
  149.95,
  ARRAY[
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/audio/jbl-flip6-front.jpg',
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/audio/jbl-flip6-side.jpg',
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/audio/jbl-flip6-lifestyle.jpg'
  ],
  'Electronics',
  ARRAY['Global', 'US', 'EU'],
  TRUE,
  75,
  18.00,
  TRUE,
  'd9ff2682-be35-4250-bd69-419b74621236',
  'JBL-FLIP6-BLU'
),

-- CAMERA CATEGORY
-- Canon EOS R50
(
  'Canon EOS R50 Mirrorless Camera',
  'Canon',
  'Compact mirrorless camera with 24.2MP sensor and 4K video recording.',
  'The Canon EOS R50 is perfect for content creators and photography enthusiasts. Features a 24.2MP APS-C sensor, DIGIC X processor, and advanced autofocus system for stunning photos and 4K videos.',
  679.99,
  729.99,
  ARRAY[
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/camera/canon-eos-r50-side.jpg',
    'https://mqnwtfbdgcuvqvnloidt.supabase.co/storage/v1/object/public/product-images/sample-products/camera/canon-eos-r50-detail.jpg'
  ],
  'Electronics',
  ARRAY['Global', 'US', 'EU'],
  TRUE,
  20,
  10.00,
  TRUE,
  'd9ff2682-be35-4250-bd69-419b74621236',
  'CANON-R50-BLK'
);

-- After running this, you should see products in your main shop with real images!
-- Don't forget to:
-- 1. Replace 'd9ff2682-be35-4250-bd69-419b74621236' with actual supplier UUID
-- 2. Run: sql/migrations/004-products-descriptions.sql (if not done yet)
-- 3. Test your main shop: http://localhost:3000/main-shop