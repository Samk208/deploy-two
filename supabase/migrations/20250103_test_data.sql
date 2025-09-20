-- Test data for One-Link platform
-- This creates sample users and products for testing

-- First, let's create some test users
-- Note: In a real scenario, users would be created through Supabase Auth
-- For testing, we'll create them directly

INSERT INTO users (id, email, name, role, verified, avatar) VALUES
  -- Test admin user
  ('550e8400-e29b-41d4-a716-446655440000', 'admin@onelink.com', 'Admin User', 'admin', true, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'),
  
  -- Test suppliers
  ('550e8400-e29b-41d4-a716-446655440001', 'supplier1@example.com', 'TechGear Supplier', 'supplier', true, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
  ('550e8400-e29b-41d4-a716-446655440002', 'supplier2@example.com', 'Fashion Forward Co', 'supplier', true, 'https://images.unsplash.com/photo-1494790108755-2616b612c7db?w=150'),
  ('550e8400-e29b-41d4-a716-446655440003', 'supplier3@example.com', 'Home & Garden Plus', 'supplier', true, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'),
  
  -- Test influencers
  ('550e8400-e29b-41d4-a716-446655440004', 'influencer1@example.com', 'Tech Reviewer Sarah', 'influencer', true, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'),
  ('550e8400-e29b-41d4-a716-446655440005', 'influencer2@example.com', 'Fashion Blogger Mike', 'influencer', true, 'https://images.unsplash.com/photo-1507537362848-9c7e70b7b5c1?w=150'),
  
  -- Test customers
  ('550e8400-e29b-41d4-a716-446655440006', 'customer1@example.com', 'John Customer', 'customer', false, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'),
  ('550e8400-e29b-41d4-a716-446655440007', 'customer2@example.com', 'Jane Buyer', 'customer', false, 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150')
ON CONFLICT (id) DO NOTHING;

-- Create test products
INSERT INTO products (
  id, title, description, price, original_price, images, category, region, 
  in_stock, stock_count, commission, active, supplier_id, sku
) VALUES
  -- Tech Products
  (
    '660e8400-e29b-41d4-a716-446655440001',
    'Wireless Gaming Headset Pro',
    'High-quality wireless gaming headset with 7.1 surround sound, noise cancellation, and 20-hour battery life. Perfect for gaming marathons and professional esports.',
    299.99,
    349.99,
    ARRAY['https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=500', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500'],
    'Electronics',
    ARRAY['US', 'EU', 'UK'],
    true,
    50,
    15.00,
    true,
    '550e8400-e29b-41d4-a716-446655440001',
    'TECH-HEADSET-001'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440002',
    'Mechanical Keyboard RGB',
    'Premium mechanical keyboard with Cherry MX switches, RGB backlighting, and programmable keys. Built for gamers and programmers who demand the best.',
    189.99,
    229.99,
    ARRAY['https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=500', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500'],
    'Electronics',
    ARRAY['US', 'CA'],
    true,
    30,
    12.00,
    true,
    '550e8400-e29b-41d4-a716-446655440001',
    'TECH-KEYBOARD-001'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440003',
    '4K Webcam with Microphone',
    'Ultra HD 4K webcam with built-in noise-canceling microphone. Perfect for streaming, video calls, and content creation.',
    149.99,
    179.99,
    ARRAY['https://images.unsplash.com/photo-1527430253228-e93688616381?w=500'],
    'Electronics',
    ARRAY['US', 'EU'],
    true,
    25,
    18.00,
    true,
    '550e8400-e29b-41d4-a716-446655440001',
    'TECH-WEBCAM-001'
  ),

  -- Fashion Products
  (
    '660e8400-e29b-41d4-a716-446655440004',
    'Premium Cotton T-Shirt',
    'Ultra-soft premium cotton t-shirt with modern fit. Available in multiple colors and sizes. Perfect for casual wear or layering.',
    29.99,
    39.99,
    ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', 'https://images.unsplash.com/photo-1583743814966-8936f37f8ec2?w=500'],
    'Fashion',
    ARRAY['US', 'EU', 'UK'],
    true,
    100,
    25.00,
    true,
    '550e8400-e29b-41d4-a716-446655440002',
    'FASH-TSHIRT-001'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440005',
    'Designer Denim Jacket',
    'Classic denim jacket with modern styling. Made from high-quality denim with comfortable fit. A timeless piece for any wardrobe.',
    89.99,
    119.99,
    ARRAY['https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=500'],
    'Fashion',
    ARRAY['US', 'CA'],
    true,
    40,
    20.00,
    true,
    '550e8400-e29b-41d4-a716-446655440002',
    'FASH-JACKET-001'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440006',
    'Athletic Performance Sneakers',
    'High-performance athletic sneakers with advanced cushioning and breathable materials. Perfect for running, training, and everyday wear.',
    129.99,
    159.99,
    ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500'],
    'Fashion',
    ARRAY['US', 'EU', 'UK'],
    true,
    60,
    22.00,
    true,
    '550e8400-e29b-41d4-a716-446655440002',
    'FASH-SNEAKERS-001'
  ),

  -- Home & Garden Products
  (
    '660e8400-e29b-41d4-a716-446655440007',
    'Smart Plant Monitor',
    'Monitor your plants health with this smart device that tracks moisture, light, temperature, and nutrients. Receive alerts on your phone.',
    49.99,
    69.99,
    ARRAY['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500'],
    'Home & Garden',
    ARRAY['US', 'EU'],
    true,
    35,
    30.00,
    true,
    '550e8400-e29b-41d4-a716-446655440003',
    'HOME-PLANT-001'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440008',
    'Ergonomic Office Chair',
    'Premium ergonomic office chair with lumbar support, adjustable height, and breathable mesh back. Perfect for long work sessions.',
    399.99,
    499.99,
    ARRAY['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500'],
    'Home & Garden',
    ARRAY['US', 'CA'],
    true,
    15,
    28.00,
    true,
    '550e8400-e29b-41d4-a716-446655440003',
    'HOME-CHAIR-001'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440009',
    'LED Desk Lamp with Wireless Charging',
    'Modern LED desk lamp with adjustable brightness, color temperature control, and wireless charging pad for your devices.',
    79.99,
    99.99,
    ARRAY['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500'],
    'Home & Garden',
    ARRAY['US', 'EU', 'UK'],
    true,
    45,
    26.00,
    true,
    '550e8400-e29b-41d4-a716-446655440003',
    'HOME-LAMP-001'
  ),

  -- Beauty Products
  (
    '660e8400-e29b-41d4-a716-446655440010',
    'Organic Face Moisturizer',
    'Luxurious organic face moisturizer with natural ingredients. Suitable for all skin types, provides deep hydration and anti-aging benefits.',
    39.99,
    49.99,
    ARRAY['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500'],
    'Beauty',
    ARRAY['US', 'EU', 'UK'],
    true,
    80,
    35.00,
    true,
    '550e8400-e29b-41d4-a716-446655440002',
    'BEAUTY-MOIST-001'
  ),

  -- Sports Products
  (
    '660e8400-e29b-41d4-a716-446655440011',
    'Yoga Mat Premium',
    'High-quality yoga mat with excellent grip and cushioning. Made from eco-friendly materials with alignment lines for perfect poses.',
    59.99,
    79.99,
    ARRAY['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500'],
    'Sports',
    ARRAY['US', 'CA', 'EU'],
    true,
    70,
    20.00,
    true,
    '550e8400-e29b-41d4-a716-446655440003',
    'SPORTS-YOGA-001'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440012',
    'Bluetooth Fitness Tracker',
    'Advanced fitness tracker with heart rate monitoring, sleep tracking, and smartphone notifications. Water-resistant design.',
    99.99,
    129.99,
    ARRAY['https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500'],
    'Sports',
    ARRAY['US', 'EU'],
    true,
    55,
    24.00,
    true,
    '550e8400-e29b-41d4-a716-446655440001',
    'SPORTS-TRACKER-001'
  )
ON CONFLICT (id) DO NOTHING;

-- Create test shops
INSERT INTO shops (
  id, influencer_id, handle, name, description, logo, banner, products, active
) VALUES
  (
    '770e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440004',
    'tech-sarah',
    'Sarah\'s Tech Corner',
    'The best tech reviews and recommendations from your favorite tech influencer. Discover the latest gadgets and gear.',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800',
    ARRAY['660e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003'],
    true
  ),
  (
    '770e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440005',
    'fashion-mike',
    'Mike\'s Style Hub',
    'Fashion forward recommendations for the modern individual. Curated collections of the latest trends and timeless pieces.',
    'https://images.unsplash.com/photo-1507537362848-9c7e70b7b5c1?w=200',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
    ARRAY['660e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440006'],
    true
  )
ON CONFLICT (id) DO NOTHING;
