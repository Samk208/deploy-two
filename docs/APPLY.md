# How to Apply the Supabase and Build Errors Fix Patch

This document provides step-by-step instructions for applying the consolidated patch that fixes all Supabase import issues, build errors, and type safety problems.

## Prerequisites

Before applying this patch, ensure you have:

- Node.js 18+ installed
- pnpm, npm, or yarn package manager
- Access to your Supabase project
- Environment variables properly configured

## Environment Variables

Ensure these environment variables are set in your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Step 1: Backup Current State

Create a backup of your current working code:

```bash
# Create a backup branch
git checkout -b backup-before-supabase-fix

# Or create a backup directory
cp -r . ../vo-onelink-google-backup-$(date +%Y%m%d)
```

## Step 2: Apply the Patch

### Option A: Apply the Consolidated Patch File

```bash
# Apply the patch
git apply patches/fix-supabase-and-build-errors.patch

# If you encounter conflicts, resolve them manually
git status
```

### Option B: Manual File Updates

If the patch doesn't apply cleanly, manually update the files:

#### 2.1 Update Supabase Client Files

**Create `lib/supabase/admin.ts`:**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createServerClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    cookies: {
      getAll() {
        return cookies().getAll()
      },
      setAll() {
        // No-op for admin client
      },
    },
  }
)

export { supabaseAdmin as default }
```

**Create `lib/supabase/server.ts`:**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './types'

export async function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // No-op for server-side operations
        },
      },
    }
  )
}

export { createServerSupabaseClient as default }
```

**Create `lib/supabase/client.ts`:**
```typescript
import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

export function createClientSupabaseClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

export { supabase as default }
```

**Create `lib/supabase/types.ts`:**
```typescript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: string
          avatar?: string
          verified?: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: string
          avatar?: string
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: string
          avatar?: string
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      // ... other table definitions
    }
    Functions: {
      decrement_stock: {
        Args: {
          product_id: string
          quantity: number
        }
        Returns: number
      }
    }
  }
}
```

#### 2.2 Update Type Definitions

**Add to `lib/types.ts`:**
```typescript
// Icon type for Lucide icons and other icon components
export type Icon = React.ComponentType<{ className?: string; size?: number }>
```

#### 2.3 Fix API Route Imports

Update all API routes that import `supabaseAdmin`:

**Before:**
```typescript
import { supabaseAdmin } from "@/lib/supabase"
```

**After:**
```typescript
import { supabaseAdmin } from "@/lib/supabase/admin"
```

**Add runtime export to API routes using `@supabase/ssr`:**
```typescript
export const runtime = 'nodejs'

// ... rest of your route code
```

#### 2.4 Replace .catch() with try/catch

**Before:**
```typescript
const { data, error } = await supabase
  .from('products')
  .select('*')
  .catch(() => null)
```

**After:**
```typescript
try {
  const { data, error } = await supabase
    .from('products')
    .select('*')
  
  if (error) {
    console.error('Database error:', error)
    return null
  }
  
  return data
} catch (error) {
  console.error('Unexpected error:', error)
  return null
}
```

## Step 3: Update Package Dependencies

Ensure you have the required dependencies:

```bash
pnpm add @supabase/ssr @supabase/supabase-js
pnpm add -D @types/react @types/node
```

## Step 4: Run Tests

Test the Icon type safety:

```bash
# Run the Icon typing test
pnpm test tests/icon-typing.test.tsx

# Or run all tests
pnpm test
```

## Step 5: Build and Verify

```bash
# Clean build
pnpm run build

# Check for TypeScript errors
pnpm run type-check

# Start development server
pnpm run dev
```

## Step 6: Test API Routes

Test that your API routes are working correctly:

```bash
# Test a simple API route
curl http://localhost:3000/api/debug/database

# Check the browser console for any remaining errors
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all import paths are correct
2. **Type Errors**: Check that the Icon type is properly imported
3. **Build Errors**: Verify all dependencies are installed
4. **Runtime Errors**: Check that `runtime = 'nodejs'` is exported

### Rollback

If you encounter issues, you can rollback:

```bash
# Revert to backup branch
git checkout backup-before-supabase-fix

# Or restore from backup directory
cp -r ../vo-onelink-google-backup-$(date +%Y%m%d)/* .
```

## Verification Checklist

- [ ] All `supabaseAdmin` imports updated to use new paths
- [ ] `runtime = 'nodejs'` added to API routes using `@supabase/ssr`
- [ ] `.catch()` replaced with `try/catch` blocks
- [ ] Icon type properly defined and imported
- [ ] TypeScript compilation succeeds
- [ ] Build process completes without errors
- [ ] API routes respond correctly
- [ ] Icon components render without type errors

## Support

If you encounter issues during the patch application:

1. Check the error messages carefully
2. Verify environment variables are set correctly
3. Ensure all dependencies are up to date
4. Check the troubleshooting section above
5. Create an issue with detailed error information

## Next Steps

After successfully applying this patch:

1. Test all functionality thoroughly
2. Update your deployment pipeline if needed
3. Monitor for any new errors in production
4. Consider running the full test suite
5. Update your documentation if needed

## Applying the Shop Product Count Fix Patch

This section documents how to apply the `fix-shop-product-count.patch` that improves product count accuracy and consistency in the shop.

### What This Patch Fixes

The patch addresses several issues with product count display:

1. **Count Consistency**: Ensures `totalCount` is always consistent between the hook and the shop page
2. **Accurate Pagination**: Verifies that `range(offset, offset+limit-1)` is properly implemented
3. **Better Error Handling**: Improves count handling when errors occur
4. **Enhanced User Experience**: Provides more informative messages when no products match filters

### Step 1: Apply the Patch

```bash
# Apply the shop product count patch
git apply patches/fix-shop-product-count.patch

# Check for any conflicts
git status
```

### Step 2: Verify the Changes

The patch modifies these files:

#### `hooks/use-products.ts`
- Improves logging for pagination parameters
- Ensures `totalCount` is always set to `count || 0`
- Better consistency in state updates

#### `app/shop/enhanced-page.tsx`
- Adds comments for better code clarity
- Ensures `totalCount` is properly initialized and updated
- Improves error handling to maintain count consistency
- Better user messaging for filtered results

#### `tests/shop-count.spec.ts` (New File)
- Comprehensive Playwright tests for product count accuracy
- Tests count consistency during filtering
- Verifies proper handling of empty results

### Step 3: Run the Tests

```bash
# Run the new shop count tests
npm run test:e2e -- tests/shop-count.spec.ts

# Or run all tests
npm run test:e2e
```

### Step 4: Test the Shop Page

1. **Navigate to `/shop`**
2. **Verify the count display**: Should show "Showing X of Y products"
3. **Check count accuracy**: The visible count should match actual product cards
4. **Test filtering**: Apply filters and verify counts remain consistent
5. **Test search**: Search for non-existent products and verify count shows 0

### Expected Behavior After Patch

- **Accurate Counts**: Product counts should always match visible products
- **Consistent Display**: Counts should remain consistent during filtering
- **Better Error Handling**: Counts should reset properly on errors
- **Improved UX**: More informative messages when no products match filters

### Troubleshooting

#### Count Mismatch Issues
If counts don't match visible products:

1. Check browser console for errors
2. Verify Supabase query is returning correct `count` value
3. Ensure `totalCount` state is being updated correctly

#### Test Failures
If Playwright tests fail:

1. Check that product cards have `data-testid="product-card"`
2. Verify the count display text format matches expected pattern
3. Ensure proper timeouts for loading states

#### Performance Issues
If the shop page is slow:

1. Check Supabase query performance
2. Verify pagination is working correctly
3. Monitor network requests in browser dev tools

### Rollback Instructions

If you need to rollback this patch:

```bash
# Revert the changes
git checkout HEAD -- hooks/use-products.ts
git checkout HEAD -- app/shop/enhanced-page.tsx
git rm tests/shop-count.spec.ts

# Or reset to previous commit
git reset --hard HEAD~1
```

### Integration with Other Patches

This patch is designed to work alongside:
- `fix-supabase-and-build-errors.patch` - Provides the Supabase infrastructure
- `fix-shop-product-display.patch` - Improves product display functionality
- `enhance-product-filters.patch` - Adds filtering capabilities

Apply patches in the recommended order for best results.

## Applying the Enhance Shop Features Patch

This section documents how to apply the `enhance-shop-features.patch` that extends existing shop functionality with enhanced filtering, URL state management, and comprehensive testing.

### What This Patch Enhances

The patch extends the existing shop features without overwriting current functionality:

1. **Enhanced Filtering**: Adds price range filtering to the existing `use-products.ts` hook
2. **URL State Management**: Stores filter state in URL query parameters for shareable state
3. **Improved UX**: Better filter indicators and reset functionality
4. **Comprehensive Testing**: Full Playwright test coverage for all filter operations

### Step 1: Apply the Patch

```bash
# Apply the enhance shop features patch
git apply patches/enhance-shop-features.patch

# Check for any conflicts
git status
```

### Step 2: Verify the Changes

The patch modifies these files:

#### `hooks/use-products.ts`
- Adds `priceRange` parameter support
- Implements price filtering with `gte` and `lte` queries
- Maintains existing category and search filtering
- Extends dependency array for proper re-fetching

#### `app/shop/enhanced-page.tsx`
- Adds URL state management with `useSearchParams` and `useRouter`
- Implements filter persistence in URL
- Adds reset filters functionality
- Enhances filter status display
- Maintains all existing functionality

#### `tests/shop-filters.spec.ts` (New File)
- Comprehensive tests for category filtering
- Price range filter validation
- Search query functionality testing
- Filter reset and state persistence tests
- Active filter indicator validation

### Step 3: Run the Tests

```bash
# Run the new shop filters tests
npm run test:e2e -- tests/shop-filters.spec.ts

# Or run all tests
npm run test:e2e
```

### Step 4: Test the Enhanced Features

1. **Navigate to `/shop`**
2. **Test Category Filtering**: Click on category filters and verify URL updates
3. **Test Price Filtering**: Adjust price range and verify products are filtered
4. **Test Search**: Enter search terms and verify URL parameters
5. **Test Reset**: Click reset button and verify all filters are cleared
6. **Test Persistence**: Refresh page and verify filters remain applied

### Expected Behavior After Patch

- **Enhanced Filtering**: Price range filtering now works alongside existing filters
- **URL State**: Filter state is preserved in URL and shareable
- **Better UX**: Clear indicators for active filters and reset options
- **Improved Performance**: Filters trigger proper re-fetching of products
- **State Persistence**: Filters survive page refreshes and navigation

### Integration with Existing Features

This patch works alongside existing functionality:

- **`enhance-product-filters.patch`**: Provides the UI components for filtering
- **`fix-shop-product-display.patch`**: Maintains product display functionality
- **`fix-shop-product-count.patch`**: Preserves accurate product counting

### Troubleshooting

#### Filter Not Working
If filters don't apply correctly:

1. Check browser console for errors
2. Verify URL parameters are being set correctly
3. Ensure Supabase queries are executing with proper filters

#### URL State Issues
If URL state isn't persisting:

1. Check that `useSearchParams` and `useRouter` are properly imported
2. Verify filter state is being loaded from URL on mount
3. Ensure URL updates are happening without page refresh

#### Test Failures
If Playwright tests fail:

1. Check that all required `data-testid` attributes are present
2. Verify filter components are properly rendered
3. Ensure proper timeouts for filter application

### Rollback Instructions

If you need to rollback this patch:

```bash
# Revert the changes
git checkout HEAD -- hooks/use-products.ts
git checkout HEAD -- app/shop/enhanced-page.tsx
git rm tests/shop-filters.spec.ts

# Or reset to previous commit
git reset --hard HEAD~1
```

### Performance Considerations

- **Filter Debouncing**: Consider adding debouncing for search inputs
- **Query Optimization**: Monitor Supabase query performance with complex filters
- **State Management**: Large filter states may impact URL length

### Future Enhancements

This patch provides a foundation for:

- **Advanced Filtering**: Date ranges, ratings, supplier filters
- **Saved Filters**: User preference persistence
- **Filter Analytics**: Track popular filter combinations
- **Mobile Optimization**: Touch-friendly filter interfaces
