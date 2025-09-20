-- supabase/seed-influencer-shops-dev.sql
-- Development-only influencer shop sample data. DO NOT run in production.
-- Safety guard: abort if app.environment GUC indicates production.
-- To run safely in dev: SELECT set_config('app.environment', 'development', true);

DO $$
BEGIN
  IF COALESCE(current_setting('app.environment', true), '') ILIKE 'prod%' THEN
    RAISE EXCEPTION 'Refusing to run dev seed in production environment (app.environment=%).', current_setting('app.environment', true);
  END IF;
END $$;

-- Ensure we have at least two influencer profiles. Prefer existing; otherwise create clearly-marked test influencers.
DO $$
DECLARE
  influencer_a UUID;
  influencer_b UUID;
  have_two BOOLEAN := false;
BEGIN
  -- Try to find two existing influencers
  SELECT array_agg(id)[1], array_agg(id)[2]
  INTO influencer_a, influencer_b
  FROM (
    SELECT id FROM public.profiles WHERE role = 'influencer' ORDER BY created_at ASC LIMIT 2
  ) s;

  have_two := influencer_a IS NOT NULL AND influencer_b IS NOT NULL;

  -- If fewer than two, create missing test influencers in auth.users + profiles
  IF NOT have_two THEN
    -- Create first test influencer if missing
    IF influencer_a IS NULL THEN
      influencer_a := gen_random_uuid();
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data
      ) VALUES (
        influencer_a, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated',
        'style-forward@test.local', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"name":"Style Forward","role":"influencer","test":true}'::jsonb
      ) ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.profiles (id, name, role, avatar, verified)
      VALUES (influencer_a, 'Style Forward', 'influencer', NULL, true)
      ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name;
    END IF;

    -- Create second test influencer if missing
    IF influencer_b IS NULL THEN
      influencer_b := gen_random_uuid();
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data
      ) VALUES (
        influencer_b, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated',
        'tech-trends@test.local', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"name":"Tech Trends","role":"influencer","test":true}'::jsonb
      ) ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.profiles (id, name, role, avatar, verified)
      VALUES (influencer_b, 'Tech Trends', 'influencer', NULL, true)
      ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name;
    END IF;
  END IF;

  -- Upsert shops for both influencers
  INSERT INTO public.shops (influencer_id, handle, name, description, logo, banner)
  VALUES
    (influencer_a, 'style-forward', 'Style Forward', '[TEST] Fashion & lifestyle curation for demos',
      'https://images.unsplash.com/photo-1516570161787-2fd917215a3d?w=256',
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200'
    )
  ON CONFLICT (handle) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, logo = EXCLUDED.logo, banner = EXCLUDED.banner;

  INSERT INTO public.shops (influencer_id, handle, name, description, logo, banner)
  VALUES
    (influencer_b, 'tech-trends', 'Tech Trends', '[TEST] Electronics & gadgets selection for demos',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=256',
      'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1200'
    )
  ON CONFLICT (handle) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, logo = EXCLUDED.logo, banner = EXCLUDED.banner;

  -- Link 3-4 products to Style Forward (prefer Fashion category)
  INSERT INTO public.influencer_shop_products (influencer_id, product_id, sale_price, custom_title, published)
  SELECT influencer_a,
         p.id,
         CASE WHEN p.price IS NOT NULL THEN ROUND(p.price * 0.9, 2) ELSE NULL END AS sale_price,
         NULL,
         true
  FROM (
    SELECT id, price FROM public.products WHERE active = true AND in_stock = true AND (category ILIKE 'Fashion%' OR category ILIKE 'Apparel%')
    UNION ALL
    SELECT id, price FROM public.products WHERE active = true AND in_stock = true AND category IS NOT NULL
  ) p
  ON CONFLICT (influencer_id, product_id) DO NOTHING;

  -- To keep it to 3-4 curated items, delete extras beyond 4 for this influencer (dev-only safety)
  DELETE FROM public.influencer_shop_products isp
  USING (
    SELECT product_id FROM public.influencer_shop_products WHERE influencer_id = influencer_a ORDER BY created_at ASC OFFSET 4
  ) d
  WHERE isp.influencer_id = influencer_a AND isp.product_id = d.product_id;

  -- Link 3-4 products to Tech Trends (prefer Electronics)
  INSERT INTO public.influencer_shop_products (influencer_id, product_id, sale_price, custom_title, published)
  SELECT influencer_b,
         p.id,
         CASE WHEN p.price IS NOT NULL THEN ROUND(p.price * 0.95, 2) ELSE NULL END AS sale_price,
         NULL,
         true
  FROM (
    SELECT id, price FROM public.products WHERE active = true AND in_stock = true AND category ILIKE 'Electronics%'
    UNION ALL
    SELECT id, price FROM public.products WHERE active = true AND in_stock = true AND category IS NOT NULL
  ) p
  ON CONFLICT (influencer_id, product_id) DO NOTHING;

  DELETE FROM public.influencer_shop_products isp
  USING (
    SELECT product_id FROM public.influencer_shop_products WHERE influencer_id = influencer_b ORDER BY created_at ASC OFFSET 4
  ) d
  WHERE isp.influencer_id = influencer_b AND isp.product_id = d.product_id;

  RAISE NOTICE '✅ Seeded influencer shops (style-forward, tech-trends) with curated products.';
END $$;


