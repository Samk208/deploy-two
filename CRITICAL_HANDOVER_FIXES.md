# CRITICAL HANDOVER FIXES - VERCEL DEPLOYMENT

## 🚨 IMMEDIATE ACTIONS REQUIRED

### 1. Manual Shop Page Fixes (2 files need editing)

#### File 1: `app/shop/enhanced-page-fixed.tsx`
**Line ~189** - Replace the existing `addToCart` function with:
```typescript
const addToCart = (product: any) => {
  const cartItem: Omit<CartItem, 'quantity'> & { quantity?: number } = {
    id: product.id,
    title: product.title,  // Fixed: was 'name', should be 'title'
    price: product.price,
    originalPrice: product.original_price,
    image: product.images?.[0] || '/placeholder.svg',
    category: product.category,
    supplierId: product.supplier_id || '',
    supplierName: product.supplier?.name || 'Unknown Supplier',
    supplierVerified: product.supplier?.verified || false,
    maxQuantity: product.stock_count || 10,
    quantity: 1
  }
  
  addItem(cartItem)
  toast.success(`${product.title} added to cart!`)
}
```

**Line ~517** - Add the missing `onAddToCart` prop:
```typescript
<QuickViewModal
  product={quickViewProduct}
  isOpen={isQuickViewOpen}
  onClose={() => {
    setIsQuickViewOpen(false)
    setQuickViewProduct(null)
  }}
  onAddToCart={addToCart}  // ← ADD THIS LINE
/>
```

#### File 2: `app/shop/enhanced-page.tsx`
**Around line 100** - Add the missing `addToCart` function (after state declarations):
```typescript
import { useCartStore } from '@/lib/store/cart'
import type { CartItem } from '@/lib/store/cart'

// Add this function
const addToCart = (product: any) => {
  const cartItem: Omit<CartItem, 'quantity'> & { quantity?: number } = {
    id: product.id,
    title: product.title,
    price: product.price,
    originalPrice: product.original_price,
    image: product.images?.[0] || '/placeholder.svg',
    category: product.category,
    supplierId: product.supplier_id || '',
    supplierName: product.supplier?.name || 'Unknown Supplier',
    supplierVerified: product.supplier?.verified || false,
    maxQuantity: product.stock_count || 10,
    quantity: 1
  }
  
  addItem(cartItem)
  toast.success(`${product.title} added to cart!`)
}
```

**Line ~317** - Make sure the EnhancedProductCard has onAddToCart:
```typescript
onAddToCart={addToCart}  // Ensure this is passed
```

**Line ~467** - Add the missing `onAddToCart` prop:
```typescript
<QuickViewModal
  product={quickViewProduct}
  isOpen={isQuickViewOpen}
  onClose={() => {
    setIsQuickViewOpen(false)
    setQuickViewProduct(null)
  }}
  onAddToCart={addToCart}  // ← ADD THIS LINE
/>
```

## ✅ Already Fixed (No action needed)

The following files have already been fixed:
- ✅ `lib/supabase/types.ts` - Database types with all tables
- ✅ `lib/auth-helpers.ts` - Type assertions added
- ✅ `app/api/webhooks/stripe/route.ts` - Commission handling fixed
- ✅ `vercel.json` - Deployment configuration added

## 📋 Deployment Checklist

### 1. Apply Manual Fixes
```bash
# Open the files in your editor and apply the fixes above
code app/shop/enhanced-page-fixed.tsx
code app/shop/enhanced-page.tsx
```

### 2. Test Build Locally
```bash
# Run TypeScript check
pnpm typecheck

# If successful, build the project
pnpm build

# Test the production build
pnpm start
```

### 3. Environment Variables in Vercel
Ensure these are set in your Vercel project settings:

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 4. Deploy to Vercel
```bash
# Commit all changes
git add .
git commit -m "Fix: Complete TypeScript build errors for Vercel deployment"
git push origin main
```

## ⚠️ Known Issues to Address Post-Deployment

### 1. No Products in Database
The shop shows "0 Products" - you need to:
- Add products to your Supabase `products` table
- Or run the seed script if you have one

### 2. Edge Runtime Warnings
These are non-blocking warnings about Node.js APIs in Supabase. They can be ignored as they're handled at runtime.

### 3. Stock Management
Ensure the `decrement_stock` function exists in your Supabase database:
```sql
CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, quantity INT)
RETURNS INT AS $$
DECLARE
  new_stock INT;
BEGIN
  UPDATE products 
  SET stock_count = GREATEST(0, stock_count - quantity)
  WHERE id = product_id
  RETURNING stock_count INTO new_stock;
  
  RETURN new_stock;
END;
$$ LANGUAGE plpgsql;
```

## 🔍 Quick Verification

After deployment, verify:
1. ✅ Site loads without errors
2. ✅ Shop page renders (even if no products)
3. ✅ Authentication works
4. ✅ No build errors in Vercel dashboard

## 📞 Support

If you encounter issues:
1. Check Vercel build logs for specific errors
2. Ensure all environment variables are set correctly
3. Verify Supabase tables match the type definitions

---

**Status**: Ready for deployment after applying the 2 manual shop page fixes above.
**Estimated Time**: 5-10 minutes to apply fixes and deploy.
