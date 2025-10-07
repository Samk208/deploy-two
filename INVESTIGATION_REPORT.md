# INVESTIGATION_REPORT.md

Date: 2025-10-06 21:18 (local)

Scope: Root-cause investigation for fake influencer cards flash and disappearing products on `/shops` and `/shop/*`.

---

## Findings

- **[schema-table-references]**
  - No references to a non-existent `influencer_shops` table in the codebase.
    - Search: No results for `influencer_shops` across `*.ts,*.tsx,*.sql,*.js,*.mjs`.
  - Multiple references to existing tables: `shops` and `influencer_shop_products`.
    - `app/api/shops/directory/route.ts:10-15` selects from `shops` and aggregates `influencer_shop_products`.
    - `app/api/shop/[handle]/route.ts:49-56,77-98` resolves a `shop` then queries `influencer_shop_products` with `published = true`.
    - `app/shop/[handle]/product/[id]/page.tsx:241-266,321-341` queries `shops` and `influencer_shop_products`.
    - Supabase types show `public.shops` and `public.influencer_shop_products` exist: `lib/supabase/database.types.ts:424-466`, `:221-261`.

- **[demo-fallbacks]** Mock/demo data sources that contain listed names/handles
  - `app/shops/page.tsx` contains a hard-coded `mockShops` array with demo entries and the exact handles/names:
    - `sarah_style`: `app/shops/page.tsx:116-136`
    - `tech_guru_mike`: `app/shops/page.tsx:137-155`
    - `fitness_coach_alex`: `app/shops/page.tsx:195-213`
    - `foodie_adventures`: `app/shops/page.tsx:214-232`
    - Includes badges like `"Top Seller"`: `app/shops/page.tsx:289-295`
  - Additional demo mentions:
    - Product pages client files define `mockInfluencer` with `sarah_style`: `app/shop/[handle]/product/[id]/ProductDetailClient.tsx:36-41`; `ProductDetailPageClient.tsx:36-41`
    - Order success page links to `@sarah_style`: `app/order/success/page.tsx:233-236,274-275`
  - Style Forward name appears in tests/global setup:
    - `tests/setup/global-setup.ts:235-243` upserts a shop with `name: "Style Forward"` and `handle: "style-forward"`.

- **[seed-reset-fixtures]** Seed/reset/fixture paths that create or alter data
  - Playwright global setup seeds products with description "Seeded by global-setup" and creates shop + links:
    - Delete/cleanup of multiple tables: `tests/setup/global-setup.ts:86-108`
    - Insert E2E products with `description: "Seeded by global-setup"`: `tests/setup/global-setup.ts:178-227`
    - Upsert shop "Style Forward" with handle `style-forward`: `tests/setup/global-setup.ts:231-247`
    - Link products in `influencer_shop_products` (published): `tests/setup/global-setup.ts:249-263`
  - Dev/utility seed scripts (guarded by env, but exist):
    - `scripts/seed-influencer-shops-dev.mjs`: creates influencers, upserts `shops`, links `influencer_shop_products`. Guarded by `NODE_ENV` and `ALLOW_DEV_SEEDING`. See `:32-35`, `:84-93`, `:118-136`.
    - `scripts/seed-enhanced-products.mjs`: ensures shops and upserts products/links. See `:101-116`, `:118-132`, `:134-154`.
    - `scripts/seed-sample.mjs`: sample users, shops, products, links with strong guards. See `:45-58`, `:137-148`, `:177-195`.
    - SQL dev seed `supabase/seed-dev-data.sql` inserts products and a dev shop, then links via `influencer_shop_products`: `:49-79`, `:96-109`, `:111-126`, `:128-141`.
  - Global teardown file present: `tests/e2e/global-teardown.ts` (contents not required; presence confirmed by search).

- **[pages-components-routes]** All pages/components rendering `/shop` and `/shops`
  - `/shops`
    - `app/shops/page.tsx` (client page, 20kB, renders grid/list; loads `/api/shops/directory`) — contains demo fallback: initial state seeded with `mockShops` and only replaced on successful fetch.
      - Evidence of fallback usage: `useState<Shop[]>(mockShops)`: `app/shops/page.tsx:405`
      - On fetch failure or empty mapping, retains `mockShops`: `app/shops/page.tsx:423-429`
    - `app/shops/metadata.ts` (static metadata)
    - API backing it: `app/api/shops/directory/route.ts`
  - `/shop/[handle]`
    - `app/shop/[handle]/page.tsx` (server component; Suspense skeleton; fetches from `/api/shop/[handle]` and `notFound()` on missing) `:11-31`, `:43-52`, `:134-149`.
    - API backing it: `app/api/shop/[handle]/route.ts`
  - `/shop/[handle]/product/[id]`
    - `app/shop/[handle]/product/[id]/page.tsx` (server page; queries `shops` and `influencer_shop_products`; `notFound()` when link/products missing) `:298-344`.
  - Other files in `app/shop/` (not routes):
    - `app/shop/enhanced-page.tsx`, `app/shop/enhanced-page-fixed.tsx` (component/alt pages; not mounted by routing)
  - Components directory present: `components/shop/` (not opened; likely generic UI)

- **[RLS-policies-and-visibility]** Policies or data-fetch that could hide rows
  - Public RLS policies allow reading active/published rows:
    - Products: `"Anyone can view active products"` — `supabase/migrations/20250102_initial_schema.sql:49-53`.
    - Shops: `"Anyone can view active shops"` — `supabase/migrations/20250102_initial_schema.sql:80-84`.
    - Influencer shop products: policy present in `supabase/setup-minimal.sql` enabling SELECT where `published = true`: `:150-156`; RLS enabled: `:141-144`. Also indexes and unique constraints exist in migrations, e.g., `20250919_product_image_perf.sql:25-28`, `20251003_add_unique_shop_links.sql:8-9`.
  - API-level filtering further hides data when not linked/published/in-stock:
    - Directory API counts `influencer_shop_products` with `published = true` (not directly per-shop join): `app/api/shops/directory/route.ts:45-49` and aggregation loop `:54-71`.
    - Shop page API filters to published, then filters out products with `in_stock=false` or `stock_count <= 0`: `app/api/shop/[handle]/route.ts:118-156`.
    - Product detail page uses `notFound()` if influencer/product link missing: `app/shop/[handle]/product/[id]/page.tsx:342-344`.

---

## Repository Searches (path + excerpt)

- **[tables]** influencer_shops — no matches.
- **[tables]** influencer_shop_products
  - `tests/setup/global-setup.ts:89` `"influencer_shop_products", // depends on products and profiles`
  - `app/api/shop/[handle]/route.ts:78-98` join/selection from `influencer_shop_products`
  - `supabase/migrations/20250919_product_image_perf.sql:25-28` index for lookup
  - `supabase/migrations/20251003_add_unique_shop_links.sql:8-9` unique index `(influencer_id, product_id)`
  - `supabase/setup-minimal.sql:101-103,141-156,199-201` indexes, RLS, policies
- **[tables]** shops
  - `app/api/shops/directory/route.ts:10-15` main select from `shops`
  - `app/api/shop/[handle]/route.ts:49-56` resolve shop by handle
  - `app/shop/[handle]/product/[id]/page.tsx:241-244,303-307` select from `shops`
  - `lib/supabase/database.types.ts:424-466` typed definition
- **[demo-strings]** sarah_style | fitness_coach_alex | tech_guru_mike | foodie_adventures | Style Forward | Top Seller
  - `app/shops/page.tsx:116-136` sarah_style; `:195-213` fitness_coach_alex; `:137-155` tech_guru_mike; `:214-232` foodie_adventures; `:289-295` Top Seller badge mapping
  - `tests/setup/global-setup.ts:231-247` creates shop named "Style Forward"
  - `tests/e2e/shops-directory.spec.ts:33-34` selector mentions `STYLE FORWARD`
  - `app/shop/[handle]/product/[id]/ProductDetailClient.tsx:38-41` and `ProductDetailPageClient.tsx:38-41` mock `sarah_style`
  - `app/order/success/page.tsx:233-236,274-275` links referencing `@sarah_style`
- **[seeds-fixtures-reset]** seed | fixture | demo | sample | reset | cleanup | TRUNCATE | DELETE FROM | supabase db reset | global-setup | globalSetup | beforeAll | afterAll
  - `tests/setup/global-setup.ts:86-108` cleanup deletes
  - `tests/setup/global-setup.ts:178-227` product inserts with description "Seeded by global-setup"
  - `scripts/seed-influencer-shops-dev.mjs:32-35` production guard; `:84-93` `shops` inserts; `:118-136` linking
  - `scripts/seed-enhanced-products.mjs:101-116` ensure `shops`; `:118-132` product upserts; `:134-154` links
  - `scripts/seed-sample.mjs:45-58` strong production guard; `:137-148` ensure `shops`; `:177-195` links
  - `supabase/seed-dev-data.sql:49-79,96-109,111-126,128-141` SQL seeding including links

- **[pages-under-shop(s)]**
  - `app/shops/page.tsx` (client) and `app/shops/metadata.ts`
  - `app/shop/[handle]/page.tsx` (server page)
  - `app/shop/[handle]/product/[id]/page.tsx` (server page)
  - `app/shop/page.tsx` (exists; small; appears unused as route index defers to [handle])
  - Non-route files: `app/shop/enhanced-page.tsx`, `app/shop/enhanced-page-fixed.tsx`

---

## Top 3 Hypotheses (with evidence)

1) **Demo fallback causes “fake shops flash”**
   - Evidence: `app/shops/page.tsx` initializes state with `mockShops` and only replaces on successful, non-empty fetch.
     - `useState<Shop[]>(mockShops)`: `app/shops/page.tsx:405`
     - On fetch: sets `mapped.length > 0 ? mapped : mockShops`: `app/shops/page.tsx:417-424`
     - Demo entries include `sarah_style`, `tech_guru_mike`, `fitness_coach_alex`, `foodie_adventures`: `:116-232`.
   - Outcome: On slow/failed `/api/shops/directory` or when API returns empty, the page renders mock cards briefly or permanently.

2) **E2E global setup seeds and reshapes live dev data**
   - Evidence: Playwright global setup hard-deletes from production tables and inserts test products with description "Seeded by global-setup", creates "Style Forward" shop, and links products.
     - Deletes: `tests/setup/global-setup.ts:86-108`
     - Inserts: `tests/setup/global-setup.ts:178-227`
     - Shop upsert: `tests/setup/global-setup.ts:231-247`
     - Product links: `tests/setup/global-setup.ts:249-263`
   - Outcome: Running E2E setup in dev contaminates the `products` and `shops` tables with test rows; when tests clean up or fail mid-run, real data may “disappear” or appear inconsistent.

3) **Visibility filters + missing links yield empty pages**
   - Evidence: The Shop API returns only `influencer_shop_products.published = true` and filters out stockless/zero-stock items.
     - Published constraint: `app/api/shop/[handle]/route.ts:95-98`
     - In-stock filter: `app/api/shop/[handle]/route.ts:118-156`
     - Product detail requires an `influencer_shop_products` link or returns `notFound()`: `app/shop/[handle]/product/[id]/page.tsx:342-344`.
   - Outcome: If a shop has `shops` row but no corresponding `influencer_shop_products` links (e.g., links created by seeds are removed), `/shop/[handle]` can render nothing or 404 while `/shops` still shows demo fallback.

(Non-cause cross-check) **Schema name mismatch**
- The code consistently uses `shops` and `influencer_shop_products`. There are no code references to a table named `influencer_shops`. This matches your DB observation that only `shops` exists.

---

## Assumptions and Ambiguities

- Assumption: E2E `global-setup` may be running against the same Supabase project used for local dev, not an isolated test database. If not, the contamination risk is lower, but the code path remains capable of altering shared data.
- Ambiguity: We did not open `tests/e2e/global-teardown.ts`. If teardown truncates or deletes seeded data, a partial run could leave the app with empty datasets until re-seeded.
- The presence of `app/shop/enhanced-page*.tsx` suggests alternate experiments but they are not routed; they do not affect current behavior.

---

## Minimal, Safe Fixes to Plan (next phase; not applied yet)

- **(a) Stop accidental seeding:**
  - Ensure Playwright `global-setup` uses a dedicated test Supabase project or is disabled for local non-test runs.
  - Add a runtime guard in `tests/setup/global-setup.ts` to abort unless `NODE_ENV === 'test'` and an explicit `ALLOW_TEST_SEEDING=true`.

- **(b) Remove demo fallbacks:**
  - In `app/shops/page.tsx`, default `shops` to `[]` and render a proper loading skeleton; only show real data when present. Remove `mockShops` and associated badges.
  - Remove stray demo references in `ProductDetail*Client.tsx` and `app/order/success/page.tsx`.

- **(c) Compatibility view (non-destructive):**
  - If any code paths expect `influencer_shops`, create a DB view `influencer_shops AS SELECT * FROM shops` to satisfy legacy queries. Current code doesn’t require it, but it’s a safe forward-compat step.

- **(d) Verify RLS and filters:**
  - Confirm policies allow public reads as intended. Ensure at least one published `influencer_shop_products` link per active shop so `/shop/[handle]` returns products.

---

## Conclusion

- The “fake flash” stems from intentional demo fallback in `app/shops/page.tsx` rendering `mockShops` before/without real data.
- Disappearing products correlate with the E2E `global-setup` seeding/deleting and with strict published/stock filters in public APIs.
- Next step: implement the minimal, safe fixes listed above, starting with removing demo fallbacks and guarding test seeding.
