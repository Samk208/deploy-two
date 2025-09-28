I'll scan the routing and data-fetching code for main vs influencer shops, product scoping queries, and any image source overrides. I’ll open the relevant pages and API route, and search for product queries and image handling, all in parallel.

[8 tools called]

I opened the main shop page, influencer shop page, the influencer shop API route, and the shops directory page to compare routing, queries, image sourcing, and divergences.

### 1) Distinguishing main shop vs influencer shop, with routes
- Main shop route entry:
```1:5:app/shop/page.tsx
import EnhancedShopPage from './enhanced-page-fixed'

export default function ShopPage() {
  return <EnhancedShopPage />
}
```

- Influencer shop dynamic route (server component + notFound guard + API fetch):
```11:21:app/shop/[handle]/page.tsx
// Fetch influencer shop data from our API route
async function fetchShopData(handle: string) {
  // Build an absolute endpoint for server-side fetch
  // Priority: explicit service URL env -> derive from incoming request headers -> fallback localhost
  let base = process.env.SHOP_SERVICE_URL || process.env.BASE_URL || ""

  if (!base) {
    const h = await headers()
    const host = h.get("x-forwarded-host") || h.get("host")
    const proto = h.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http")
    if (host) base = `${proto}://${host}`
  }
```
```30:36:app/shop/[handle]/page.tsx
  const endpoint = new URL(`/api/shop/${handle}`, base).toString()

  let res: Response
  try {
    res = await fetch(endpoint, {
      cache: 'no-store',
    })
```
```43:46:app/shop/[handle]/page.tsx
  if (!res.ok) return null
  const json = await res.json()
  if (!json?.ok || !json?.data) return null
```
```134:139:app/shop/[handle]/page.tsx
export default async function InfluencerShopPage({ params }: PageProps) {
  const { handle } = await params
  
  const data = await fetchShopData(handle)
  if (!data) return notFound()
```

- Shops directory linking to influencer routes:
```309:314:app/shops/page.tsx
            <h3 className="font-semibold text-gray-900 truncate">
              <Link
                href={`/shop/${shop.handle}`}
                className="hover:text-indigo-600"
              >
                {shop.name}
```
```366:369:app/shops/page.tsx
            <Link href={`/shop/${shop.handle}`}>
              Visit Shop
              <ExternalLink className="h-3 w-3 ml-1" />
            </Link>
```

### 2) How products are filtered/scoped per shop
- Main shop: direct client query of all products (no shop scoping)
```126:133:app/shop/enhanced-page-fixed.tsx
      const { supabase } = await import("@/lib/supabase/client");

      // Fetch ALL products to see what's in database
      const { data, error, count } = await supabase
        .from("products")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });
```

- Influencer shop API: scoped via join table `influencer_shop_products` filtered by influencer_id and published=true, then selecting `products(...)`
```76:98:app/api/shop/[handle]/route.ts
    const { data: shopProducts, error: shopError } = await supabase
      .from('influencer_shop_products')
      .select(`
        id,
        custom_title,
        sale_price,
        products (
          id,
          title,
          description,
          price,
          images,
          category,
          region,
          stock_count,
          in_stock
        )
      `)
      .eq('influencer_id', shop.influencer_id)
      .eq('published', true)
      .order('created_at', { ascending: true })
```

### 3) Source of truth for images
- Main shop: first prefers a hardcoded title → images mapping; otherwise uses `product.images` from DB; otherwise a default placeholder.
```31:40:app/shop/enhanced-page-fixed.tsx
// Define product images based on title
const productImages: { [key: string]: string[] } = {
  "Wireless Gaming Headset": [
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500",
    "https://images.unsplash.com/photo-1545127398-14699f92334b?w=500",
  ],
  // ... more code ...
```
```156:163:app/shop/enhanced-page-fixed.tsx
  const transformProduct = (product: any) => {
    // Get images from our mapping or use defaults
    const images = productImages[product.title] ||
      product.images || [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
      ];
```
```179:181:app/shop/enhanced-page-fixed.tsx
      originalPrice: product.original_price ?? product.originalPrice,
      images: images,
      category: product.category || "General",
```

- Influencer shop API: takes `products.images[0]` from DB or uses a placeholder. Client uses a single `image` string.
```149:152:app/api/shop/[handle]/route.ts
          image: Array.isArray(product?.images) && product.images.length > 0
            ? product.images[0]
            : '/placeholder-product.png',
```
```76:82:app/shop/[handle]/page.tsx
  const products = (json.data.products ?? []).map((p: ApiProduct) => ({
    id: String(p.id),
    title: p.customTitle || p.title || 'Untitled',
    price: Number(p.price ?? 0),
    originalPrice: typeof p.originalPrice === 'number' ? p.originalPrice : undefined,
    image: p.image || '/placeholder-product.png',
```

Conclusion: images are sourced from DB (`products.images[]`) for influencer shops, but are potentially overridden by a hardcoded `productImages` map in the main shop. Not consistent.

### 4) Divergences between main vs influencer logic
- Fetch method:
  - Main: client-side Supabase query to `products` with no scoping.
  - Influencer: server-side HTTP fetch to internal API, which does scoped DB joins.
- Image shape and source:
  - Main: `images: string[]` with title-based override.
  - Influencer: `image: string` derived from DB `images[0]` or placeholder.
- Guards:
  - Main: client shows error/empty UI states.
  - Influencer: server returns `notFound()` when HTTP fetch or shape check fails.
- Routing:
  - Main at `/shop`.
  - Influencer at `/shop/[handle]`.

### Data flow diagram (text)
- Main shop
  - Route: `/shop` → `app/shop/page.tsx` → `EnhancedShopPage`
  - Data fetch: Supabase client → `.from("products").select("*")` (no scoping)
  - Transform: `productImages[title] || product.images || placeholder` → produce `images: string[]`
  - Render: grid/list via `EnhancedProductCard`
- Influencer shop
  - Route: `/shop/[handle]` → server component
  - Data fetch: server-side HTTP fetch to `/api/shop/[handle]`
  - API DB query: `shops` by handle → `influencer_shop_products` join products (scoped, published) → map `image = products.images[0] || placeholder`
  - Render: `InfluencerShopClient` using `product.image`

### Consistent scoping per shop?
- No. Evidence:
  - Main shop fetches all products with no shop/influencer filter:
```126:133:app/shop/enhanced-page-fixed.tsx
      const { data, error, count } = await supabase
        .from("products")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });
```
  - Influencer shop is explicitly scoped via `influencer_shop_products` with `eq('influencer_id', ...)` and `eq('published', true)`:
```95:98:app/api/shop/[handle]/route.ts
      .eq('influencer_id', shop.influencer_id)
      .eq('published', true)
```

- Additionally, image sourcing is inconsistent:
  - Main: may override with `productImages[title]` instead of DB images.
  - Influencer: uses DB `images[0]` or placeholder.

Summary
- Main vs influencer shops are split by routes: `/shop` vs `/shop/[handle]`.
- Main shop pulls all products (no scoping) and may override images via a hardcoded map; influencer shop uses a scoped join and DB images.
- Because of different fetchers, guards, and transforms, behavior diverges: No, products are not consistently scoped per shop, and image sources differ between routes.