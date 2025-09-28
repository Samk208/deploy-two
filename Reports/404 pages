I'll locate and cite the exact code in the server page and API route, plus the Supabase helpers that enable direct DB calls, to produce the required report.

[5 tools called]

Status: I’ve opened the exact files and verified the flow and failure behavior. Below is a concise, read-only report with code citations.

- Server component for /shop/[handle] (absolute URL build, fetch to API, notFound)
```11:31:app/shop/[handle]/page.tsx
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

  if (!base) {
    // Last-resort fallback for local dev so server fetch never uses a relative URL
    const port = process.env.PORT || "3000"
    base = `http://localhost:${port}`
  }

  const endpoint = new URL(`/api/shop/${handle}`, base).toString()
```
```32:41:app/shop/[handle]/page.tsx
  let res: Response
  try {
    res = await fetch(endpoint, {
      cache: 'no-store',
    })
  } catch (err) {
    // Surface server-side fetch failures clearly during SSR
    console.error(`Failed to fetch shop data for handle="${handle}" from ${endpoint}:`, err)
    throw err
  }
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

- API route it calls and expected response shape
```40:58:app/api/shop/[handle]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params
  try {
    const supabase = ensureTypedClient(await createServerSupabaseClient())

    // Resolve shop by handle to get influencer_id
    const { data: shop, error: shopLookupError } = await supabase
      .from('shops')
      .select('id, influencer_id, handle, name, description, logo')
      .eq('handle', handle)
      .maybeSingle()

    if (shopLookupError || !shop) {
      return NextResponse.json(
        { ok: false, error: "Influencer shop not found" },
        { status: 404 }
      )
    }
```
```76:105:app/api/shop/[handle]/route.ts
// Get influencer's published shop products
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

if (shopError) {
  console.error('Shop products fetch error:', shopError)
  return NextResponse.json(
    { ok: false, error: "Failed to fetch shop products" },
    { status: 500 }
  )
}
```
```118:160:app/api/shop/[handle]/route.ts
// Format products (hide out-of-stock, show low-stock badges)
const formattedProducts = shopProducts
  ?.filter((item: any) => item.products?.in_stock && item.products?.stock_count > 0)
  .map((item: any) => {
    const product = item.products
    // ...
    return {
      id: product?.id,
      title: product?.title ?? 'Untitled',
      customTitle: item.custom_title,
      price: item.sale_price ?? product?.price ?? 0,
      originalPrice: /* ... */,
      image: Array.isArray(product?.images) && product.images.length > 0
        ? product.images[0]
        : '/placeholder-product.png',
      category: product?.category ?? 'Unknown',
      region: product?.region ?? [],
      inStock: !!product?.in_stock,
      stockCount: product?.stock_count ?? 0,
      rating: 4.5,
      reviews: 0,
      badges
    }
  }) || []
```

- Direct DB helper exists
```1:13:lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import type { Database } from './database.types'
import type { NextRequest } from 'next/server'
// ...
export function createServerSupabaseClient(request?: NextRequest) {
  // If we have a request, use its cookies
  if (request) {
    return createServerClient<Database>(supabaseUrl, supabaseAnonKey, { cookies: { getAll() { /*...*/ } } })
  }
  // Fallback when no request context is available
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, { cookies: { getAll() { return [] } } })
}
```
```21:24:lib/supabase/types.ts
export function ensureTypedClient(client: any): TypedSupabaseClient {
  return client as TypedSupabaseClient
}
```
- The API route itself already uses `createServerSupabaseClient`:
```46:53:app/api/shop/[handle]/route.ts
const supabase = ensureTypedClient(await createServerSupabaseClient())
// Resolve shop by handle...
```

Plain-language timeline
- Server component `app/shop/[handle]/page.tsx` builds an absolute `base` URL, then constructs `endpoint = base + /api/shop/[handle]`, then performs an HTTP fetch to that endpoint.
- If the HTTP fetch throws, it logs and rethrows; if the response is not ok or the JSON doesn’t contain `{ ok: true, data }`, it returns `null`.
- Immediately after calling `fetchShopData`, if the result is falsy, the component calls `notFound()` which renders the 404 page.
- Therefore any network error, misconstructed base URL, API 404/500, or unexpected body shape will yield a 404 page, even if the route exists and the handle is valid.

Is this the cause of false 404s?
- Yes. The server component intentionally converts failures of the internal HTTP request into `notFound()`. Evidence:
  - Absolute URL build and HTTP fetch: lines 11–41, 30–36.
  - Null on non-ok or missing data: lines 43–46.
  - `notFound()` on null: lines 134–139.
  - The API can return 404 for “shop not found” or 500 on query error; any of these result in the page’s 404 regardless of whether the route is reachable. If the absolute URL build fails in certain environments, the fetch throws and the page 404s as well.

Summary of deliverables
- a) Server component and its fetch:
  - `app/shop/[handle]/page.tsx`: 11–31 (baseUrl), 32–41 (fetch), 43–46 (shape check), 134–139 (notFound).
- b) API route it calls:
  - `app/api/shop/[handle]/route.ts`: 40–58 (handler), 76–105 (DB fetch + 500), 118–160 (shape).
- c) notFound invocation:
  - `app/shop/[handle]/page.tsx`: 134–139.

Conclusion
- Proof says Yes: the pattern “server component → HTTP fetch to itself → treat failure as notFound()” directly explains false 404s when the API returns non-200 or when the absolute URL computation/fetch fails. A direct DB call from the server component via `createServerSupabaseClient` would avoid the internal network hop and this class of 404s.