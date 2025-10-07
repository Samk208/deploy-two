# Main Shop Directory

This directory contains the **aggregated product catalog** for vo-onelink-google.

## What is Main Shop?

Main Shop displays all products from all influencer shops in a single unified catalog. It's a read-only view that aggregates products from the `influencer_shop_products` table.

## Files

- **`page.tsx`** - Main catalog page (SSR)
- **`loading.tsx`** - Loading skeleton UI

## How It Works

1. Page loads and calls `/api/main-shop/feed`
2. API queries `influencer_shop_products` joined with `products`
3. Filters: only active, in-stock products with stock > 0
4. Deduplicates by product ID
5. Sorts by newest first
6. Returns JSON response
7. Page renders product grid

## Data Flow

```
Browser
  → GET /main-shop
  → Server Component (page.tsx)
  → fetch('/api/main-shop/feed')
  → API Route (app/api/main-shop/feed/route.ts)
  → Supabase Admin Client (lib/supabase-admin.ts)
  → Database Query (influencer_shop_products → products)
  → Filtered Results
  → JSON Response
  → Rendered Grid
```

## Access

- **URL:** `/main-shop`
- **Auth:** None required (public route)
- **Method:** GET only (read-only)

## Feature Flag

The main shop can be set as the default `/shop` destination:

```env
# In .env.local
NEXT_PUBLIC_ENABLE_MAIN_SHOP=true  # /shop → /main-shop
NEXT_PUBLIC_ENABLE_MAIN_SHOP=false # /shop → /shops
```

## Related Routes

- `/main-shop` - This catalog (aggregated view)
- `/shops` - Influencer directory
- `/shop/[handle]` - Individual influencer shop
- `/product/[id]` - Product detail page
- `/api/main-shop/feed` - Data API

## Database Tables

**Read from:**
- `products` - Product details
- `influencer_shop_products` - Link table (which influencers sell which products)
- `shops` - Shop information (used by API indirectly)

**Never writes to database** - This is a read-only catalog.

## Empty State

If no products appear, check:
1. Do products exist in `products` table?
2. Are they linked via `influencer_shop_products`?
3. Are links marked as `published = true`?
4. Are products `active = true` and `in_stock = true`?
5. Is `stock_count > 0`?

All conditions must be true for a product to appear.

## Performance

- **Revalidation:** 0 (always fresh, no cache)
- **Limit:** 48 products (configurable up to 96)
- **Query:** Single database join
- **Rendering:** Server-side (SSR)

## Future Enhancements

Potential additions (not yet implemented):
- Pagination for large catalogs
- Search and filters
- Category navigation
- Sort options
- Product badges (new, sale, trending)

## Security

- Uses server-side admin client (service role key)
- Service key never exposed to browser
- Read-only operations only
- Public access (no auth required)

## Maintenance

To update:
1. Modify `page.tsx` for UI changes
2. Modify `app/api/main-shop/feed/route.ts` for data changes
3. Always maintain read-only nature
4. Never add write operations

## Documentation

See project root for full documentation:
- `MAIN_SHOP_IMPLEMENTATION.md` - Complete implementation details
- `MAIN_SHOP_QUICK_REFERENCE.md` - Quick commands and tips
- `VERIFICATION_CHECKLIST.md` - Testing procedures

---

*Part of the vo-onelink-google main shop implementation*
