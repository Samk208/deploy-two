## Project handover: routes, image rendering, and influencer shops

This note summarizes the relevant architecture, the fixes applied, and the operational steps to verify/extend the work. It is intended for future contributors or LLMs continuing the task.

### High-level architecture

- **Database (Supabase)**
  - `public.products`: global product catalog owned by suppliers. Important fields used by the app: `id, title, description, price, images text[], category, region text[], in_stock, stock_count, active, supplier_id`. New optional fields added: `image_alt_text text[], image_metadata jsonb, seo_title text, seo_description text`.
  - `public.shops`: influencer storefronts keyed by `handle`, linked to `influencer_id` (auth user id).
  - `public.influencer_shop_products`: junction linking influencers to curated `products` with optional `custom_title` and `sale_price` and `published` flag. Unique `(influencer_id, product_id)`.
  - RLS: products are publicly readable if `active=true`; writes restricted to suppliers/admins. Influencer shop products are publicly readable if `published=true`.

- **API (Next.js App Router)**
  - `app/api/shop/[handle]/route.ts`: resolves `shops` by `handle`, fetches `influencer_shop_products -> products`, filters to in-stock items, and formats response for the shop page.
  - `app/api/products/route.ts`: generic product listing with filters and pagination; uses `active` and stock filters.
  - `app/api/products/template/route.ts`: serves the canonical CSV template used for imports.
  - `app/api/products/import/route.ts`: validates and imports products from CSV (supports `dryRun` and detailed row errors; role-gated to supplier/admin).
  - `app/api/products/export/route.ts`: exports filtered products to CSV; region filtering now uses array overlap (ANY-of) semantics.

- **Frontend**
  - Shop pages in `app/shop/[handle]/` and general enhanced page in `app/shop/enhanced-page-fixed.tsx`.
  - Cards and UI in `components/shop/` (notably `enhanced-product-card.tsx`).
  - Image component wrapper in `components/ui/product-image.tsx`.

### Recent changes (safe and additive)

1. Schema/index enhancements

- File: `supabase/migrations/20250919_product_image_perf.sql`
  - Added optional columns: `image_alt_text`, `image_metadata`, `seo_title`, `seo_description` to `public.products`.
  - Indexes: `idx_products_active_stock`, `idx_products_supplier_active`, `idx_influencer_shop_products_lookup` to optimize list and shop endpoints.
  - Backfilled `image_alt_text` and `image_metadata` where missing.

2. Types regenerated

- File: `lib/supabase/database.types.ts` updated to include the new optional fields. CI type drift resolved.

3. Frontend image rendering reliability

- File: `components/shop/enhanced-product-card.tsx` updated to normalize/clean image URLs and use robust fallback handling (prevents broken/black tiles in grid). No prop changes.
- File: `next.config.mjs` expanded `images.remotePatterns` to include Unsplash and local Supabase storage hosts for both http/https during dev.

4. Non-disruptive refetch behavior

- File: `app/shop/enhanced-page-fixed.tsx`
  - Extracted product fetch into `fetchProducts` (memoized with `useCallback`).
  - Replaced `window.location.reload()` with a local `refetch()` calling `fetchProducts()` to avoid full page refresh and preserve state.

5. Dev seeding improvements

- File: `scripts/seed-influencer-shops-dev.mjs`
  - Password handling secured: if `SAMPLE_PASSWORD` is unset, generate a random strong password using `crypto.randomBytes` (no hardcoded fallback).
  - Ensures influencer users/shops exist and links curated products idempotently.
- `package.json`: added `cross-env@^7.0.3` to support the `seed:influencer-shops:allow` script.

6. CSV import/export integration

- Files: `app/dashboard/supplier/products/components/ImportProductsDialog.tsx`, `ExportProductsDrawer.tsx`
  - Import dialog no longer simulates upload. It parses CSV in-browser with `papaparse`, validates headers, previews rows, then calls the real API `/api/products/import`.
  - Dry-run is default and maps server-side row errors back into the preview table before any writes.
  - Export drawer now downloads from `/api/products/export` and passes UI filters as query params.
- File: `app/api/products/template/route.ts`
  - Template now matches importer expectations exactly:
    `sku,title,description,image_urls,base_price,commission_pct,regions,inventory,active`.
- File: `app/api/products/export/route.ts`
  - Region filter changed from ALL-of (`contains`) to ANY-of using Postgres array `overlaps` for a more intuitive UX.
- File: `package.json`
  - `papaparse` moved to `dependencies` because it is used by production code. `@types/papaparse` remains a dev dependency.
- Repo hygiene: ensured `tsconfig.tsbuildinfo` is ignored and untracked.

### Influencer shop behavior

- Influencer shops do not own products. They curate from the global `products` catalog via `influencer_shop_products`. Inventory and core product content remain single-source in `products`.
- The shop API returns only published links and hides out-of-stock items.

### Verification steps

1. Database

- Run in Supabase SQL Editor to confirm new columns and indexes exist:
  - Column audit:
    ```sql
    select column_name, data_type
    from information_schema.columns
    where table_schema = 'public' and table_name = 'products'
    order by ordinal_position;
    ```
  - Index audit:
    ```sql
    select indexname, indexdef from pg_indexes where tablename = 'products';
    select indexname, indexdef from pg_indexes where tablename = 'influencer_shop_products';
    ```

2. Influencer shops data presence

- Verify shop exists and linked products count for a handle:
  ```sql
  select s.handle, count(*) filter (where isp.published) as published
  from shops s
  left join influencer_shop_products isp on isp.influencer_id = s.influencer_id
  where s.handle = 'influencer-alex'
  group by s.handle;
  ```

3. API and pages

- `/api/shop/[handle]` returns `{ ok: true, data: { products: [...] } }` with non-empty array.
- `/shop/[handle]` renders images in grid and list; modals also display images.

4. CSV import/export

- Download template:
  ```bash
  curl -sS -o product-import-template.csv -L "http://localhost:3000/api/products/template"
  ```
- Run a dry-run import from the UI (recommended), or via API:
  ```bash
  curl -sS -X POST "http://localhost:3000/api/products/import" \
    -H "Content-Type: application/json" \
    -d @- <<'JSON'
  {"dryRun":true,"data":["$(cat product-import-template.csv | tr -d '\r' | sed -n '1,2p' | paste -sd '\n' -)"]}
  JSON
  ```
- Export with filters (region ANY-of):
  ```bash
  curl -sS -L "http://localhost:3000/api/products/export?category=Clothing&regions=Global,KR" -o products.csv
  ```

### Common operations

- Link products from main shop to an influencer (idempotent): see the provided SQL in prior messages; uses `influencer_shop_products` with `on conflict do nothing`.
- Set custom title/price:
  ```sql
  update influencer_shop_products
  set custom_title = 'New Title', sale_price = 199.99
  where influencer_id = '<influencer-uuid>' and product_id = '<product-uuid>';
  ```

### Known constraints and notes

- `profiles.id`, `shops.influencer_id`, and `products.supplier_id` all reference `auth.users(id)`. Ensure users exist before inserting related rows.
- RLS requires inserts/updates to be executed as appropriate roles (supplier/admin for products, influencer/admin for shop links), or via service role.
- `images` are expected to be absolute URLs (e.g., Unsplash) or valid storage URLs allowed by `images.remotePatterns`. Relative paths are normalized/fallbacked in the card component.
- CSV import requirements:
  - Headers must match exactly: `sku,title,description,image_urls,base_price,commission_pct,regions,inventory,active`.
  - `image_urls` are pipe-separated; `regions` are comma-separated.
  - Use Dry Run first; the importer returns per-row errors without persisting.
- Export region filter uses ANY-of logic via Postgres array overlap. Passing `regions=Global,KR` returns products available in either Global or KR.

### Next steps / nice-to-haves

- Consider deriving `primary_image` as a generated column for faster first-image reads if needed.
- Add unit/UI tests for image fallback behavior and for `/api/shop/[handle]` success/error cases.
- Add admin UI to curate influencer products directly from catalog with preview of sale price/stock.

### Commands

- Install deps: `pnpm install`
- Dev server: `pnpm dev`
- Typecheck: `pnpm typecheck`
- Seed (dev-only):
  - `pnpm run seed:influencer-shops`
  - or `pnpm run seed:influencer-shops:allow` (uses `cross-env` to allow in CI/dev)
- Ignore/untrack TS cache if needed:
  - Add `tsconfig.tsbuildinfo` to `.gitignore` (already present in repo).
  - Untrack locally cached file: `git rm --cached tsconfig.tsbuildinfo`

---

Owner: Hand-off generated for vo-onelink-google. All edits are additive and backward-compatible.
