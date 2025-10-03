# 🧪 Complete Test Suite Implementation Summary

## 📋 Overview

This comprehensive test suite addresses the dashboard routing issues and checkout flow problems in your One-Link application. The tests will help identify:

1. **Role-based routing failures** (supplier/influencer dashboard mix-ups)
2. **Onboarding flow issues** (incorrect redirects after document uploads)
3. **Checkout UI/CSS problems** (missing elements, broken flows)
4. **Session persistence issues** (role data not persisting)
5. **Accessibility violations** (a11y compliance)

---

## 🗂️ Test Suite Structure

### **Created Test Files:**

```
tests/
├── e2e/
│   ├── auth/
│   │   └── role-based-routing.spec.ts          # Main routing tests
│   ├── onboarding/
│   │   └── complete-flow-role-verification.spec.ts  # Onboarding flows
│   ├── checkout/
│   │   ├── checkout-flow.spec.ts               # Enhanced checkout (UI resilient)
│   │   └── checkout-visual-a11y.spec.ts        # Visual & accessibility
│   ├── middleware/
│   │   └── auth-middleware.spec.ts             # Middleware logic
│   └── api/
│       └── session-verification.spec.ts        # Session/role APIs
├── debug/
│   ├── middleware-test.spec.ts                 # Debug middleware
│   ├── session-persistence.spec.ts             # Debug sessions
│   └── onboarding-redirect.spec.ts             # Debug redirects
├── helpers/
│   └── auth.ts                                 # Login helpers (updated)
└── fixtures/
    └── test-document.pdf                       # Test upload file
```

---

## 🚀 Quick Start

### **1. Setup (One-time)**

```bash
# Run setup script
chmod +x setup-tests.sh
./setup-tests.sh

# Or manual setup:
pnpm add -D @playwright/test @axe-core/playwright
pnpm exec playwright install --with-deps
```

### **2. Configure Environment**

Update `.env.test.local`:

```bash
TEST_SUPPLIER_EMAIL=test.supplier@test.local
TEST_SUPPLIER_PASSWORD=SupplierPassword123!
TEST_INFLUENCER_EMAIL=test.influencer@test.local
TEST_INFLUENCER_PASSWORD=InfluencerPassword123!
TEST_SHOP_HANDLE=test-shop
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
```

### **3. Create Test Users**

In your database, create:
- **Supplier**: `test.supplier@test.local` with role `supplier`
- **Influencer**: `test.influencer@test.local` with role `influencer`
- Ensure both have completed onboarding (or test onboarding flow)

### **4. Run Tests**

```bash
# Run all tests
pnpm test:e2e

# Run specific test suite
pnpm test:e2e -- tests/e2e/auth/role-based-routing.spec.ts

# Run with UI (interactive)
pnpm test:e2e:ui

# Run in debug mode
pnpm test:e2e:debug

# Generate report
pnpm test:e2e:report
```

---

## 🔍 What Each Test Suite Does

### **1. Role-Based Routing Tests**
**File:** `tests/e2e/auth/role-based-routing.spec.ts`

**Tests:**
- ✅ Supplier signs in → lands on `/dashboard/supplier`
- ✅ Influencer signs in → lands on `/dashboard/influencer`
- ✅ Supplier blocked from `/dashboard/influencer`
- ✅ Influencer blocked from `/dashboard/supplier`
- ✅ Direct URL access respects permissions
- ✅ Session persists correct role after refresh

**What it catches:**
- Middleware routing logic errors
- Session role assignment issues
- Cookie persistence problems

---

### **2. Onboarding Flow Tests**
**File:** `tests/e2e/onboarding/complete-flow-role-verification.spec.ts`

**Tests:**
- ✅ New supplier completes onboarding → reaches supplier dashboard
- ✅ New influencer completes onboarding → reaches influencer dashboard
- ✅ Incomplete onboarding blocks dashboard access
- ✅ Role persists after onboarding completion

**What it catches:**
- Redirect logic after document upload
- Role not set in database after onboarding
- Session not refreshed after completion

---

### **3. Enhanced Checkout Flow Tests**
**File:** `tests/e2e/checkout/checkout-flow.spec.ts`

**Key Features:**
- **Multiple selector strategies** for each element (handles UI variations)
- **Automatic screenshot capture** at each step
- **Flexible element detection** (works with different CSS implementations)
- **Stripe redirect handling**
- **Cart persistence tests**
- **Form validation tests**

**Tests:**
- ✅ Complete checkout: Product → Cart → Checkout → Success
- ✅ Cart persists across navigation
- ✅ Validation prevents empty submissions
- ✅ Empty cart shows appropriate message
- ✅ Quantity controls work
- ✅ Remove from cart works
- ✅ Price calculations are correct

**What it catches:**
- Missing cart buttons (CSS issues)
- Incorrect selectors (data-testid vs aria-label)
- Hidden elements (opacity, z-index issues)
- Animation timing issues
- Payment flow breaks

---

### **4. Visual & Accessibility Tests**
**File:** `tests/e2e/checkout/checkout-visual-a11y.spec.ts`

**Tests:**
- ✅ No WCAG violations (AA standard)
- ✅ Color contrast compliance
- ✅ Form labels properly associated
- ✅ Keyboard navigation works
- ✅ Focus trap in modals
- ✅ Screen reader announcements
- ✅ Visual regression (screenshots)
- ✅ Responsive layouts (mobile/tablet/desktop)

**What it catches:**
- Missing alt text
- Poor color contrast
- Missing form labels
- Broken keyboard navigation
- Layout shifts

---

### **5. Session & API Tests**
**File:** `tests/e2e/api/session-verification.spec.ts`

**Tests:**
- ✅ Session API returns correct supplier role
- ✅ Session API returns correct influencer role
- ✅ Dashboard API rejects wrong role access
- ✅ Role persists across multiple API calls

**What it catches:**
- Session not including role
- API auth middleware failures
- JWT token issues

---

## 🐛 Debug Tests

Run these if main tests fail:

```bash
# Debug middleware
pnpm test:e2e -- tests/debug/middleware-test.spec.ts

# Debug session
pnpm test:e2e -- tests/debug/session-persistence.spec.ts

# Debug onboarding
pnpm test:e2e -- tests/debug/onboarding-redirect.spec.ts
```

These tests log detailed info:
- All network requests
- Cookie values
- Session data
- Redirect URLs

---

## 📊 Diagnostic Report

Run comprehensive diagnostics:

```bash
pnpm test:diagnostics
```

This generates:
- `diagnostic-report.html` - Visual report with recommendations
- `diagnostic-output/report.json` - Machine-readable results
- `diagnostic-output/*-error.log` - Detailed error logs

**Report includes:**
- ✅ Test results summary
- ❌ Failed test details
- 💡 Specific recommendations based on failures

---

## 🔧 Common Issues & Solutions

### **Issue: Supplier sees Influencer Dashboard**

**Run:**
```bash
pnpm test:e2e -- tests/e2e/auth/role-based-routing.spec.ts
pnpm test:e2e -- tests/debug/middleware-test.spec.ts
```

**Check:**
1. `middleware.ts` - Role-to-route mapping
2. Session callback - Role in JWT/session
3. Onboarding completion - Role update in DB

**Fix locations:**
- `middleware.ts` - Redirect logic
- `lib/auth.ts` or auth config - Session callbacks
- Onboarding API - User role update

---

### **Issue: Checkout buttons not found**

**Run:**
```bash
pnpm test:e2e -- tests/e2e/checkout/checkout-flow.spec.ts --headed
```

**Check test screenshots:**
- `test-screenshots/checkout-*.png`

**Common causes:**
- CSS hiding elements (`display: none`, `opacity: 0`)
- Wrong `data-testid` attributes
- Z-index stacking issues
- Animation not complete

**Fix:**
- Add proper `data-testid` attributes
- Ensure buttons are visible
- Check Tailwind classes
- Review shadcn/ui component props

---

### **Issue: Session lost on refresh**

**Run:**
```bash
pnpm test:e2e -- tests/debug/session-persistence.spec.ts
```

**Check:**
1. Cookie settings (httpOnly, sameSite, secure)
2. JWT secret configured
3. Session storage (DB vs JWT)

**Fix locations:**
- Auth config - Cookie options
- `.env` - JWT_SECRET
- Database - Session table

---

### **Issue: Onboarding redirects to wrong dashboard**

**Run:**
```bash
pnpm test:e2e -- tests/debug/onboarding-redirect.spec.ts
pnpm test:e2e -- tests/e2e/onboarding/complete-flow-role-verification.spec.ts
```

**Check:**
1. Onboarding completion handler - Role update
2. Redirect URL after completion
3. Session refresh after role update

**Fix locations:**
- `app/api/onboarding/complete/route.ts` - User update
- Onboarding client component - Redirect logic
- Auth config - Session callback

---

## 📈 Test Execution Strategy

### **Phase 1: Quick Smoke Test (2-3 minutes)**
```bash
# Run core routing tests
pnpm test:e2e -- tests/e2e/auth/role-based-routing.spec.ts

# Run session tests
pnpm test:e2e -- tests/e2e/api/session-verification.spec.ts
```

**Goal:** Confirm basic auth/routing works

---

### **Phase 2: Full Flow Testing (10-15 minutes)**
```bash
# Run all main tests
pnpm test:e2e -- tests/e2e/

# Skip debug tests
```

**Goal:** Validate all user flows

---

### **Phase 3: Debug Failing Tests (5-10 minutes)**
```bash
# Run specific debug test based on Phase 2 failures
pnpm test:e2e -- tests/debug/middleware-test.spec.ts --headed --debug
```

**Goal:** Identify root cause of failures

---

### **Phase 4: Generate Report**
```bash
pnpm test:diagnostics
open diagnostic-report.html
```

**Goal:** Get actionable recommendations

---

## 🎯 Expected Test Results

### **If Dashboard Routing is Broken:**

**Failed tests:**
- ❌ `Supplier signs in and lands on supplier dashboard`
- ❌ `Influencer signs in and lands on influencer dashboard`
- ❌ `Supplier cannot access influencer routes`

**Diagnostic report will show:**
> **Authentication/Routing Issues Detected:**
> - Check middleware.ts for correct role-to-route mapping
> - Verify session callback includes user role in JWT/session
> - Ensure cookies are configured correctly
> - Review RLS policies to ensure they return user role

**Action:** Check `middleware.ts` and session configuration

---

### **If Onboarding is Broken:**

**Failed tests:**
- ❌ `New supplier completes onboarding and reaches supplier dashboard`
- ❌ `New influencer completes onboarding and reaches influencer dashboard`

**Diagnostic report will show:**
> **Onboarding Issues Detected:**
> - Verify onboarding completion handler updates user role in database
> - Check redirect logic after successful document upload
> - Ensure session is refreshed after onboarding completion

**Action:** Check onboarding completion API and redirect logic

---

### **If Checkout UI is Broken:**

**Failed tests:**
- ❌ `Complete checkout flow from product to success page`
- ❌ Cart-related tests

**Diagnostic report will show:**
> **Checkout Issues Detected:**
> - Review cart UI component selectors (may have CSS issues)
> - Check Zustand cart store state persistence
> - Verify form inputs have proper name/id attributes

**Screenshots will be saved in:**
- `test-screenshots/checkout-*.png`
- `test-failures/*.png`

**Action:** Review screenshots and fix CSS/selectors

---

## 🛠️ Key Files to Modify Based on Test Results

### **If middleware tests fail:**

**File:** `middleware.ts`
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth'; // or your auth utility

export async function middleware(request: NextRequest) {
  const session = await getSession(request);
  
  // Protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    
    const role = session.user.role;
    
    // Supplier trying to access influencer dashboard
    if (role === 'supplier' && request.nextUrl.pathname.startsWith('/dashboard/influencer')) {
      return NextResponse.redirect(new URL('/dashboard/supplier', request.url));
    }
    
    // Influencer trying to access supplier dashboard
    if (role === 'influencer' && request.nextUrl.pathname.startsWith('/dashboard/supplier')) {
      return NextResponse.redirect(new URL('/dashboard/influencer', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

---

### **If session tests fail:**

**File:** `lib/auth.ts` (or your auth config)
```typescript
import NextAuth from 'next-auth';
import { SupabaseAdapter } from '@auth/supabase-adapter';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: SupabaseAdapter(/* ... */),
  
  callbacks: {
    async session({ session, user, token }) {
      // CRITICAL: Include role in session
      if (user) {
        session.user.role = user.role;
        session.user.id = user.id;
      } else if (token) {
        session.user.role = token.role as string;
        session.user.id = token.sub as string;
      }
      
      return session;
    },
    
    async jwt({ token, user }) {
      // Store role in JWT token
      if (user) {
        token.role = user.role;
      }
      return token;
    },
  },
  
  cookies: {
    sessionToken: {
      name: 'auth-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
});
```

---

### **If onboarding tests fail:**

**File:** `app/api/onboarding/complete/route.ts`
```typescript
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  const { role } = body; // 'supplier' or 'influencer'
  
  // CRITICAL: Update user role
  const { error } = await supabase
    .from('users')
    .update({
      role,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  
  // Return success with redirect URL
  const redirectUrl = role === 'supplier' 
    ? '/dashboard/supplier' 
    : '/dashboard/influencer';
  
  return Response.json({ 
    success: true,
    redirectUrl,
  });
}
```

**File:** Onboarding client component
```typescript
'use client';

const handleComplete = async () => {
  const response = await fetch('/api/onboarding/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: userRole }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Force session refresh before redirect
    await fetch('/api/auth/session', { method: 'GET' });
    
    // Redirect to correct dashboard
    router.push(data.redirectUrl);
    router.refresh(); // Refresh server components
  }
};
```

---

### **If checkout tests fail:**

**File:** Cart component
```typescript
'use client';

export function CartSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Open shopping cart"
          data-testid="cart-button" {/* Add this */}
        >
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <Badge 
              variant="secondary" 
              data-testid="cart-badge" {/* Add this */}
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent data-testid="cart-sheet"> {/* Add this */}
        {/* Cart content */}
        
        <Button 
          onClick={handleCheckout}
          data-testid="checkout-button" {/* Add this */}
        >
          Checkout
        </Button>
      </SheetContent>
    </Sheet>
  );
}
```

**File:** Checkout form
```typescript
<form onSubmit={handleSubmit}>
  <Input
    name="email"
    type="email"
    required
    data-testid="checkout-email" {/* Add this */}
    aria-label="Email address"
  />
  
  <Input
    name="name"
    required
    data-testid="checkout-name" {/* Add this */}
    aria-label="Full name"
  />
  
  {/* Add name attributes and data-testid to all inputs */}
  
  <Button 
    type="submit"
    data-testid="submit-order" {/* Add this */}
  >
    Complete Order
  </Button>
</form>
```

---

## 📚 Additional Resources

### **Test Helpers Location:**
- `tests/helpers/auth.ts` - Login utilities
- `tests/fixtures/` - Test files (PDFs, images)

### **Generated Reports:**
- `playwright-report/` - HTML test report
- `diagnostic-report.html` - Comprehensive diagnostic
- `diagnostic-output/` - JSON reports and error logs
- `test-screenshots/` - Step-by-step screenshots
- `test-failures/` - Failure screenshots

### **Useful Commands:**
```bash
# View HTML report
pnpm test:e2e:report

# Run single test with UI
pnpm test:e2e -- tests/e2e/auth/role-based-routing.spec.ts --ui

# Debug specific test
pnpm test:e2e -- tests/e2e/checkout/checkout-flow.spec.ts --debug

# Update snapshots (visual regression)
pnpm test:e2e -- --update-snapshots

# Run on specific browser
pnpm test:e2e -- --project=firefox
pnpm test:e2e -- --project=webkit
```

---

## ✅ Success Criteria

All tests should pass with:

1. ✅ **Supplier login** → lands on `/dashboard/supplier`
2. ✅ **Influencer login** → lands on `/dashboard/influencer`
3. ✅ **Onboarding completion** → correct dashboard redirect
4. ✅ **Session persistence** → role maintained across refreshes
5. ✅ **Checkout flow** → complete purchase without errors
6. ✅ **No accessibility violations** → WCAG AA compliance
7. ✅ **Cart functionality** → add/remove/update works correctly

---

## 🚨 Next Steps

### **1. Run Initial Tests (NOW)**
```bash
# Quick setup
./setup-tests.sh

# Run core tests
pnpm test:e2e -- tests/e2e/auth/role-based-routing.spec.ts
```

### **2. Review Results**
- Check console output for failures
- Review screenshots in `test-screenshots/`
- Check diagnostic report: `open diagnostic-report.html`

### **3. Fix Issues**
- Use diagnostic recommendations
- Update files based on test failures
- Re-run tests to confirm fixes

### **4. Share Results**
Share with me:
- Test output (pass/fail summary)
- Screenshot of diagnostic report
- Any specific error messages

Then I can provide targeted fixes for your specific issues! 🎯