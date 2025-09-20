# Dev seeding: influencer shops and curated products

This guide seeds two demo influencer shops and links curated products so `/shop/[handle]` pages render.

Handles created:
- `style-forward` (fashion/lifestyle)
- `tech-trends` (electronics/gadgets)

What it does
- Creates or reuses two influencer profiles (dev-only test users if missing)
- Upserts shops for them
- Curates 3–4 products per shop from existing `products`
- Marks as published for visibility

Safety
- Dev-only guard using `app.environment` GUC; refuses to run if it smells like prod
- Does not modify core schemas, only inserts/updates dev data
- Test users flagged by emails `*@test.local`

Run
1) In Supabase SQL editor (or psql), set dev guard and execute the script:
```sql
SELECT set_config('app.environment', 'development', true);
\i supabase/seed-influencer-shops-dev.sql
```

2) Verify API and pages:
- `GET /api/shop/style-forward` should return products
- `GET /api/shop/tech-trends` should return products
- Visit `/shop/style-forward` and `/shop/tech-trends`

Notes
- The route `app/api/shop/[handle]/route.ts` returns product `id` from the underlying product for correct detail routing to `/shop/[handle]/product/[id]`.
- If you change image sources, ensure `next.config.mjs` `images.remotePatterns` allows those hosts.


