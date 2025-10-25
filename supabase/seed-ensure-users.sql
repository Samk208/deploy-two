-- supabase/seed-ensure-users.sql
-- Purpose: Ensure local Admin, Supplier, and five Influencer users + profiles exist
-- Safety: Run only in local development. Set the environment GUC per session.
--   SELECT set_config('app.environment', 'development', true);

DO $$
DECLARE
  v_env TEXT := COALESCE(current_setting('app.environment', true), '');
  v_admin UUID;
  v_supplier UUID;
  u_emails TEXT[] := ARRAY[
    'style-forward@test.local',
    'tech-trends@test.local',
    'fit-life@test.local',
    'home-essentials@test.local',
    'outdoor-gear@test.local'
  ];
  u_names TEXT[] := ARRAY[
    'Style Forward',
    'Tech Trends',
    'Fit Life',
    'Home Essentials',
    'Outdoor Gear'
  ];
  i INT;
  v_id UUID;
BEGIN
  IF v_env ILIKE 'prod%' THEN
    RAISE EXCEPTION 'Refusing to run dev seed in production (app.environment=%).', v_env;
  END IF;

  -- Admin (JWT app_metadata.role = 'admin'); profiles.role stays non-admin
  SELECT id INTO v_admin FROM auth.users WHERE email = 'admin@example.com';
  IF v_admin IS NULL THEN
    v_admin := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_user_meta_data, raw_app_meta_data
    ) VALUES (
      v_admin, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated',
      'admin@example.com', crypt('Admin12345!', gen_salt('bf')),
      now(), now(), now(), '{"name":"Local Admin","test":true}'::jsonb,
      '{"role":"admin"}'::jsonb
    ) ON CONFLICT (id) DO NOTHING;
  END IF;
  INSERT INTO public.profiles (id, name, role, verified)
  VALUES (v_admin, 'Local Admin', 'customer', true)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = 'customer', verified = true;

  -- Supplier (product owner)
  SELECT id INTO v_supplier FROM auth.users WHERE email = 'supplier@example.com';
  IF v_supplier IS NULL THEN
    v_supplier := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_user_meta_data, raw_app_meta_data
    ) VALUES (
      v_supplier, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated',
      'supplier@example.com', crypt('Dev12345!', gen_salt('bf')),
      now(), now(), now(), '{"name":"Local Supplier","test":true}'::jsonb,
      '{"role":"supplier"}'::jsonb
    ) ON CONFLICT (id) DO NOTHING;
  END IF;
  INSERT INTO public.profiles (id, name, role, verified)
  VALUES (v_supplier, 'Local Supplier', 'supplier', true)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = 'supplier', verified = true;

  -- Five influencer users + profiles
  FOR i IN 1..5 LOOP
    SELECT id INTO v_id FROM auth.users WHERE email = u_emails[i];
    IF v_id IS NULL THEN
      v_id := gen_random_uuid();
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_user_meta_data, raw_app_meta_data
      ) VALUES (
        v_id, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated',
        u_emails[i], crypt('password123', gen_salt('bf')),
        now(), now(), now(), jsonb_build_object('name', u_names[i], 'test', true),
        '{"role":"influencer"}'::jsonb
      ) ON CONFLICT (id) DO NOTHING;
    END IF;
    INSERT INTO public.profiles (id, name, role, verified)
    VALUES (v_id, u_names[i], 'influencer', true)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = 'influencer', verified = true;
  END LOOP;

  RAISE NOTICE '✅ Users ensured: admin, supplier, and five influencers.';
END $$;