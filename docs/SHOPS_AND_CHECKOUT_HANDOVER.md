## Comprehensive Handover — Main Shop, Influencer Shops, and Checkout

Updated: 2025-09-30

### Scope

- Main shop (`/shop`) powered by `app/shop/enhanced-page-fixed.tsx` using Supabase client
- Influencer shops directory (`/shops`) and individual influencer shop (`/shop/[handle]`)
- Product image handling components
- Cart and Checkout flow (`/checkout`, Stripe redirect)

---

### Current Architecture & Data Flow

- **Main Shop**
  - File: `app/shop/enhanced-page-fixed.tsx`
  - Fetches products directly from Supabase on the client via `@/lib/supabase/client` and renders with `components/shop/enhanced-product-card.tsx`.
  - Images come from `product.images` (array) or fallback to `/placeholder.jpg`.
  - Grid/List toggle and Quick View are client-side; Add to Cart writes to `useCartStore`.

- **Influencer Shops Directory**
  - File: `app/shops/page.tsx`
  - Uses mock shops but attempts `/api/shops/directory` if available. Renders cards via `components/ui/product-image.tsx` to display banners/avatars with graceful fallback.

- **Influencer Shop Page**
  - File: `app/shop/[handle]/page.tsx`
  - Server Component fetches data from `GET /api/shop/[handle]` using an absolute URL composed from env or request headers; maps to `InfluencerShopClient`.
  - API: `app/api/shop/[handle]/route.ts` joins `shops`, `profiles`, and `influencer_shop_products -> products`. Filters to in-stock items and maps first image or placeholder.
  - Client: `app/shop/[handle]/InfluencerShopClient.tsx` renders product grid with `next/image` using `product.image`.

- **Checkout**
  - Page: `app/checkout/page.tsx` dynamically loads `components/shop/checkout-page.tsx` (CSR only).
  - `CheckoutPage` posts to `/api/checkout` to create a Stripe Checkout Session and redirects to Stripe via `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

---

### Manual Observations (Playwright session)

- Main shop (`/shop`):
  - Products loaded: 3. Grid shows image thumbnails immediately; Quick View modal shows full image. No placeholder-only behavior observed.
  - Added first product to cart successfully; cart sidebar updated totals; proceeded to checkout.

- Checkout (`/checkout`):
  - Form validated and submitted; session creation returned a Stripe Checkout URL.
  - Browser redirected to `https://checkout.stripe.com/...` showing sandbox UI and card iframe. Flow reached Stripe; not completed (as intended in dev).

- Influencer shops:
  - Directory `/shops` renders from mock data if API unavailable.
  - Individual shop page exists (`app/shop/[handle]/page.tsx`) and depends on `GET /api/shop/[handle]` success. If API returns 404/500, page calls `notFound()` → 404.

---

### Image Handling Review

- Main shop product cards: `components/shop/enhanced-product-card.tsx`
  - Uses `next/image` with `fill` inside a fixed `aspect-[4/3]` container. Primary image source resolves from `product.images[0]` with normalization for `public/` or `images/` prefixes. Falls back to `/placeholder.jpg` on error.

- Influencer directory cards: `components/ui/product-image.tsx`
  - Wraps `next/image` with loading/fallback UI. Handles `onError` by swapping to `fallbackSrc` and avoids layout shift via loading shimmer.

- Influencer shop grid: `app/shop/[handle]/InfluencerShopClient.tsx`
  - Uses `next/image` with fixed width/height for grid cards, sourcing from `product.image` provided by the API.

- Remote image domains: `next.config.mjs` allows `images.unsplash.com`, `picsum.photos`, and Supabase storage host derived from `NEXT_PUBLIC_SUPABASE_URL` (both http/https in dev).

---

### Where image issues could arise

- If `product.images` contains absolute URLs outside allowed domains, Next image optimizer will 404. Main shop normalizes only relative paths; absolute URLs must match `remotePatterns`.
- For influencer shops, API maps `image` from `product.images[0]` or placeholder. If DB rows have malformed strings or quoted URLs (e.g., with extra quotes), the grid may fail until error triggers fallback.
- Gradual image appearance in list view is expected due to the loading shimmer in `ProductImage` and `transition-opacity` in cards; in grid, `fill` requires non-zero container height which is provided via `aspect-[4/3]`.

---

### Current vs. Intended Setup

- Intended data separation:
  - Main shop: global product catalog (supplier-owned) with filters and quick view.
  - Influencer shop: curated subset from `influencer_shop_products` joined to `products`, with potential sale prices and badges.
  - Checkout: cart lines optionally tagged with `shopHandle`/influencer context for commission attribution (see `docs/commission-tracking-e2e-guide.md`).

- Current implementation state:
  - Main shop fully client-driven, pulls straight from `products` and renders correctly.
  - Influencer shop server fetch relies on building an absolute URL; if environment/headers misalign, fetch may fail and produce 404 despite data existing.
  - Directory uses mock data by default; API directory endpoint optional.
  - Checkout integration reaches Stripe sandbox successfully (card entry page reached). End-to-end completion not executed.

---

### Key Files and References

```30:96:app/shop/enhanced-page-fixed.tsx
// Fetches products client-side from Supabase and renders EnhancedProductCard grid/list
```

```1:67:components/ui/product-image.tsx
// Image wrapper with fallback and loading shimmer for directory cards
```

```73:127:components/shop/enhanced-product-card.tsx
// Normalizes primaryImageSrc and uses aspect ratio container to avoid zero-height fill
```

```11:31:app/shop/[handle]/page.tsx
// Builds absolute base URL for server fetch to /api/shop/[handle]
```

```118:160:app/api/shop/[handle]/route.ts
// Formats influencer shop products, selects first image or placeholder
```

---

### Issues Catalog (no fixes applied)

- Influencer shop 404s are likely due to the server-side absolute-URL fetch failing under certain local/CI environments; the page calls `notFound()` on non-OK responses.
- If DB product image URLs are outside allowed `remotePatterns`, Next image optimizer returns 404; grid then shows fallback or blank until error fires.
- Gradual image reveal in list view is by design from loading shimmer/opacity transitions; not a broken load, but perceived delay.
- Checkout reaches Stripe; success depends on backend `/api/checkout` session creation and Stripe test keys. Flow appears wired; card entry page loads in sandbox.

---

### Suggested Follow-up Investigations (for later)

- Log the exact URL built in `app/shop/[handle]/page.tsx` and the status of `GET /api/shop/[handle]` during SSR to correlate 404s.
- Inspect sample `products.images` values to ensure domains are permitted and strings are not quoted or relative in unexpected ways.
- Add a lightweight `/api/shops/directory` implementation to replace mocks and link discovery between `/shops` and `/shop/[handle]`.
- Validate commission context propagation from influencer cart lines through `/api/checkout` to session metadata.
