-- =====================================================
-- DIAGNOSTIC: Influencer Shop Product Linkage Issue
-- =====================================================
-- Run this to understand why influencer shops show old products

-- =====================================================
-- CHECK 1: Current Influencer Shops
-- =====================================================
SELECT 'INFLUENCER SHOPS' as check_type, s.handle, s.name, s.influencer_id, s.active
FROM shops s
ORDER BY s.handle;

-- =====================================================
-- CHECK 2: Products Linked to Influencer Shops
-- =====================================================
SELECT
    'LINKED PRODUCTS' as check_type,
    s.handle as shop_handle,
    p.title as product_title,
    p.brand,
    p.price,
    isp.published,
    p.created_at,
    CASE
        WHEN p.title LIKE '%E2E Test%' THEN 'OLD TEST PRODUCT ❌'
        WHEN p.title LIKE '%Sony%'
        OR p.title LIKE '%Apple%'
        OR p.title LIKE '%Nike%' THEN 'NEW REAL PRODUCT ✓'
        ELSE 'OTHER PRODUCT'
    END as product_type
FROM
    influencer_shop_products isp
    JOIN products p ON isp.product_id = p.id
    JOIN shops s ON isp.influencer_id = s.influencer_id
WHERE
    isp.published = true
ORDER BY s.handle, product_type, p.created_at DESC;

-- =====================================================
-- CHECK 3: Real Products NOT Linked to Any Influencer
-- =====================================================
SELECT
    'UNLINKED REAL PRODUCTS' as check_type,
    p.id,
    p.title,
    p.brand,
    p.price,
    p.created_at,
    'Available to link ✓' as status
FROM
    products p
    LEFT JOIN influencer_shop_products isp ON p.id = isp.product_id
WHERE
    p.active = true
    AND p.in_stock = true
    AND p.stock_count > 0
    AND isp.product_id IS NULL -- Not linked to any influencer
    AND p.supplier_id = 'd9ff2682-be35-4250-bd69-419b74621236' -- Our real products
ORDER BY p.created_at DESC;

-- =====================================================
-- CHECK 4: Old Test Products Still Linked
-- =====================================================
SELECT
    'OLD TEST PRODUCTS STILL LINKED' as check_type,
    s.handle as shop_handle,
    p.title as old_product_title,
    p.created_at,
    'Should be removed ⚠️' as status
FROM
    influencer_shop_products isp
    JOIN products p ON isp.product_id = p.id
    JOIN shops s ON isp.influencer_id = s.influencer_id
WHERE
    isp.published = true
    AND (
        p.title LIKE '%E2E Test%'
        OR p.title LIKE '%Test Product%'
    )
ORDER BY s.handle, p.created_at;

-- =====================================================
-- CHECK 5: Influencer IDs for Reference
-- =====================================================
SELECT
    'INFLUENCER IDS' as check_type,
    p.id as profile_id,
    p.name,
    s.handle,
    s.influencer_id
FROM profiles p
    JOIN shops s ON p.id = s.influencer_id
WHERE
    p.role = 'influencer'
ORDER BY s.handle;

-- =====================================================
-- SUMMARY: What Needs to be Fixed
-- =====================================================
SELECT
    'SUMMARY' as check_type,
    'Old test products linked to influencers' as issue_1,
    'New real products NOT linked to influencers' as issue_2,
    'Need to replace old links with new products' as solution;

-- =====================================================
-- BONUS: Quick Stats
-- =====================================================
SELECT
    'QUICK STATS' as check_type,
    COUNT(*) FILTER (
        WHERE
            isp.product_id IS NOT NULL
    ) as total_linked_products,
    COUNT(*) FILTER (
        WHERE
            p.title LIKE '%E2E Test%'
    ) as old_test_products_linked,
    COUNT(*) FILTER (
        WHERE
            p.supplier_id = 'd9ff2682-be35-4250-bd69-419b74621236'
    ) as real_products_linked
FROM
    products p
    LEFT JOIN influencer_shop_products isp ON p.id = isp.product_id
    AND isp.published = true
WHERE
    p.active = true;