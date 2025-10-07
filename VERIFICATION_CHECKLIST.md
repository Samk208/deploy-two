- Missing env vars (check console)
- Service role key in browser bundle (check DevTools > Sources)
- Blank pages (check if DB has products with published=true links)

### Critical Issues 🚨
- Any write operations (POST/PUT/PATCH/DELETE in Network tab)
- Errors touching dashboard/onboarding routes
- Middleware blocking legitimate routes
- Service role key visible in client code

## 🔧 Troubleshooting

### Issue: API returns empty items array
**Cause:** No products linked via `influencer_shop_products` with `published=true`
**Solution:** 
```sql
-- Check if products exist and are linked
SELECT p.id, p.title, isp.published 
FROM products p
LEFT JOIN influencer_shop_products isp ON p.id = isp.product_id
WHERE p.active = true AND p.in_stock = true;
```

### Issue: 500 error on API
**Cause:** Missing SUPABASE_SERVICE_ROLE_KEY
**Solution:** Verify in `.env.local` and restart server

### Issue: /shop still goes to /shops with flag ON
**Cause:** Env var not reloaded
**Solution:** 
```powershell
# Stop server (Ctrl+C)
# Verify .env.local has NEXT_PUBLIC_ENABLE_MAIN_SHOP=true
pnpm dev
```

### Issue: Product images don't load
**Cause:** CORS or Supabase storage bucket not public
**Solution:** Check if `primary_image` URLs are accessible

### Issue: 423 Locked on /api/main-shop/feed
**Cause:** Freeze mode blocking GET (shouldn't happen)
**Solution:** Check middleware - ensure `/api/main-shop` in publicApiRoutes

## 📊 Database Verification

### Check if products exist:
```sql
SELECT 
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE active = true) as active,
  COUNT(*) FILTER (WHERE in_stock = true) as in_stock
FROM products;
```

### Check if products are linked:
```sql
SELECT 
  COUNT(DISTINCT product_id) as unique_products_linked
FROM influencer_shop_products
WHERE published = true;
```

### Check specific shop's products:
```sql
SELECT 
  s.name,
  s.handle,
  COUNT(isp.product_id) as product_count
FROM shops s
LEFT JOIN influencer_shop_products isp ON s.influencer_id = isp.influencer_id
WHERE isp.published = true
GROUP BY s.id, s.name, s.handle;
```

## 🎯 Success Criteria

All must be true:
- [ ] `/main-shop` loads without errors
- [ ] `/product/[id]` loads for valid product IDs
- [ ] `/api/main-shop/feed` returns valid JSON
- [ ] `/shops` and `/shop/[handle]` still work
- [ ] Feature flag toggles `/shop` routing correctly
- [ ] No writes occur (verify Network tab)
- [ ] No dashboard/onboarding files touched
- [ ] Service role key never in browser

## 📝 Notes

- **Empty state is expected** if no products have `published=true` links
- Products must meet ALL criteria to appear:
  - `products.active = true`
  - `products.in_stock = true`
  - `products.stock_count > 0`
  - Linked via `influencer_shop_products` with `published = true`
- Dedupe means same product shown by multiple influencers appears once

## 🚦 Final Check Before Going Live

- [ ] All tests pass
- [ ] No console errors
- [ ] Performance acceptable (page loads < 2s)
- [ ] Images load or graceful fallback
- [ ] Mobile responsive (test on small screen)
- [ ] Feature flag works both ways
- [ ] Rollback plan understood
- [ ] Team notified of new routes

---

**When all items checked, implementation is verified and safe to use!** ✅
