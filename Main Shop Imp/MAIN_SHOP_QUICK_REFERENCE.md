# Main Shop - Quick Reference

## 🚀 Quick Start Commands

```powershell
# Clean start (recommended first time)
Remove-Item -Recurse -Force .next, .turbo -ErrorAction SilentlyContinue
pnpm dev

# Normal start
pnpm dev

# Build for production (test before deploy)
pnpm build
pnpm start
```

## 🧪 Testing Commands

```powershell
# Test API directly
curl http://localhost:3000/api/main-shop/feed | ConvertFrom-Json

# Test with limit
curl "http://localhost:3000/api/main-shop/feed?limit=12" | ConvertFrom-Json

# Test in browser (pretty JSON)
# Visit: http://localhost:3000/api/main-shop/feed
```

## 🎛️ Feature Flag Control

### Enable Main Shop (new behavior)
```powershell
# Edit .env.local
# Change line to: NEXT_PUBLIC_ENABLE_MAIN_SHOP=true
# Restart: pnpm dev
# Result: /shop → /main-shop
```

### Disable Main Shop (original behavior)
```powershell
# Edit .env.local
# Change line to: NEXT_PUBLIC_ENABLE_MAIN_SHOP=false
# Restart: pnpm dev
# Result: /shop → /shops
```

## 📍 Routes Reference

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/main-shop` | Aggregated product catalog | No |
| `/product/[id]` | Single product details | No |
| `/shop` | Router (flag-dependent) | No |
| `/shops` | Influencer directory | No |
| `/shop/[handle]` | Influencer shop | No |
| `/api/main-shop/feed` | Product feed API | No |

## 🔍 Common Checks

### Check if products exist in DB
```sql
SELECT COUNT(*) FROM products WHERE active = true AND in_stock = true;
```

### Check if products are linked
```sql
SELECT COUNT(DISTINCT product_id) 
FROM influencer_shop_products 
WHERE published = true;
```

### Check what API returns
```powershell
curl http://localhost:3000/api/main-shop/feed | ConvertFrom-Json | Select-Object -ExpandProperty items | Select-Object id, title, price
```

## 🐛 Quick Fixes

### Empty catalog page
**Symptom:** "No products yet" message  
**Fix:** Ensure DB has products with `published=true` links in `influencer_shop_products`

### API returns 500
**Symptom:** Server error in console  
**Fix:** Check SUPABASE_SERVICE_ROLE_KEY in `.env.local`

### Feature flag not working
**Symptom:** `/shop` goes to wrong place  
**Fix:** Restart dev server after changing `.env.local`

### Images not loading
**Symptom:** Gray placeholder boxes  
**Fix:** Check Supabase storage bucket permissions

## 📦 Files You Can Safely Delete (Rollback)

If you need to completely remove this feature:

```powershell
# Stop server first
Remove-Item -Recurse app/main-shop
Remove-Item -Recurse app/product
Remove-Item -Recurse app/api/main-shop
Remove-Item lib/supabase-admin.ts

# Then manually revert changes in:
# - middleware.ts (remove /main-shop, /product, /api/main-shop)
# - app/shop/page.tsx (remove feature flag logic)
# - .env.local (remove NEXT_PUBLIC_ENABLE_MAIN_SHOP)
```

## 🛡️ Safety Checks

Before any deployment:
- [ ] `NEXT_PUBLIC_ENABLE_MAIN_SHOP` value decided
- [ ] API tested and returns valid data
- [ ] No console errors
- [ ] Service role key NOT in browser bundle
- [ ] Feature flag toggles correctly

## 📱 Mobile Testing

```
# Test on mobile simulator or real device
http://localhost:3000/main-shop (grid should be responsive)
http://localhost:3000/product/[id] (should stack columns)
```

## 🔗 Related Files

**Documentation:**
- `MAIN_SHOP_IMPLEMENTATION.md` - Full implementation details
- `VERIFICATION_CHECKLIST.md` - Pre-launch checklist
- `HANDOVER.md` - Core freeze documentation
- `INVESTIGATION_REPORT.md` - Original issue analysis

**Core Implementation:**
- `lib/supabase-admin.ts` - Server-side DB client
- `app/api/main-shop/feed/route.ts` - API endpoint
- `app/main-shop/page.tsx` - Main catalog page
- `app/product/[id]/page.tsx` - Product detail page

**Configuration:**
- `.env.local` - Environment variables
- `middleware.ts` - Route permissions

## 💡 Tips

1. **Always test with real data first** - Don't create test products
2. **Use feature flag** - Easy on/off without code changes  
3. **Check Network tab** - Verify no writes happen
4. **Monitor performance** - Page should load in < 2 seconds
5. **Test both states** - Flag ON and OFF before going live

## 🆘 Getting Help

If stuck:
1. Check `VERIFICATION_CHECKLIST.md` troubleshooting section
2. Verify all files created correctly (7 new files)
3. Check browser console for errors
4. Check server terminal for API errors
5. Test API endpoint directly first (curl command above)

---

**Keep this file handy while working with Main Shop!** 📌
