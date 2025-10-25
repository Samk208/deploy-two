-- supabase/verify-local-data.sql
-- Purpose: Quick checks to confirm users, products, shops, and curated links

SELECT set_config ( 'app.environment', 'development', true );

-- Users
SELECT
    email,
    raw_app_meta_data ->> 'role' AS app_role
FROM auth.users
WHERE
    email IN (
        'admin@example.com',
        'supplier@example.com',
        'style-forward@test.local',
        'tech-trends@test.local',
        'fit-life@test.local',
        'home-essentials@test.local',
        'outdoor-gear@test.local'
    )
ORDER BY email;

SELECT id, name, role
FROM public.profiles
WHERE
    id IN (
        SELECT id
        FROM auth.users
        WHERE
            email IN (
                'admin@example.com',
                'supplier@example.com',
                'style-forward@test.local',
                'tech-trends@test.local',
                'fit-life@test.local',
                'home-essentials@test.local',
                'outdoor-gear@test.local'
            )
    );

-- Products
SELECT COUNT(*) AS total_products FROM public.products;

SELECT
    sku,
    title,
    array_length (images, 1) AS image_count,
    active,
    in_stock,
    stock_count
FROM public.products
ORDER BY sku;

-- Shops
SELECT handle, name, influencer_id
FROM public.shops
ORDER BY created_at DESC;

-- Curated links per shop
SELECT s.handle, COUNT(*) AS linked
FROM public.influencer_shop_products isp
    JOIN public.shops s ON s.influencer_id = isp.influencer_id
WHERE
    isp.published = true
GROUP BY
    s.handle
ORDER BY s.handle;