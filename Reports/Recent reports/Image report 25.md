I'll scan the repo for the shop grid component, image override logic, Quick View modal image source, and Next.js Image configuration. Running broad semantic searches first, then I'll narrow to files and line numbers.

[5 tools called]

I'll look for any hardcoded product image mapping like `productImages`, the transform function, and open the influencer shop page to see which card/grid is used. Then I'll open the Quick View modal to confirm image selection.

[5 tools called]

Let me open the actual influencer shop client to confirm which grid and card are used, and then I'll scan for any image override mapping or transforms used on those products.

[1 tool called]

I'll open `app/shop/enhanced-page-fixed.tsx` around the transform to see if a `productImages` map is defined and capture exact lines. Then I'll gather the API route snippet for the image selection to include precise line numbers.

[1 tool called]

I scanned the shop pages and components to locate the grid, image overrides, and Quick View behavior. Summarizing findings with exact references.

### 1) Grid component used in the shop listing
- Influencer shop route `app/shop/[handle]/page.tsx` renders `InfluencerShopClient`, which contains the actual products grid and uses `product.image` per-card:
```301:312:app/shop/[handle]/InfluencerShopClient.tsx
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="relative">
                    <Image
                      src={product.image}
                      alt={product.title}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                    />
```
- There is a separate experimental “enhanced” listing at `app/shop/enhanced-page-fixed.tsx` that uses `EnhancedProductCard`:
```391:399:app/shop/enhanced-page-fixed.tsx
                {transformedProducts.map((product) => (
                  <EnhancedProductCard
                    key={product.id}
                    product={product}
                    size={viewMode === "list" ? "lg" : "md"}
                    showSupplier={true}
                    onQuickView={handleQuickView}
                    onAddToCart={addToCart}
                  />
```

### 2) Image overrides or transforms
- Hardcoded title→image mapping present in `app/shop/enhanced-page-fixed.tsx`:
```31:37:app/shop/enhanced-page-fixed.tsx
// Define product images based on title
const productImages: { [key: string]: string[] } = {
  "Wireless Gaming Headset": [
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500",
    "https://images.unsplash.com/photo-1545127398-14699f92334b?w=500",
  ],
// ... more code ...
```
- Transform applies mapping and overrides `product.images` for the enhanced grid:
```156:163:app/shop/enhanced-page-fixed.tsx
// Transform products to match ProductCard interface
const transformProduct = (product: any) => {
  // Get images from our mapping or use defaults
  const images = productImages[product.title] ||
    product.images || [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    ];
```
- The transformed `images` is then included in the product passed to the card:
```173:181:app/shop/enhanced-page-fixed.tsx
  return {
    id: product.id,
    title: product.title,
    description: product.description,
    price: product.price,
    // Provide both shapes to satisfy existing components
    original_price: product.original_price ?? product.originalPrice,
    originalPrice: product.original_price ?? product.originalPrice,
    images: images,
```
- The enhanced card chooses the final image using its `primaryImageSrc` derived from `product.images`:
```77:88:components/shop/enhanced-product-card.tsx
const primaryImageSrc = useMemo(() => {
  const raw = Array.isArray(product?.images)
    ? product.images[0]
    : product?.images;
  if (!raw || typeof raw !== "string") return "/placeholder.jpg";
  const cleaned = raw.trim().replace(/^"|"$/g, "");
  if (/^(public\/|images\/)/.test(cleaned)) {
    return "/" + cleaned.replace(/^public\//, "");
  }
  return cleaned;
}, [product?.images]);
```
```114:121:components/shop/enhanced-product-card.tsx
<Image
  src={
    !imageError && primaryImageSrc
      ? primaryImageSrc
      : "/placeholder.jpg"
  }
  alt={product.title}
```
- Influencer shop (actual production listing) uses `product.image` shaped server-side by the API route; not overridden by any title-map:
```149:152:app/api/shop/[handle]/route.ts
image: Array.isArray(product?.images) && product.images.length > 0
  ? product.images[0]
  : '/placeholder-product.png',
```

### 3) Quick View modal image source
- Quick View modal builds `images` from `product.images` and uses `images[selectedImage]`:
```27:33:components/shop/quick-view-modal.tsx
const images = Array.isArray(product.images) ? product.images : [product.images].filter(Boolean)
const hasDiscount = product.original_price && product.original_price > product.price
```
```49:56:components/shop/quick-view-modal.tsx
<Image
  src={images[selectedImage] || "/placeholder.jpg"}
  alt={product.title}
  fill
  sizes="(max-width: 768px) 90vw, 50vw"
  className="object-cover"
  priority
/>
```
- In the enhanced flow, the modal receives the transformed product (with overridden `images`), so it does NOT bypass the override. In the influencer shop flow, there is no Quick View modal.

### Exact paths and line numbers where overrides/transforms happen
- Title→image hardcode and usage:
  - `app/shop/enhanced-page-fixed.tsx`: 31–73 (map), 156–163 (override), 173–181 (propagation).
- Final image selection in card:
  - `components/shop/enhanced-product-card.tsx`: 77–88 (derive), 114–121 (apply).
- API shaping for influencer listing:
  - `app/api/shop/[handle]/route.ts`: 149–152 (sets `image` from DB’s first image or placeholder).
- Influencer grid consumption:
  - `app/shop/[handle]/InfluencerShopClient.tsx`: 301–312 (uses `product.image` in grid).

### Final source chosen for each product image in the grid (pseudocode)
- Enhanced grid (`app/shop/enhanced-page-fixed.tsx`):
```text
images = productImages[product.title] || product.images || [unsplashDefault]
primaryImage = first(images) after cleaning -> EnhancedProductCard <Image src=primaryImage>
```
- Influencer shop grid (`app/shop/[handle]/page.tsx` + API):
```text
serverImage = Array.isArray(dbProduct.images) && dbProduct.images[0] ? dbProduct.images[0] : '/placeholder-product.png'
client <Image src=product.image> // where product.image === serverImage
```

### Next.js Image remotePatterns/domains for Supabase Storage
- Yes. Next config dynamically allows the Supabase project host from `NEXT_PUBLIC_SUPABASE_URL`:
```15:33:next.config.mjs
images: {
  // Allow optimized remote images from common sources used in the project
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'images.unsplash.com',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: 'picsum.photos',
      pathname: '/**',
    },
    // Always allow HTTPS access to Supabase storage
    SUPABASE_HOST && {
      protocol: 'https',
      hostname: SUPABASE_HOST,
      pathname: '/storage/v1/object/public/**',
    },
```
- Also allows HTTP to the same host in dev and localhost:54321 for storage emulator (lines 34–52).

### Minimal instrumentation plan (read-only; where to add logs)
- Enhanced listing:
  - In `transformProduct`, log the chosen `images` alongside `product.title` before return.
  - In `EnhancedProductCard`, log `primaryImageSrc` once per render (guarded to dev with simple env check).
  - In `QuickViewModal`, log `images` array on open and `images[selectedImage]` on change.
- Influencer listing:
  - In `app/api/shop/[handle]/route.ts`, log the computed `image` for a few product IDs (dev only).
  - In `app/shop/[handle]/InfluencerShopClient.tsx`, log `product.id` and `product.image` during render or via an effect.

### Verification report on the override hypothesis
- Hypothesis: Grid overrides DB images via a hardcoded mapping.
- Result: Partial.
  - Yes: The enhanced grid (`app/shop/enhanced-page-fixed.tsx`) overrides `product.images` via `productImages[title]` [31–37, 156–163, 173–181].
  - No: The actual influencer shop listing (`app/shop/[handle]/InfluencerShopClient.tsx`) uses `product.image` from the API, which pulls `dbProduct.images[0]` or a placeholder with no title-based override [149–152 in API, 301–312 in client].
  - Quick View: In the enhanced flow, it uses the transformed `product.images` and therefore inherits the override; it does not bypass it [27–33, 49–56].

- Evidence included in file and line references above.

- Short answer on Next Image config: Supabase storage domain is allowed when `NEXT_PUBLIC_SUPABASE_URL` is set; dev localhost patterns also included.

- Summary
  - Influencer shop grid uses `product.image` from DB (no override).
  - Enhanced grid uses title-based override when present; modal inherits the same override.