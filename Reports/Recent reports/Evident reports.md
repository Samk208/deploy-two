Evident reports

### Images: “override masking Supabase URLs”
- Verdict: Partially Confirmed
- Key evidence (file + lines)
  - Title→image override map and transform on main shop page:
```31:41:app/shop/enhanced-page-fixed.tsx
// Define product images based on title
const productImages: { [key: string]: string[] } = {
  "Wireless Gaming Headset": [
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500",
    "https://images.unsplash.com/photo-1545127398-14699f92334b?w=500",
  ],
```
```156:163:app/shop/enhanced-page-fixed.tsx
// Transform products to match ProductCard interface
const transformProduct = (product: any) => {
  // Get images from our mapping or use defaults
  const images = productImages[product.title] ||
    product.images || [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    ];
```
```173:181:app/shop/enhanced-page-fixed.tsx
return {
  id: product.id,
  title: product.title,
  ...
  images: images,
```
  - Card selects first image for render:
```77:88:components/shop/enhanced-product-card.tsx
const primaryImageSrc = useMemo(() => {
  const raw = Array.isArray(product?.images)
    ? product.images[0]
    : product?.images;
  ...
  return cleaned;
}, [product?.images]);
```
  - Influencer listing uses DB’s first image or placeholder (no title-map):
```149:152:app/api/shop/[handle]/route.ts
image: Array.isArray(product?.images) && product.images.length > 0
  ? product.images[0]
  : '/placeholder-product.png',
```
  - Influencer grid consumes `product.image` directly:
```301:310:app/shop/[handle]/InfluencerShopClient.tsx
<Image
  src={product.image}
  alt={product.title}
  width={300}
  height={200}
```
- Minimal reproduction
  - Open `http://localhost:3000/shop` and check Network entries for images; expect `images.unsplash.com` (override). Open `http://localhost:3000/shop/<handle>`; expect Supabase `/storage/v1/object/public/...` or placeholder from API.
- Blast radius
  - Main shop grid and Quick View can hide broken/missing DB images; mismatches between grid and any DB-backed detail views; can mask real storage/config issues.
- Fix readiness: Easy
  - Remove or env-gate the title-based overrides and consistently use DB `images`; unify image selection logic in one place.

### 404s: “server component self-fetch causes fake 404”
- Verdict: Partially Confirmed
- Key evidence (file + lines)
  - Server page builds absolute base and self-fetches API; treats non-OK as null:
```15:28:app/shop/[handle]/page.tsx
let base = process.env.SHOP_SERVICE_URL || process.env.BASE_URL || ""
...
if (!base) {
  const h = await headers()
  const host = h.get("x-forwarded-host") || h.get("host")
  const proto = h.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http")
  if (host) base = `${proto}://${host}`
}
...
const endpoint = new URL(`/api/shop/${handle}`, base).toString()
```
```34:45:app/shop/[handle]/page.tsx
res = await fetch(endpoint, { cache: 'no-store' })
...
if (!res.ok) return null
const json = await res.json()
if (!json?.ok || !json?.data) return null
```
  - Page invokes `notFound()` when data is null:
```137:139:app/shop/[handle]/page.tsx
const data = await fetchShopData(handle)
if (!data) return notFound()
```
  - API route exists and returns 404/500 on lookup failures:
```55:59:app/api/shop/[handle]/route.ts
if (shopLookupError || !shop) {
  return NextResponse.json({ ok: false, error: "Influencer shop not found" }, { status: 404 })
}
```
- Minimal reproduction
  - Compare `GET /api/shop/<handle>` in browser vs loading `/shop/<handle>`. If API returns 200 but page 404s, base URL/headers or fetch handling is the culprit.
- Blast radius
  - Any deploy lacking correct forwarded headers or envs could 404 influencer shops; SSR-only.
- Fix readiness: Moderate
  - Use relative fetch on the server (allowed in Next 15) or direct DB call; add robust base resolution and avoid converting non-OK into `notFound()` without differentiating transient errors.

### Checkout: “product shape mismatch (images)”
- Verdict: Confirmed
- Key evidence (file + lines)
  - Code tolerates various image shapes for Stripe lineItems:
```91:101:app/api/checkout/route.ts
const imageArray = Array.isArray(product.images)
  ? product.images
  : (typeof product.images === 'string' ? [product.images] : [])
...
images: imageArray.filter(Boolean).slice(0, 1),
```
  - But later unconditionally indexes `product.images[0]` for orderItems:
```107:115:app/api/checkout/route.ts
orderItems.push({
  productId: product.id,
  title: product.title,
  price: product.price,
  quantity: item.quantity,
  image: product.images[0] || '',  // unsafe if product.images is undefined/null
```
- Minimal reproduction
  - Ensure a product in DB has `images` null/undefined. Start checkout; `POST /api/checkout` may 500 with TypeError “Cannot read properties of undefined (reading '0')”.
- Blast radius
  - Checkout failures for any product lacking images; Stripe session not created; revenue impact.
- Fix readiness: Easy
  - Use the already-derived `imageArray[0]` or optional chaining (`product.images?.[0] ?? ''`) consistently.

### Notes on matching/visual signals (quick)
- Main shop grid likely shows Unsplash/picsum images (override). Influencer grid shows API-derived `image` (Supabase/placeholder).
- Next.js images config allows Unsplash and Supabase public bucket paths; signed URLs are not allowed by current config.

This is a final verification summary; ready to proceed with targeted fixes or gated instrumentation as needed.