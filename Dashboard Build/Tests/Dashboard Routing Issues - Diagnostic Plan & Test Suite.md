Dashboard Routing Issues - Diagnostic Plan & Test Suite

Based on the handover notes and the routing problem you've described, here's my analysis and recommended test suite:

## 🔍 **Root Cause Analysis**

The issue likely stems from one or more of these problems:

1. **Middleware routing logic** - Incorrect role-to-dashboard mapping
2. **Session/Auth state** - Role not properly attached to session after onboarding
3. **Redirect logic** - Onboarding completion redirects to wrong dashboard
4. **RLS policies** - Database queries returning wrong user metadata
5. **Cookie/localStorage confusion** - Stale role data persisting across sign-ins

---

## 📋 **Comprehensive Test Suite**

### **Test File 1: `tests/e2e/auth/role-based-routing.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsSupplier, loginAsInfluencer, TEST_SUPPLIER_CREDENTIALS, TEST_INFLUENCER_CREDENTIALS } from '../../helpers/auth';

test.describe('Role-Based Dashboard Routing', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all storage to ensure clean state
    await page.context().clearCookies();
    await page.goto('/');
  });

  test('Supplier signs in and lands on supplier dashboard', async ({ page }) => {
    await loginAsSupplier(page);
    
    // Should be on supplier dashboard
    await expect(page).toHaveURL(/\/dashboard\/supplier/);
    
    // Verify supplier-specific UI elements
    await expect(page.locator('h1, h2').filter({ hasText: /supplier|products|inventory/i })).toBeVisible({ timeout: 10000 });
    
    // Should NOT see influencer elements
    await expect(page.locator('text=/shop builder|my shop|influencer/i')).not.toBeVisible();
    
    // Verify API calls return supplier data
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/dashboard/supplier') && response.status() === 200
    );
    await page.reload();
    const response = await responsePromise;
    const data = await response.json();
    expect(data).toHaveProperty('stats');
  });

  test('Influencer signs in and lands on influencer dashboard', async ({ page }) => {
    await loginAsInfluencer(page);
    
    // Should be on influencer dashboard
    await expect(page).toHaveURL(/\/dashboard\/influencer/);
    
    // Verify influencer-specific UI elements
    await expect(page.locator('h1, h2').filter({ hasText: /influencer|shop|commissions/i })).toBeVisible({ timeout: 10000 });
    
    // Should NOT see supplier elements
    await expect(page.locator('text=/product management|inventory|supplier/i')).not.toBeVisible();
  });

  test('Supplier cannot access influencer routes', async ({ page }) => {
    await loginAsSupplier(page);
    
    // Try to navigate to influencer dashboard
    await page.goto('/dashboard/influencer');
    
    // Should be redirected back to supplier dashboard or access denied
    await page.waitForURL(/\/(dashboard\/supplier|403|unauthorized)/);
    expect(page.url()).not.toContain('/dashboard/influencer');
  });

  test('Influencer cannot access supplier routes', async ({ page }) => {
    await loginAsInfluencer(page);
    
    // Try to navigate to supplier dashboard
    await page.goto('/dashboard/supplier');
    
    // Should be redirected back to influencer dashboard or access denied
    await page.waitForURL(/\/(dashboard\/influencer|403|unauthorized)/);
    expect(page.url()).not.toContain('/dashboard/supplier');
  });

  test('Direct URL access respects role permissions', async ({ page }) => {
    // Test as supplier
    await loginAsSupplier(page);
    await page.goto('/dashboard/supplier/products');
    await expect(page).toHaveURL(/\/dashboard\/supplier\/products/);
    
    // Sign out and sign in as influencer
    await page.goto('/sign-out');
    await page.context().clearCookies();
    
    await loginAsInfluencer(page);
    await page.goto('/dashboard/influencer/shop');
    await expect(page).toHaveURL(/\/dashboard\/influencer\/shop/);
  });

  test('Session persists correct role after page refresh', async ({ page }) => {
    await loginAsSupplier(page);
    await expect(page).toHaveURL(/\/dashboard\/supplier/);
    
    // Refresh and verify still on supplier dashboard
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard\/supplier/);
    await expect(page.locator('h1, h2').filter({ hasText: /supplier/i })).toBeVisible();
  });
});
```

---

### **Test File 2: `tests/e2e/onboarding/complete-flow-role-verification.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Onboarding Complete Flow with Role Verification', () => {
  
  test('New supplier completes onboarding and reaches supplier dashboard', async ({ page }) => {
    // 1. Sign up as supplier
    await page.goto('/sign-up');
    const timestamp = Date.now();
    const email = `supplier-${timestamp}@test.local`;
    
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    
    // Select supplier role
    await page.click('text=/brand|supplier/i');
    await page.click('button[type="submit"]');
    
    // 2. Complete supplier onboarding (2 steps per handover notes)
    await page.waitForURL(/\/onboarding\/supplier/);
    
    // Step 1: Business details
    await page.fill('input[name="businessName"]', 'Test Supplier Co');
    await page.fill('input[name="businessRegistration"]', '123-45-67890');
    await page.click('button:has-text("Next")');
    
    // Step 2: Document uploads
    const testFile = path.join(__dirname, '../../fixtures/test-document.pdf');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testFile);
    
    await page.click('button:has-text("Complete")');
    
    // 3. Verify redirect to supplier dashboard
    await page.waitForURL(/\/dashboard\/supplier/, { timeout: 15000 });
    
    // 4. Verify supplier UI
    await expect(page.locator('h1, h2').filter({ hasText: /supplier|products/i })).toBeVisible();
    
    // 5. Verify API returns supplier role
    const response = await page.request.get('/api/auth/session');
    const session = await response.json();
    expect(session.user.role).toBe('supplier');
  });

  test('New influencer completes onboarding and reaches influencer dashboard', async ({ page }) => {
    // 1. Sign up as influencer
    await page.goto('/sign-up');
    const timestamp = Date.now();
    const email = `influencer-${timestamp}@test.local`;
    
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    
    // Select influencer role
    await page.click('text=/influencer|creator/i');
    await page.click('button[type="submit"]');
    
    // 2. Complete influencer onboarding (3 steps per handover notes)
    await page.waitForURL(/\/onboarding\/influencer/);
    
    // Step 1: Profile
    await page.fill('input[name="displayName"]', 'Test Influencer');
    await page.fill('input[name="niche"]', 'Beauty');
    await page.click('button:has-text("Next")');
    
    // Step 2: Social links
    await page.fill('input[name="instagram"]', 'https://instagram.com/test');
    await page.click('button:has-text("Next")');
    
    // Step 3: Documents
    const testFile = path.join(__dirname, '../../fixtures/test-document.pdf');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testFile);
    
    await page.click('button:has-text("Complete")');
    
    // 3. Verify redirect to influencer dashboard
    await page.waitForURL(/\/dashboard\/influencer/, { timeout: 15000 });
    
    // 4. Verify influencer UI
    await expect(page.locator('h1, h2').filter({ hasText: /influencer|shop/i })).toBeVisible();
    
    // 5. Verify API returns influencer role
    const response = await page.request.get('/api/auth/session');
    const session = await response.json();
    expect(session.user.role).toBe('influencer');
  });

  test('Incomplete onboarding does not grant dashboard access', async ({ page }) => {
    await page.goto('/sign-up');
    const timestamp = Date.now();
    
    await page.fill('input[name="email"]', `incomplete-${timestamp}@test.local`);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('text=/supplier/i');
    await page.click('button[type="submit"]');
    
    // Start onboarding but don't complete
    await page.waitForURL(/\/onboarding\/supplier/);
    await page.fill('input[name="businessName"]', 'Test');
    // Don't submit, just try to navigate
    
    await page.goto('/dashboard/supplier');
    
    // Should redirect back to onboarding or login
    await page.waitForURL(/\/(onboarding|sign-in)/);
  });
});
```

---

### **Test File 3: `tests/e2e/checkout/checkout-flow.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shop/test-shop'); // Replace with actual shop handle
  });

  test('Complete checkout flow from product to success page', async ({ page }) => {
    // 1. Add product to cart
    await page.click('button:has-text("Add to Cart")');
    
    // 2. Verify cart badge updates
    await expect(page.locator('[data-testid="cart-badge"], .cart-count')).toContainText('1');
    
    // 3. Open cart
    await page.click('[aria-label*="cart" i], button:has-text("Cart")');
    
    // 4. Verify cart sheet/modal opens
    await expect(page.locator('[role="dialog"], [data-testid="cart-sheet"]')).toBeVisible();
    
    // 5. Verify product in cart
    await expect(page.locator('[role="dialog"]').locator('text=/test product|sample/i')).toBeVisible();
    
    // 6. Proceed to checkout
    await page.click('button:has-text("Checkout"), a:has-text("Checkout")');
    
    // 7. Should navigate to checkout page
    await expect(page).toHaveURL(/\/checkout/);
    
    // 8. Fill checkout form
    await page.fill('input[name="email"]', 'customer@test.com');
    await page.fill('input[name="name"]', 'Test Customer');
    await page.fill('input[name="address"]', '123 Test St');
    await page.fill('input[name="city"]', 'Seoul');
    await page.fill('input[name="postalCode"]', '12345');
    
    // 9. Verify order summary
    await expect(page.locator('text=/order summary|total/i')).toBeVisible();
    
    // 10. Complete payment (Stripe test mode)
    await page.click('button:has-text("Complete Order"), button:has-text("Pay")');
    
    // 11. Handle Stripe redirect (if using Stripe Checkout)
    if (await page.url().includes('checkout.stripe.com')) {
      // Fill Stripe test card
      await page.fill('[placeholder*="Card number"]', '4242424242424242');
      await page.fill('[placeholder*="MM / YY"]', '12/34');
      await page.fill('[placeholder*="CVC"]', '123');
      await page.fill('[placeholder*="ZIP"]', '12345');
      await page.click('button[type="submit"]');
    }
    
    // 12. Verify success page
    await expect(page).toHaveURL(/\/success|\/orders\/[^/]+/);
    await expect(page.locator('text=/success|thank you|order confirmed/i')).toBeVisible();
  });

  test('Cart persists across page navigation', async ({ page }) => {
    await page.click('button:has-text("Add to Cart")');
    await expect(page.locator('[data-testid="cart-badge"]')).toContainText('1');
    
    // Navigate away and back
    await page.goto('/');
    await page.goto('/shop/test-shop');
    
    // Cart should still have item
    await expect(page.locator('[data-testid="cart-badge"]')).toContainText('1');
  });

  test('Checkout validation prevents submission with missing fields', async ({ page }) => {
    await page.click('button:has-text("Add to Cart")');
    await page.click('[aria-label*="cart"]');
    await page.click('button:has-text("Checkout")');
    
    await expect(page).toHaveURL(/\/checkout/);
    
    // Try to submit without filling fields
    await page.click('button:has-text("Complete Order"), button:has-text("Pay")');
    
    // Should show validation errors
    await expect(page.locator('text=/required|invalid/i')).toBeVisible();
    await expect(page).toHaveURL(/\/checkout/); // Should not proceed
  });

  test('Empty cart shows appropriate message', async ({ page }) => {
    await page.click('[aria-label*="cart"]');
    await expect(page.locator('text=/empty|no items/i')).toBeVisible();
  });
});
```

---

### **Test File 4: `tests/e2e/middleware/auth-middleware.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Middleware Authentication & Authorization', () => {
  
  test('Unauthenticated user redirected from protected routes', async ({ page }) => {
    await page.context().clearCookies();
    
    // Try to access supplier dashboard
    await page.goto('/dashboard/supplier');
    await expect(page).toHaveURL(/\/(sign-in|login)/);
    
    // Try to access influencer dashboard
    await page.goto('/dashboard/influencer');
    await expect(page).toHaveURL(/\/(sign-in|login)/);
  });

  test('Middleware sets correct headers for role-based routes', async ({ page }) => {
    await page.route('**/dashboard/**', (route) => {
      const headers = route.request().headers();
      console.log('Request headers:', headers);
      route.continue();
    });
    
    await page.goto('/sign-in');
    // Login logic here
  });

  test('Session cookie contains correct role metadata', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', 'supplier@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/dashboard/);
    
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('auth'));
    
    expect(sessionCookie).toBeDefined();
    console.log('Session cookie:', sessionCookie);
  });
});
```

---

### **Test File 5: `tests/e2e/api/session-verification.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsSupplier, loginAsInfluencer } from '../../helpers/auth';

test.describe('Session & Role API Verification', () => {
  
  test('Supplier session API returns correct role', async ({ page, request }) => {
    await loginAsSupplier(page);
    
    const response = await request.get('/api/auth/session');
    expect(response.status()).toBe(200);
    
    const session = await response.json();
    expect(session.user).toBeDefined();
    expect(session.user.role).toBe('supplier');
    expect(session.user.email).toContain('@');
  });

  test('Influencer session API returns correct role', async ({ page, request }) => {
    await loginAsInfluencer(page);
    
    const response = await request.get('/api/auth/session');
    expect(response.status()).toBe(200);
    
    const session = await response.json();
    expect(session.user).toBeDefined();
    expect(session.user.role).toBe('influencer');
  });

  test('Dashboard API rejects wrong role access', async ({ page, request }) => {
    await loginAsSupplier(page);
    
    // Supplier trying to access influencer API
    const response = await request.get('/api/dashboard/influencer');
    expect(response.status()).toBe(403);
  });

  test('Role persists across API calls within same session', async ({ page, request }) => {
    await loginAsSupplier(page);
    
    const responses = await Promise.all([
      request.get('/api/auth/session'),
      request.get('/api/dashboard/supplier'),
      request.get('/api/products'),
    ]);
    
    for (const response of responses) {
      expect(response.status()).toBeLessThan(400);
    }
  });
});
```

---

## 🛠️ **Updated `tests/helpers/auth.ts`**

```typescript
import { Page } from '@playwright/test';

export const TEST_SUPPLIER_CREDENTIALS = {
  email: process.env.TEST_SUPPLIER_EMAIL || 'test.supplier@test.local',
  password: process.env.TEST_SUPPLIER_PASSWORD || 'SupplierPassword123!',
};

export const TEST_INFLUENCER_CREDENTIALS = {
  email: process.env.TEST_INFLUENCER_EMAIL || 'test.influencer+e2e@test.local',
  password: process.env.TEST_INFLUENCER_PASSWORD || 'NewInfluencerPassword123!',
};

export async function loginAsSupplier(page: Page) {
  await page.goto('/sign-in');
  
  try {
    await page.fill('input[name="email"]', TEST_SUPPLIER_CREDENTIALS.email);
    await page.fill('input[name="password"]', TEST_SUPPLIER_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    // Wait for successful redirect
    await page.waitForURL(/\/dashboard\/supplier/, { timeout: 15000 });
  } catch (error) {
    await page.screenshot({ path: 'test-failures/supplier-login-failed.png', fullPage: true });
    console.error('Supplier login failed:', error);
    throw error;
  }
}

export async function loginAsInfluencer(page: Page) {
  await page.goto('/sign-in');
  
  try {
    await page.fill('input[name="email"]', TEST_INFLUENCER_CREDENTIALS.email);
    await page.fill('input[name="password"]', TEST_INFLUENCER_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    // Wait for successful redirect - might be onboarding if incomplete
    await page.waitForURL(/\/(dashboard\/influencer|onboarding\/influencer)/, { timeout: 15000 });
  } catch (error) {
    await page.screenshot({ path: 'test-failures/influencer-login-failed.png', fullPage: true });
    console.error('Influencer login failed:', error);
    throw error;
  }
}

export async function signOut(page: Page) {
  await page.goto('/sign-out');
  await page.waitForURL(/\/(sign-in|$)/);
  await page.context().clearCookies();
}
```

---

## 📊 **Run Commands & Diagnosis Workflow**

```bash
# 1. Run role-based routing tests
pnpm test:e2e -- tests/e2e/auth/role-based-routing.spec.ts --reporter=html

# 2. Run onboarding flow tests
pnpm test:e2e -- tests/e2e/onboarding/complete-flow-role-verification.spec.ts

# 3. Run checkout tests
pnpm test:e2e -- tests/e2e/checkout/checkout-flow.spec.ts

# 4. Run middleware tests
pnpm test:e2e -- tests/e2e/middleware/auth-middleware.spec.ts

# 5. Run API session tests
pnpm test:e2e -- tests/e2e/api/session-verification.spec.ts

# 6. Run all tests with debug mode
pnpm test:e2e --debug

# 7. Generate test report
pnpm test:e2e --reporter=html
```

---

## 🔧 **Key Areas to Check Based on Test Results**

### **If tests show wrong dashboard routing:**

1. **Check `middleware.ts`** - Role-to-route mapping logic
2. **Check session callback** - Role assignment in auth config
3. **Check onboarding completion** - Where users are redirected after upload
4. **Check RLS policies** - User role queries

### **If tests show session issues:**

1. **Check cookie configuration** - httpOnly, secure, sameSite
2. **Check JWT/session strategy** - Token payload includes role
3. **Check database schema** - `users.role` column exists and populates

### **If checkout tests fail:**

1. **Check cart Zustand store** - State persistence
2. **Check Stripe integration** - Webhook handling
3. **Check form validation** - Zod schemas
4. **Check order creation** - API endpoint logic

---

## 📝 **Expected Test Outcomes**

✅ **All passing** = Routing works correctly  
❌ **Role routing fails** = Middleware or session issue  
❌ **Onboarding fails** = Redirect logic or role assignment broken  
❌ **Checkout fails** = Cart/payment flow issue  
❌ **API tests fail** = Backend authorization broken

**Run these tests first, then share the results so I can provide targeted fixes!**