I'll scan the codebase for the `/api/checkout` route, any helpers it calls, and usages assuming `product.images[0]`. I’ll run several searches in parallel to quickly locate files and exact lines, then open the relevant files to cite precise ranges.

[5 tools called]

I'll open the checkout route and relevant helpers in parallel to capture exact lines around the image handling and product shape.

[4 tools called]

I'll look up the products table schema to confirm the `images` column type/nullability, and scan for any other "temporary product" shapes using `image` vs `images`.

[1 tool called]

I'll open the Stripe webhook route to see if any checkout-related processing assumes `product.images[0]` or mismatched shapes, and also open `components/shop/product-card.tsx` and `components/shop/enhanced-product-card.tsx` to capture exact `images[0]` assumptions.

[1 tool called]

I'll open the schema files and mock data to cite the exact lines showing the `images` column definition and temporary product shapes using singular `image`.

[5 tools called]

I opened the checkout route and helpers and scanned for image shape assumptions and any places that index product.images[0]. Below are precise citations and a concise analysis.

- Files opened: `app/api/checkout/route.ts`, `lib/validators.ts`, `lib/types.ts`, `lib/stripe.ts`, DB schema under `supabase/`, plus mock/temporary product shapes.

1) /api/checkout and called helpers
- Checkout route (creates Stripe session; reads DB; builds `lineItems` and `orderItems`)
```57:79:app/api/checkout/route.ts
    for (const item of items) {
      let product = products?.find((p: any) => p.id === item.productId) as any
      // In development, allow fallback to client-provided payload when product lookup fails
      if (!product) {
        const anyItem: any = item as any
        product = {
          id: anyItem.productId,
          title: anyItem.title || anyItem.name || 'Product',
          description: anyItem.description || '',
          price: typeof anyItem.price === 'number' ? anyItem.price : (typeof anyItem.effectivePrice === 'number' ? anyItem.effectivePrice : 0),
          images: anyItem.image ? [anyItem.image] : [],
          supplier_id: anyItem.supplierId,
          commission: anyItem.commission,
          stock_count: Number.isFinite(anyItem.stock_count) ? anyItem.stock_count : 999,
        } as any
        if (process.env.NODE_ENV === 'production') {
          console.error('[checkout] Missing product in DB in production:', item.productId)
          return NextResponse.json(
            { ok: false, message: `Product ${item.productId} not available` },
            { status: 400 }
          )
        }
      }
```
```91:113:app/api/checkout/route.ts
      const imageArray = Array.isArray(product.images)
        ? product.images
        : (typeof product.images === 'string' ? [product.images] : [])
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.title || 'Product',
            description: product.description || '',
            images: imageArray.filter(Boolean).slice(0, 1),
          },
          unit_amount: formatAmountForStripe(Number(product.price) || 0),
        },
        quantity: item.quantity,
      })

      orderItems.push({
        productId: product.id,
        title: product.title,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0] || '',
        supplierId: product.supplier_id,
        commission: product.commission,
      })
```
- Product type (expected images shape)
```43:50:lib/types.ts
export interface Product {
  id: string
  title: string
  description: string
  price: number
  originalPrice?: number
  images: string[]
```
- Checkout payload validation (does not validate image fields on items)
```86:101:lib/validators.ts
export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        // Accept any non-empty string; some demo data uses non-UUID IDs
        productId: z.string().min(1),
        quantity: z.number().int().min(1),
        // Optional influencer/referral context (additive)
        influencerId: z.string().min(1).optional(),
        shopHandle: z.string().min(1).optional(),
        effectivePrice: z.number().min(0).optional(),
        price: z.number().min(0).optional(),
      })
    )
    .min(1),
```
- Stripe helper (no product shape assumptions here)
```1:16:lib/stripe.ts
import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY!

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})
```

2) Expected product shape in checkout logic
- DB schema: `products.images` is an array; in latest migration it’s NOT NULL with default.
```24:33:supabase/migrations/20250102_initial_schema.sql
-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  original_price DECIMAL(10,2) CHECK (original_price >= 0),
  images TEXT[] NOT NULL DEFAULT '{}',
  category VARCHAR NOT NULL,
  region TEXT[] NOT NULL DEFAULT '{}',
```
- Types declare `images: string[]` (see `lib/types.ts` above). So the checkout logic expects `product.images` to exist and be an array of strings.

3) “Fallback” or “temporary” product object shapes
- Checkout’s own “fallback” when DB miss: uses `images` array, constructed from a singular `image` field if present on the client item.
```60:70:app/api/checkout/route.ts
      if (!product) {
        const anyItem: any = item as any
        product = {
          id: anyItem.productId,
          title: anyItem.title || anyItem.name || 'Product',
          description: anyItem.description || '',
          price: typeof anyItem.price === 'number' ? anyItem.price : (typeof anyItem.effectivePrice === 'number' ? anyItem.effectivePrice : 0),
          images: anyItem.image ? [anyItem.image] : [],
          supplier_id: anyItem.supplierId,
          commission: anyItem.commission,
          stock_count: Number.isFinite(anyItem.stock_count) ? anyItem.stock_count : 999,
        } as any
```
- Other “temporary/mock” objects elsewhere use singular `image` alongside `images`, which can lead to shape drift in calling code:
```11:15:app/api/products/bulk-deactivate/route.ts
  const mockProducts = [
    {
      id: "1",
      title: "Sustainable Cotton Tee",
      ...
      image: "/cotton-tee.png",
      images: ["/cotton-tee.png", "/cotton-tee-back.png", "/cotton-tee-detail.png"],
```
```45:51:mocks/dashboard-data.ts
    top_products: [
      {
        product_id: "1",
        title: "Premium Cotton T-Shirt",
        image: "/cotton-tee.png",
        units_sold: 156,
```
```20:26:app/order/success/page.tsx
    {
      id: "1",
      title: "Sustainable Cotton Tee",
      price: 45,
      quantity: 2,
      image: "/cotton-tee.png",
```

4) Exact lines assuming product.images[0] that would throw if missing
- Direct indexing without guarding array-ness or presence (this is the key mismatch):
```107:115:app/api/checkout/route.ts
      orderItems.push({
        productId: product.id,
        title: product.title,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0] || '',
        supplierId: product.supplier_id,
        commission: product.commission,
      })
```

Why this would crash
- If `product.images` is undefined or not an array (e.g., a caller or mock passed a temporary product shape with only `image` and no `images`, or bad DB row with null), `product.images[0]` throws TypeError: Cannot read properties of undefined (reading '0'). Note the code just above correctly normalizes `imageArray` for Stripe, but `orderItems` uses `product.images[0]` directly, creating an inconsistency and a potential crash path.

Tiny validation sketch that would have caught this
```ts
import { z } from 'zod'

// Enforce that any product used in checkout has at least one image URL
const CheckoutProductSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  price: z.number().nonnegative(),
  images: z.array(z.string().url()).min(1), // ensures product.images[0] exists and is a URL
});

// If shaping from client items:
const CheckoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
  image: z.string().url().optional(),
}).refine((i) => Boolean(i.image), {
  message: "Missing product image for fallback",
  path: ["image"],
});
```

Verification report
- File paths + line numbers for the mismatch:
  - `app/api/checkout/route.ts` 107–115: uses `product.images[0]` without guarding, potential crash.
  - Expected shape: `lib/types.ts` 43–50 shows `images: string[]`; DB schema guarantees array default: `supabase/migrations/20250102_initial_schema.sql` 24–33.
  - Fallback product construction: `app/api/checkout/route.ts` 60–70 sets `images` from `item.image`, but other mocks elsewhere use only `image` (e.g., `app/api/products/bulk-deactivate/route.ts` 11–15; `mocks/dashboard-data.ts` 45–51; `app/order/success/page.tsx` 20–26), increasing the risk of undefined `images` in mixed data paths.

- Short explanation: The checkout logic mixes a safe normalization path for Stripe (`imageArray`) with an unsafe direct index for `orderItems` (`product.images[0]`). If any product lacks an `images` array, this throws before responding, surfacing as a 500.

- Status: I’ve completed a read-only review with exact citations and a validation sketch; no edits were made.

- Suggested next step (optional, not implementing): Guard `orderItems` the same way `imageArray` is derived, or validate/normalize product shapes before use.