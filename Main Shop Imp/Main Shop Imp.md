# Main Shop – Handover Notes

Date: 2025-10-07
Owner: Web App Team

## Scope

This document summarizes the current implementation of the public Main Shop at `/shop`, how it integrates with our feed API and PDP (product detail page), how it relates to Influencer Shops, and key testing, SEO, and operations notes.

---

## Architecture Overview

- **Server page**: `app/shop/page.tsx`
  - Reads URL `searchParams` and performs an SSR fetch to `/api/main-shop/feed`.
  - Passes a typed `FeedResponse` to the client `MainShopClient`.
  - Uses a relative URL for fetching to avoid cross-origin issues in dev/tests.

- **Client page**: `app/main-shop/MainShopClient.tsx`
  - Renders a sticky `FilterBar`, a responsive product grid, and a `PaginationBar`.
  - Uses a simple inline card layout for now to avoid component name collision.

- **Feed API**: `app/api/main-shop/feed/route.ts`
  - Accepts query params for filtering, sorting, and pagination (see below).
  - Queries `products` table via Supabase Admin client and returns `{ items, page, limit, total, hasMore }`.

- **Types & Helpers**:
  - `types/catalog.ts`: `SortKey`, `MainShopProduct`, `FeedResponse`.
  - `lib/catalog.ts`: `SORT_OPTIONS` and `buildQuery()` helper.

- **Shared UI**:
  - `components/shop/FilterBar.tsx`: search + filters + debounced updates; sticky container applied in client page.
  - `components/shop/PaginationBar.tsx`: URL-driven pagination.

- **PDP (Product Detail Page)**: `app/product/[id]/page.tsx`
  - Fetches product server-side and renders details.
  - `generateMetadata()` injects OG/Twitter meta and JSON-LD Product schema with safe fallbacks.

---

## Data Flow

1. **Request**: User hits `/shop?{q, sort, category, brand, minPrice, maxPrice, inStockOnly, page, limit}`.
2. **SSR Fetch** (`app/shop/page.tsx`):
   - Converts `searchParams` to `URLSearchParams`.
   - Fetches `GET /api/main-shop/feed` with the query string (relative URL).
   - Expects `{ ok: true, data: FeedResponse }` and passes `data` into client.
3. **Client Render** (`MainShopClient.tsx`):
   - Displays `FilterBar`, product grid, `PaginationBar`.
   - `FilterBar` updates the URL (push) on apply/clear; debounce for search.
   - `PaginationBar` increments/decrements `page` in URL.
4. **API** (`/api/main-shop/feed`):
   - Builds a base filtered query; applies sort; paginates with `range()` and count.
   - Returns normalized `items` and pagination metadata.

---

## API Contract – `/api/main-shop/feed`

- **Method**: GET
- **Query params**:
  - `page`: number, default 1
  - `limit`: number, default 24, max 48
  - `q`: string (ILIKE `title`)
  - `sort`: `new | price-asc | price-desc`
  - `category`: string
  - `brand`: string (URL is supported by FilterBar; mapping in API optional, see notes)
  - `minPrice`: number
  - `maxPrice`: number
  - `inStockOnly`: `true | false` (default true)
- **Response**: `{ ok: true, data: FeedResponse }` where `FeedResponse = { items, page, limit, total, hasMore }`.
- **Item fields** (`MainShopProduct`):
  - `id, title, price, primary_image, active, in_stock, stock_count, category, brand?, created_at`

Notes:

- Current API selects `category` but not `brand` by default. If brand display is required, add it to the `.select()` and map.

---

## Filters, Sorting, Pagination

- **Filters** implemented in API (and wired in UI):
  - Text query `q` (ILIKE on `title`).
  - `category` equality.
  - `minPrice`, `maxPrice` numeric bounds.
  - `inStockOnly` controls `in_stock` requirement; base query always enforces `active=true` and `stock_count>0`.
- **Sorting**: `new` (by `created_at` desc), `price-asc`, `price-desc`.
- **Pagination**: `page`, `limit`, returns `total` and `hasMore` for client controls.

---

## UI/UX Details

- **Sticky Filter Bar**: Applied in `MainShopClient.tsx` around `FilterBar` with `sticky top-16 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b`.
- **Inputs**: Debounced search (300ms), explicit Apply/Clear for other filters; maintains URL state for shareability.
- **Cards**: Simple inline anchor cards; optional enhancement to migrate to `next/image` and a reusable `MainShopCard` component.
- **Empty State**: Minimal message when no products match.

---

## PDP – SEO & Metadata

- **File**: `app/product/[id]/page.tsx`
- **generateMetadata**:
  - Fetches product via relative `GET /api/products/[id]` to avoid cross-origin issues.
  - Sets `title`, `description`, `openGraph`, `twitter`.
  - Injects JSON-LD `Product` schema (name, image, brand?, offers with currency/price/availability/url).
  - Falls back gracefully if fetch fails.

---

## Relationship to Influencer Shops

- **Influencer Shops** serve curated product sets per influencer/handle under routes like `app/shop/[handle]` and related APIs (`/api/influencer/shop`, `/api/influencer/shop/[id]`).
- **Main Shop** is the global catalog (`/shop`) drawing from `products` with generic filters, independent of a specific influencer.
- **Shared Concerns**:
  - Both rely on the `products` table and common media fields (`primary_image`, `images`).
  - UX patterns (cards, pagination, filters) are consistent; Influencer Shops additionally bind to a given handle and may filter by influencer-specific associations.
- **Cross-linking**:
  - Product PDPs (`/product/[id]`) are shared; entries from either Main Shop or Influencer Shops link to the same PDP.
  - Consider adding referral/query tags when navigating from influencer pages for analytics and commission attribution.

---

## Testing

- **Playwright Config**: `playwright.config.ts`
  - `testDir: ./tests`, `testMatch: ["**/e2e/**/*.spec.ts", "**/smoke/**/*.spec.ts"]`.
  - `webServer`: `pnpm dev --port 3001` with `baseURL: http://127.0.0.1:3001`.

- **Smoke Tests**:
  - `tests/smoke/main-shop.spec.ts`: loads main shop and navigates to PDP or asserts empty state.
  - `tests/smoke/shop-filters.spec.ts`: search, sort, pagination, PDP navigation.

- **Common pitfalls**:
  - Use relative API fetches in SSR (`/api/...`) to avoid HTML error overlay in JSON parsing during tests.
  - If catalog is empty, smoke tests should hit empty state; seed data for PDP navigation.

---

## Configuration & Env

- **Relative fetches** in SSR are used for dev/test stability.
- **`NEXT_PUBLIC_APP_URL`** recommended for absolute OG URLs in production; not required for SSR fetch.
- **Dev warning**: Next.js may warn about dev origin; if needed, set `allowedDevOrigins` in `next.config.mjs`.

---

## Known Gaps / Improvements

- **Brand field**: Add `brand` to feed `.select()` and item mapping for display consistency.
- **Card component**: Create `components/shop/MainShopCard.tsx` and switch from inline markup; use `next/image` with responsive `sizes`.
- **Skeletons**: Add lightweight skeletons for initial SSR and subsequent filter transitions.
- **Accessibility**: Add explicit `<label>`s/`aria-label`s and enhanced focus states.
- **Currency**: Use `Intl.NumberFormat` (and potentially currency from backend) instead of hardcoded USD and `toFixed`.
- **Indexes**: Ensure DB indexes on `created_at`, `price`, `in_stock`, `stock_count`, `active`, `category`, and a suitable index for `title` search.
- **Facets**: Consider facet counts (categories/brands) to guide filtering.
- **Prefetch**: Prefetch next page data on hover/visibility for snappier pagination.
- **Analytics**: Add event tracking for filter usage and product clicks (feature-flagged).
- **Attribution**: When arriving from Influencer Shops, include referral params for attribution.

---

## Troubleshooting

- **Unexpected token '<' when parsing JSON**:
  - Ensure SSR uses relative fetch URLs (e.g., `/api/main-shop/feed?...`). Absolute URLs may trigger HTML overlays in dev.
- **No products showing**:
  - Verify `active=true`, `stock_count>0`, and `in_stock` when `inStockOnly=true`.
  - Try clearing filters from `FilterBar`.
- **Playwright “No tests found”**:
  - Confirm `testMatch` includes `**/smoke/**/*.spec.ts` and run `pnpm exec playwright test --list`.
- **PDP SEO validation**:
  - View page source; check JSON-LD script and OG/Twitter meta tags. Ensure `NEXT_PUBLIC_APP_URL` in non-prod/prod if absolute URLs are required.

---

## File Index (Key Files)

- Server page: `app/shop/page.tsx`
- Client page: `app/main-shop/MainShopClient.tsx`
- Feed API: `app/api/main-shop/feed/route.ts`
- Types: `types/catalog.ts`
- Helpers: `lib/catalog.ts`
- UI: `components/shop/FilterBar.tsx`, `components/shop/PaginationBar.tsx`
- PDP: `app/product/[id]/page.tsx`
- Playwright: `playwright.config.ts`, `tests/smoke/*.spec.ts`

---

## Quick Start (Developer)

1. `pnpm i`
2. `pnpm dev` (app will run on 3000; Playwright uses 3001 automatically)
3. Navigate to `/shop` and test filters/pagination.
4. Run smoke tests: `pnpm exec playwright test tests/smoke`.

---

## Decision Log (Recent)

- Switched SSR fetches to relative URLs to fix cross-origin/overlay issues in tests.
- Introduced typed `FeedResponse` and catalog helpers for filters/sorting.
- Added PDP JSON-LD + OG/Twitter for better SEO.
- Added sticky filter bar for better UX.
