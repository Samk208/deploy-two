# TypeScript Fix Patch - Query Inference & Type Safety

## Overview
This patch fixes all TypeScript errors by implementing proper query inference with `QueryData` pattern and using `.maybeSingle()` for queries that might return null.

## Changes Applied

### 1. Core Libraries

#### lib/auth-helpers.ts
```typescript
// REMOVE the problematic type casting
- const { data: user, error } = await query as QueryResult<UserQuery>

// ADD direct query result usage (inference works automatically)
+ const { data: user, error } = await query

// REMOVE type declaration (not needed with proper inference)
- type UserQuery = QueryData<typeof query>
```

#### lib/auth-context.tsx
```typescript
// Already correctly using .maybeSingle() and direct query results
// No changes needed - the file is correct
```

### 2. Hooks

#### hooks/use-products.ts
```typescript
// Line 188-191: Fix category reduce with proper null checking
const categoryCount = data.reduce((acc: Record<string, number>, item) => {
-  acc[item.category] = (acc[item.category] || 0) + 1
+  if (item && item.category) {
+    acc[item.category] = (acc[item.category] || 0) + 1
+  }
  return acc
}, {})
```

### 3. Middleware

#### middleware.ts
```typescript
// Already correctly using .maybeSingle() and accessing user.role directly
// No changes needed - the file is correct
```

### 4. API Routes Pattern

For all API routes, apply this pattern:

```typescript
// BEFORE (causing type errors):
const { data: targetUser, error: fetchError } = await supabase
  .from('users')
  .select('*')
  .eq('id', id)
  .single()

// AFTER (with proper type inference):
const { data: targetUser, error: fetchError } = await supabase
  .from('users')
  .select('*')
  .eq('id', id)
  .maybeSingle()  // Use .maybeSingle() instead of .single()
```

## Files to Update

The following files need the `.single()` → `.maybeSingle()` conversion:

1. **app/api/admin/users/[id]/verify/route.ts**
2. **app/api/admin/users/route.ts**
3. **app/api/admin/verification/[requestId]/review/route.ts**
4. **app/api/auth/sign-in/route.ts**
5. **app/api/checkout/route.ts**
6. **app/api/commissions/route.ts**
7. **app/api/influencer/shop/[id]/route.ts**
8. **app/api/influencer/shop/route.ts**
9. **app/api/onboarding/brand/route.ts**
10. **app/api/onboarding/influencer/route.ts**
11. **app/api/orders/[id]/route.ts**
12. **app/api/products/[id]/route.ts**
13. **app/api/products/import/route.ts**
14. **app/api/shop/[handle]/route.ts**

## Implementation Script

Run this to apply all fixes systematically:

```bash
# Create backup
git add -A && git commit -m "Pre-TypeScript fix backup"

# Apply fixes (see individual file patches below)
```

## Key Principles Applied

1. **Query Inference**: Let TypeScript infer types from queries naturally
2. **Use .maybeSingle()**: For queries that might return null (safer than .single())
3. **No Type Casting**: Remove all `as` casts and let inference work
4. **Runtime Declaration**: Add `export const runtime = 'nodejs'` for Node-specific routes
5. **Null Checks**: Always check if data exists before accessing properties
