# Dashboard Build - Handover Notes

Last updated: 2025-10-02

## Scope
- Supplier dashboard backend/API and UI status
- Influencer dashboard UI status and gaps
- Existing commissions/orders plumbing to avoid duplication
- What’s left to build (supplier + influencer), with concrete next steps

---

## Highlights since last handover

- **[standardized image uploads]** Canonical helper `lib/storage/upload.ts` now handles product image uploads end-to-end:
  - Exports `ALLOWED_MIME_TYPES` and `MAX_FILE_SIZE_BYTES` (5MB) for centralized client validation.
  - Client-side conversion to WebP with safe fallback; always uploads a Blob and sets correct `contentType` and file extension.
  - Path convention: `products/{productId}/{slug}-{uuid}.<ext>`; `upsert: false`, long cache TTL.
  - Returns `{ key, url }` via `getPublicUrl()` (compatible with current public bucket setup).
- **[refactor edit page]** `app/dashboard/supplier/products/[id]/EditProductClient.tsx` uses the canonical helper; removed inline storage logic and duplicated limits. UI hint adjusted to JPG/PNG/WebP up to 5MB.
- **[legacy helper]** `lib/storage.ts:uploadProductImage()` targeting `product-images` bucket is marked `@deprecated` to avoid future duplication.
- **[lint/type fixes]** Resolved ESLint issues in `components/shop/product-image-gallery.tsx` and TS comment linting in upload helper via feature detection (no ts-ignore).

Notes:
- If the bucket is made private later, switch the helper to `createSignedUrl` for reads.
- RLS policies should tie `products/{productId}/…` to the owning supplier (see Nice-to-haves).

## Supplier Dashboard

### Implemented
- API endpoint: `app/api/dashboard/supplier/route.ts`
  - AuthZ: requires `supplier` role
  - Data sources:
    - `products` scoped by `supplier_id`
    - `commissions` joined to `orders` for supplier-scoped revenue/sales
  - Metrics returned (`SupplierDashboardData`):
    - `stats`: totalProducts, totalRevenue, totalSales, activeOrders, commissionEarned, influencerPartners
    - `todayStats`, `thisMonthStats`
    - `topProducts` (fallback aggregation from commissions)
    - `recentOrders`
  - Recent fixes:
    - Added `product_id` in commissions select for product-level grouping
    - Corrected `created_at` handling (no default to now; invalid timestamps ignored for time aggregates)
    - Implemented fallback `topProducts` by grouping commissions by product and title
- UI page: `app/dashboard/supplier/page.tsx`
  - Renders KPIs, Today’s Performance, Top Products, Recent Orders
  - Consumes `/api/dashboard/supplier`
- Commissions page route present (per tests):
  - `tests/e2e/dashboard/supplier-dashboard.spec.ts` expects `/dashboard/supplier/commissions` to load
- Orders/Analytics routes currently unimplemented (404 by design in tests)

### Related Backend (used by supplier dashboard)
- Commissions API: `app/api/commissions/route.ts`
  - List with filters; role-aware (admin, influencer, supplier)
  - Create commission (admin-only path)
- Orders API: `app/api/orders/[id]/route.ts`
  - Fetch single order (role-aware), update status (admin)
- Stripe Webhook: `app/api/webhooks/stripe/route.ts`
  - Creates `orders` and inserts supplier commissions per order item

### Database & RLS (Supabase)
- Tables present: `products`, `orders`, `commissions`, etc.
- RLS enabled on all; supplier scoping via `products.supplier_id`; commissions/ orders have appropriate policies.
- See `supabase/migrations/20250102_initial_schema.sql` and `supabase/setup-auth-compatible.sql`.
- Notes doc: `docs/wonlink-supplier-rls-policies-sql.sql` explains RLS rationale.

### Gaps / Next Steps (Supplier)
1) Orders index page
- Route: `app/dashboard/supplier/orders/page.tsx`
- Data: start with `/api/commissions` grouped by order, or create `/api/orders?supplierId=...` list if needed
- Columns: order id, date, total, status, items count, commission earned

2) Commissions page (if missing UI)
- Route: `app/dashboard/supplier/commissions/page.tsx`
- Data: `GET /api/commissions?status=&limit=&offset=` (supplier-scoped)

3) Analytics page
- Route: `app/dashboard/supplier/analytics/page.tsx`
- Start by visualizing aggregates already provided by `/api/dashboard/supplier`
- Optional backend: create `/api/dashboard/supplier/analytics` for timeseries

4) Recent Orders details
- Link to `/api/orders/[id]` backed details page `app/dashboard/supplier/orders/[id]/page.tsx`

5) Tests
- Update or add Playwright specs for orders index and analytics once pages exist

---

## Influencer Dashboard

### Implemented
- UI route shells:
  - `app/dashboard/influencer/page.tsx` (static UI placeholders)
  - `app/dashboard/influencer/shop/page.tsx`
- E2E access test: `tests/e2e/dashboard/influencer-dashboard.spec.ts`

### Not Implemented (Backend)
- No `app/api/dashboard/influencer` endpoint yet
- No influencer commissions summary endpoint

### Next Steps (Influencer)
1) Backend endpoint
- Route: `app/api/dashboard/influencer/route.ts`
- Auth: `influencer` role
- Data: commissions where `influencer_id = user.id`, shop performance, timeseries (optional)

2) UI pages
- `app/dashboard/influencer/analytics/page.tsx` (charts/timeseries)
- Commissions list for influencers (reuse `/api/commissions` with role filter)

3) Tests
- Expand Playwright tests to verify KPIs and charts

---

## Existing Commission System (Avoid Duplicates)
- Table `commissions` exists with RLS and indexes
- Write-path: Stripe webhook logs supplier and optional influencer commission per order item
- Read-paths:
  - `/api/commissions` supports list, filters, role-based access
  - `/api/dashboard/supplier` aggregates supplier view via commissions + orders join
- Recommendation: build UI on top of existing routes first; only add new endpoints when additional aggregations are required

---

## Risks & Considerations
- RLS: keep supplier/influencer scoping through `commissions` and `products.supplier_id`
- Time calculations: ensure invalid `created_at` values are excluded from time windows
- Performance: commission joins limited to recent N rows; consider pagination/cursors for larger datasets

Additional (uploads):
- **Content-type/extension correctness** is now guaranteed; mismatches are avoided even if conversion fails.
- **Upserts disabled** (`upsert: false`) to prevent accidental overwrites under the same key.

---

## Actionable Backlog
- Supplier Orders page (index) consuming commissions aggregation
- Supplier Analytics page using supplier dashboard aggregates (and optional timeseries API)
- Influencer dashboard API endpoint and analytics UI
- Add end-to-end tests for new pages

### Uploads-specific next steps (recommended)
- **[New Product flow]** Implement `POST /api/products` to create a draft and return `{ id }`, then upload images via the helper using `productId`. This keeps RLS clean and avoids temp moves.
- **[Persist ordering/deletes]** Wire reorder/delete UI on the edit page to persist the `images` array via existing `PUT /api/products/[id]`.
- **[RLS policy migration/doc]** Add a migration or documentation snippet to enforce: only suppliers owning a product can `INSERT` into `storage.objects` paths under `products/{productId}/…`.
- **[Signed URLs option]** If bucket is private, switch display reads to signed URLs with reasonable TTL.

### Nice-to-haves
- **Dropzone UX**: Use a dropzone (e.g., shadcn + react-dropzone) with progress and multiple file selection.
- **Client-side resize constraints**: Optional downscale for very large images (already supported via WebP conversion path).
- **Image moderation or EXIF strip**: Consider server-side post-processing if needed for compliance.
- **Observability**: Log storage errors server-side; add Sentry breadcrumbs for client upload failures.
- **CDN tweaks**: Ensure `next.config.mjs` image patterns cover Supabase hosts in all envs; consider AVIF in addition to WebP (already configured).

### How to test uploads (manual)
- **Allowed types/size**: Try 4–5MB JPG/PNG → should upload and convert to WebP; larger files are rejected client-side.
- **Edit page flow**: Upload one or more images on `app/dashboard/supplier/products/[id]/EditProductClient.tsx`; thumbnails should render, and saving should persist `images`.
- **RLS (when added)**: Attempt to upload to a product the user does not own → should be blocked by RLS.
