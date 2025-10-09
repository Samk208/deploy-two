# Integration Status & Implementation Plan

## Current State Summary

### ✅ Working Components

1. **API Endpoints**
   - `/api/main-shop/feed` - Main shop catalog with filters, pagination, sorting
   - `/api/influencer/[handle]/feed` - Influencer curated feed with sale prices & custom titles
   - Both support: `q`, `sort`, `category`, `brand`, `minPrice`, `maxPrice`, `inStockOnly`, `page`, `limit`

2. **Freeze System**
   - Middleware enforces 423 for writes when frozen
   - `CORE_FREEZE` - blocks onboarding/dashboard writes
   - `SHOPS_FREEZE` - blocks product/shop writes
   - Banners: `FreezeBanner.tsx`, `ShopFreezeBanner.tsx`
   - Helper: `isShopFrozen()`

3. **UI Components**
   - `MainShopCard.tsx` - Product cards with cart/wishlist
   - `FilterBar.tsx` - Client-side filters (triggers page reload)
   - `PaginationBar.tsx` - Simple prev/next navigation
   - `header.tsx` - Google Translate integrated

4. **Pages**
   - `/shops` - Directory of influencer shops (listing)
   - `/shop/[handle]` - Individual influencer shop page (EXISTS)
   - `/shop` - Main shop catalog

### 🟡 Needs Updates

1. **`/shop` page** (`app/shop/page.tsx`)
   - ✅ NOW UPDATED: Uses `/api/main-shop/feed` instead of direct DB
   - ✅ Passes all URL params to API
   
2. **`/shop/[handle]` page** (`app/shop/[handle]/page.tsx`)
   - ❌ Currently uses `/api/shop/[handle]`
   - ❌ Should use `/api/influencer/[handle]/feed` for consistency
   - ❌ Missing sale_price display logic

3. **Freeze Banners**
   - ✅ NOW ADDED: Shop layout includes both freeze banners
   - ❌ Not yet added to influencer shop pages

4. **Smoke Tests**
   - ❌ Need to expect 200 for reads (currently "non-423")
   - ❌ Need real handle test case

---

## URL Structure

```
/shop               → Main shop catalog (all products)
/shop?page=1        → Pagination
/shop?q=search      → Search query
/shop?sort=price-asc → Sorting
/shop?category=...  → Category filter

/shops              → Directory of all influencer shops
/shop/[handle]      → Individual influencer shop (curated products)
```

---

## Implementation Plan

### Phase 1: Update Influencer Shop Page ✅ PRIORITY

**File: `app/shop/[handle]/page.tsx`**

Change from:
```typescript
const endpoint = new URL(`/api/shop/${handle}`, base).toString();
```

To:
```typescript
const endpoint = new URL(`/api/influencer/${handle}/feed`, base).toString();
```

**Add support for:**
- `sale_price` display
- `custom_title` override
- Query params: `page`, `limit`, `q`, `sort`, `category`, `minPrice`, `maxPrice`, `inStockOnly`

---

### Phase 2: Add Freeze Banners to Influencer Shop

**File: `app/shop/[handle]/layout.tsx` (CREATE)**

```typescript
import FreezeBanner from "@/components/FreezeBanner";
import ShopFreezeBanner from "@/components/ShopFreezeBanner";

export default function InfluencerShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <FreezeBanner />
      <ShopFreezeBanner />
      {children}
    </>
  );
}
```

---

### Phase 3: Update Smoke Scripts

**File: `scripts/integration-smoke.ps1`**

Change read expectation from:
```powershell
$passed = $status -ne 423 -and $status -ne 0
$expectation = "Read should stay available (non-423)"
```

To:
```powershell
$passed = $status -eq 200
$expectation = "Read should return 200 OK"
```

**Add test case:**
```powershell
[pscustomobject]@{
    Name       = "Influencer feed (real handle)"
    Method     = "GET"
    Path       = "/api/influencer/test-influencer/feed"
    ExpectType = "Read"
}
```

---

### Phase 4: Client-Side Filter Optimization (Optional - Future)

**Current:** FilterBar triggers full page reload via `router.push()`
**Future:** Use client-side fetch + state management for smoother UX

This can be deferred as current implementation works correctly.

---

## Testing Checklist

### Unfrozen State (CORE_FREEZE=false, SHOPS_FREEZE=false)

- [ ] GET `/api/main-shop/feed` → 200
- [ ] GET `/api/influencer/[handle]/feed` → 200
- [ ] GET `/api/products` → 200
- [ ] POST `/api/onboarding/submit` → non-423 (401/403/422 OK)
- [ ] POST `/api/products` → non-423 (401/403/422 OK)
- [ ] POST `/api/influencer/shop` → non-423 (401/403/422 OK)

### Frozen State (Flags = true)

- [ ] GET endpoints still return 200
- [ ] POST `/api/onboarding/submit` → 423
- [ ] POST `/api/products` → 423
- [ ] POST `/api/influencer/shop` → 423
- [ ] Banners visible on `/shop` and `/shop/[handle]`
- [ ] Write buttons disabled (pointer-events-none)

### UI Verification

- [ ] `/shop` loads products from feed API
- [ ] Pagination works (prev/next buttons)
- [ ] Filters apply correctly (category, price, stock)
- [ ] Search updates results
- [ ] `/shop/[handle]` shows curated products
- [ ] Sale prices display correctly
- [ ] Google Translate widget appears in header
- [ ] No console errors

---

## Rollback Plan

If issues arise:
```bash
git revert HEAD
git push origin main --force-with-lease
```

Or restore to tag:
```bash
git reset --hard post-db-protections
git push origin main --force-with-lease
```

---

## Environment Variables Required

```env
# Freeze control
CORE_FREEZE=false
NEXT_PUBLIC_CORE_FREEZE=false
SHOPS_FREEZE=false
NEXT_PUBLIC_SHOPS_FREEZE=false

# API base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
```

---

## Files Modified

1. ✅ `app/shop/page.tsx` - Updated to use feed API
2. ✅ `app/shop/layout.tsx` - Added freeze banners
3. ⏳ `app/shop/[handle]/page.tsx` - Update to feed API
4. ⏳ `app/shop/[handle]/layout.tsx` - Add freeze banners
5. ⏳ `scripts/integration-smoke.ps1` - Tighten read expectations
6. ⏳ `scripts/test-shops-freeze.mjs` - Update test cases

---

## Next Steps

1. Update influencer shop page to use feed endpoint
2. Add freeze banner layout
3. Update smoke tests
4. Run verification sequence
5. Document test results
6. Create PR

