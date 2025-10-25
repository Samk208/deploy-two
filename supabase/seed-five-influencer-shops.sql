-- supabase/seed-five-influencer-shops.sql
-- Purpose: Ensure five influencer shops and link exactly five products (multi-image) each
-- Safety: Run only in local development. Set GUC:
--   SELECT set_config('app.environment', 'development', true);

DO $$
DECLARE
  v_env TEXT := COALESCE(current_setting('app.environment', true), '');
  handles TEXT[] := ARRAY['style-forward','tech-trends','fit-life','home-essentials','outdoor-gear'];
  names   TEXT[] := ARRAY['Style Forward','Tech Trends','Fit Life','Home Essentials','Outdoor Gear'];
  descs   TEXT[] := ARRAY[
    '[TEST] Fashion & lifestyle curation for demos',
    '[TEST] Electronics & gadgets selection for demos',
    '[TEST] Fitness & wellness picks for demos',
    '[TEST] Home essentials & decor for demos',
    '[TEST] Outdoor & travel gear for demos'
  ];
  logos   TEXT[] := ARRAY[
    'https://images.unsplash.com/photo-1516570161787-2fd917215a3d?w=256',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=256',
    'https://images.unsplash.com/photo-1526403229783-7a5410e0e829?w=256',
    'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=256',
    'https://images.unsplash.com/photo-1520975916090-3105956dac38?w=256'
  ];
  banners TEXT[] := ARRAY[
    'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200',
    'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1200',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200',
    'https://images.unsplash.com/photo-1505692794403-34d4982fd1ab?w=1200',
    'https://images.unsplash.com/photo-1520975916090-3105956dac38?w=1200'
  ];
  i INT;
  v_uid UUID;
BEGIN
  IF v_env ILIKE 'prod%' THEN
    RAISE EXCEPTION 'Refusing to run dev seed in production (app.environment=%).', v_env;
  END IF;

  -- Build a multi-image product pool
  CREATE TEMP TABLE tmp_pool AS
  SELECT id, category
  FROM public.products
  WHERE active = true AND deleted_at IS NULL AND in_stock = true AND stock_count > 0
    AND array_length(images, 1) >= 3
  ORDER BY created_at DESC;

  FOR i IN 1..5 LOOP
    -- Resolve influencer user id by email derived from handle
    SELECT id INTO v_uid FROM auth.users WHERE email = (handles[i] || '@test.local');
    IF v_uid IS NULL THEN
      RAISE NOTICE 'Influencer % not found in auth.users; run seed-ensure-users.sql first', handles[i];
      CONTINUE;
    END IF;

    -- Profile safety
    INSERT INTO public.profiles (id, name, role, verified)
    VALUES (v_uid, names[i], 'influencer', true)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = 'influencer', verified = true;

    -- Upsert shop
    INSERT INTO public.shops (influencer_id, handle, name, description, logo, banner)
    VALUES (v_uid, handles[i], names[i], descs[i], logos[i], banners[i])
    ON CONFLICT (handle) DO UPDATE
      SET influencer_id = EXCLUDED.influencer_id,
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          logo = EXCLUDED.logo,
          banner = EXCLUDED.banner;

    -- Link exactly 5 products (theme bias via CASE)
    WITH picks AS (
      SELECT p.id
      FROM tmp_pool p
      ORDER BY CASE
        WHEN i = 1 AND p.category ILIKE 'Fashion%' THEN 0
        WHEN i = 2 AND p.category ILIKE 'Electronics%' THEN 0
        WHEN i = 3 AND (p.category ILIKE 'Wearables%' OR p.category ILIKE 'Electronics%') THEN 0
        WHEN i = 4 AND (p.category ILIKE 'Accessories%' OR p.category ILIKE 'Home%') THEN 0
        WHEN i = 5 AND (p.category ILIKE 'Accessories%' OR p.category ILIKE 'Footwear%' OR p.category ILIKE 'Electronics%') THEN 0
        ELSE 1
      END, p.id DESC
      LIMIT 10
    )
    INSERT INTO public.influencer_shop_products (influencer_id, product_id, published)
    SELECT v_uid, x.id, true
    FROM (SELECT DISTINCT id FROM picks LIMIT 5) x
    ON CONFLICT (influencer_id, product_id) DO NOTHING;
  END LOOP;

  -- Ensure max 5 per shop
  WITH ranked AS (
    SELECT influencer_id, product_id,
           ROW_NUMBER() OVER (PARTITION BY influencer_id ORDER BY created_at ASC) rn
    FROM public.influencer_shop_products
  )
  DELETE FROM public.influencer_shop_products isp
  USING ranked r
  WHERE isp.influencer_id = r.influencer_id
    AND isp.product_id = r.product_id
    AND r.rn > 5;

  RAISE NOTICE '✅ Ensured five influencer shops with five products each.';
END $$;