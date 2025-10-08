-- =====================================================
-- FIX: Link Real Products to Influencer Shops
-- =====================================================
-- This script replaces old test products with real uploaded products

-- =====================================================
-- STEP 1: Remove Old Test Product Links
-- =====================================================
DELETE FROM influencer_shop_products
WHERE
    product_id IN (
        SELECT p.id
        FROM products p
        WHERE
            p.title LIKE '%E2E Test%'
            OR p.title LIKE '%Test Product%'
            OR p.supplier_id != 'd9ff2682-be35-4250-bd69-419b74621236'
    );

-- Show what was removed
SELECT 'CLEANUP COMPLETE' as status, 'Old test product links removed' as action;

-- =====================================================
-- STEP 2: Link Real Products to Style Forward (Fashion/Lifestyle)
-- =====================================================
-- Get Style Forward influencer ID
DO $$
DECLARE
  style_forward_id UUID;
BEGIN
  SELECT s.influencer_id INTO style_forward_id
  FROM shops s 
  WHERE s.handle = 'style-forward' 
  LIMIT 1;
  
  IF style_forward_id IS NULL THEN
    RAISE NOTICE 'Style Forward shop not found, skipping...';
  ELSE
    -- Link Nike Air Force 1 (main product)
    INSERT INTO influencer_shop_products (influencer_id, product_id, sale_price, published)
    SELECT 
      style_forward_id,
      p.id,
      ROUND(p.price * 0.90, 2) as sale_price,  -- 10% discount
      true
    FROM products p 
    WHERE p.title LIKE '%Nike Air Force%' 
      AND p.supplier_id = 'd9ff2682-be35-4250-bd69-419b74621236'
    ON CONFLICT (influencer_id, product_id) DO NOTHING;
    
    -- Link Adidas Ultraboost (secondary)
    INSERT INTO influencer_shop_products (influencer_id, product_id, sale_price, published)
    SELECT 
      style_forward_id,
      p.id,
      ROUND(p.price * 0.92, 2) as sale_price,  -- 8% discount
      true
    FROM products p 
    WHERE p.title LIKE '%Adidas Ultraboost%' 
      AND p.supplier_id = 'd9ff2682-be35-4250-bd69-419b74621236'
    ON CONFLICT (influencer_id, product_id) DO NOTHING;
    
    -- Link Hydro Flask (lifestyle accessory)
    INSERT INTO influencer_shop_products (influencer_id, product_id, sale_price, published)
    SELECT 
      style_forward_id,
      p.id,
      ROUND(p.price * 0.95, 2) as sale_price,  -- 5% discount
      true
    FROM products p 
    WHERE p.title LIKE '%Hydro Flask%' 
      AND p.supplier_id = 'd9ff2682-be35-4250-bd69-419b74621236'
    ON CONFLICT (influencer_id, product_id) DO NOTHING;
    
    RAISE NOTICE 'Style Forward products linked ✓';
  END IF;
END $$;

-- =====================================================
-- STEP 3: Link Real Products to Tech Trends (Electronics)
-- =====================================================
DO $$
DECLARE
  tech_trends_id UUID;
BEGIN
  SELECT s.influencer_id INTO tech_trends_id
  FROM shops s 
  WHERE s.handle = 'tech-trends' 
  LIMIT 1;
  
  IF tech_trends_id IS NULL THEN
    RAISE NOTICE 'Tech Trends shop not found, skipping...';
  ELSE
    -- Link Sony Headphones (main tech product)
    INSERT INTO influencer_shop_products (influencer_id, product_id, sale_price, published)
    SELECT 
      tech_trends_id,
      p.id,
      ROUND(p.price * 0.88, 2) as sale_price,  -- 12% discount
      true
    FROM products p 
    WHERE p.title LIKE '%Sony WH-1000XM5%' 
      AND p.supplier_id = 'd9ff2682-be35-4250-bd69-419b74621236'
    ON CONFLICT (influencer_id, product_id) DO NOTHING;
    
    -- Link Apple Watch (tech wearable)
    INSERT INTO influencer_shop_products (influencer_id, product_id, sale_price, published)
    SELECT 
      tech_trends_id,
      p.id,
      ROUND(p.price * 0.93, 2) as sale_price,  -- 7% discount
      true
    FROM products p 
    WHERE p.title LIKE '%Apple Watch%' 
      AND p.supplier_id = 'd9ff2682-be35-4250-bd69-419b74621236'
    ON CONFLICT (influencer_id, product_id) DO NOTHING;
    
    -- Link Keychron Keyboard (tech peripheral)
    INSERT INTO influencer_shop_products (influencer_id, product_id, sale_price, published)
    SELECT 
      tech_trends_id,
      p.id,
      ROUND(p.price * 0.90, 2) as sale_price,  -- 10% discount
      true
    FROM products p 
    WHERE p.title LIKE '%Keychron K2%' 
      AND p.supplier_id = 'd9ff2682-be35-4250-bd69-419b74621236'
    ON CONFLICT (influencer_id, product_id) DO NOTHING;
    
    RAISE NOTICE 'Tech Trends products linked ✓';
  END IF;
END $$;

-- =====================================================
-- STEP 4: Link Real Products to Influencer Alex (Mixed)
-- =====================================================
DO $$
DECLARE
  alex_id UUID;
BEGIN
  SELECT s.influencer_id INTO alex_id
  FROM shops s 
  WHERE s.handle = 'influencer-alex' 
  LIMIT 1;
  
  IF alex_id IS NULL THEN
    RAISE NOTICE 'Influencer Alex shop not found, skipping...';
  ELSE
    -- Link Canon Camera (photography)
    INSERT INTO influencer_shop_products (influencer_id, product_id, sale_price, published)
    SELECT 
      alex_id,
      p.id,
      ROUND(p.price * 0.95, 2) as sale_price,  -- 5% discount
      true
    FROM products p 
    WHERE p.title LIKE '%Canon EOS R50%' 
      AND p.supplier_id = 'd9ff2682-be35-4250-bd69-419b74621236'
    ON CONFLICT (influencer_id, product_id) DO NOTHING;
    
    -- Link Peak Design Backpack (travel/photography)
    INSERT INTO influencer_shop_products (influencer_id, product_id, sale_price, published)
    SELECT 
      alex_id,
      p.id,
      ROUND(p.price * 0.92, 2) as sale_price,  -- 8% discount
      true
    FROM products p 
    WHERE p.title LIKE '%Peak Design%' 
      AND p.supplier_id = 'd9ff2682-be35-4250-bd69-419b74621236'
    ON CONFLICT (influencer_id, product_id) DO NOTHING;
    
    -- Link JBL Speaker (audio)
    INSERT INTO influencer_shop_products (influencer_id, product_id, sale_price, published)
    SELECT 
      alex_id,
      p.id,
      ROUND(p.price * 0.90, 2) as sale_price,  -- 10% discount
      true
    FROM products p 
    WHERE p.title LIKE '%JBL Flip%' 
      AND p.supplier_id = 'd9ff2682-be35-4250-bd69-419b74621236'
    ON CONFLICT (influencer_id, product_id) DO NOTHING;
    
    RAISE NOTICE 'Influencer Alex products linked ✓';
  END IF;
END $$;

-- =====================================================
-- STEP 5: Verification - Show New Links
-- =====================================================
SELECT
    'VERIFICATION' as check_type,
    s.handle as shop_handle,
    p.title as product_title,
    p.brand,
    isp.sale_price,
    ROUND(
        (
            (p.price - isp.sale_price) / p.price * 100
        ),
        1
    ) as discount_percent
FROM
    influencer_shop_products isp
    JOIN products p ON isp.product_id = p.id
    JOIN shops s ON isp.influencer_id = s.influencer_id
WHERE
    isp.published = true
    AND p.supplier_id = 'd9ff2682-be35-4250-bd69-419b74621236'
ORDER BY s.handle, p.title;

-- =====================================================
-- STEP 6: Final Summary
-- =====================================================
SELECT 'LINKAGE COMPLETE' as status, 'Influencer shops now show real products with discounts' as result, 'Visit /shops and click individual shops to verify' as next_step;