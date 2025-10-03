Test Suite Configuration & Debugging Guide

## 📦 Installation Requirements

```bash
# Install test dependencies
pnpm add -D @playwright/test @axe-core/playwright

# Install Playwright browsers
pnpm exec playwright install --with-deps
```

## ⚙️ Playwright Configuration

Update your `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run sequentially to avoid auth conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],
  
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

## 🔐 Environment Variables

Create `.env.test.local`:

```bash
# Test Credentials
TEST_SUPPLIER_EMAIL=test.supplier@test.local
TEST_SUPPLIER_PASSWORD=SupplierPassword123!
TEST_INFLUENCER_EMAIL=test.influencer@test.local
TEST_INFLUENCER_PASSWORD=InfluencerPassword123!

# Test Shop
TEST_SHOP_HANDLE=test-shop

# Base URL
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000

# Database (test instance)
DATABASE_URL=postgresql://user:pass@localhost:5432/wonlink_test

# Supabase (test project)
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-test-anon-key
```

## 🧪 Test Execution Commands

```bash
# Run all tests
pnpm test:e2e

# Run specific test file
pnpm test:e2e -- tests/e2e/auth/role-based-routing.spec.ts

# Run tests in UI mode (interactive)
pnpm test:e2e --ui

# Run tests in debug mode
pnpm test:e2e --debug

# Run with headed browser
pnpm test:e2e --headed

# Run specific project (browser)
pnpm test:e2e --project=chromium

# Update visual snapshots
pnpm test:e2e --update-snapshots

# Generate HTML report
pnpm test:e2e --reporter=html
npx playwright show-report
```

## 🐛 Debugging Dashboard Routing Issues

### Step 1: Verify Middleware Logic

Create `tests/debug/middleware-test.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('Debug middleware routing', async ({ page }) => {
  // Capture all network requests
  page.on('request', request => {
    console.log('REQUEST:', request.method(), request.url());
  });
  
  page.on('response', response => {
    console.log('RESPONSE:', response.status(), response.url());
  });

  // Login as supplier
  await page.goto('/sign-in');
  await page.fill('input[name="email"]', 'supplier@test.local');
  await page.fill('input[name="password"]', 'password123');
  
  // Log cookies before submit
  console.log('Cookies before submit:', await page.context().cookies());
  
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  
  // Log final URL
  console.log('Final URL:', page.url());
  
  // Log cookies after login
  console.log('Cookies after login:', await page.context().cookies());
  
  // Check session endpoint
  const sessionResponse = await page.request.get('/api/auth/session');
  const session = await sessionResponse.json();
  console.log('Session data:', JSON.stringify(session, null, 2));
});
```

### Step 2: Verify Session Persistence

Create `tests/debug/session-persistence.spec.ts`:

```typescript
import { test } from '@playwright/test';

test('Debug session across page loads', async ({ page }) => {
  await page.goto('/sign-in');
  await page.fill('input[name="email"]', 'supplier@test.local');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/dashboard/);
  
  // Get initial session
  let response = await page.request.get('/api/auth/session');
  let session = await response.json();
  console.log('Session after login:', session);
  
  // Navigate to home
  await page.goto('/');
  
  // Check session again
  response = await page.request.get('/api/auth/session');
  session = await response.json();
  console.log('Session after navigation:', session);
  
  // Navigate back to dashboard
  await page.goto('/dashboard/supplier');
  
  // Check session again
  response = await page.request.get('/api/auth/session');
  session = await response.json();
  console.log('Session at dashboard:', session);
});
```

### Step 3: Verify Onboarding Redirect

Create `tests/debug/onboarding-redirect.spec.ts`:

```typescript
import { test } from '@playwright/test';

test('Debug onboarding completion redirect', async ({ page }) => {
  // Sign up
  await page.goto('/sign-up');
  const timestamp = Date.now();
  
  await page.fill('input[name="email"]', `debug-${timestamp}@test.local`);
  await page.fill('input[name="password"]', 'Password123!');
  await page.click('text=/supplier/i');
  
  // Track navigation
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      console.log('Navigated to:', frame.url());
    }
  });
  
  await page.click('button[type="submit"]');
  
  // Complete onboarding steps
  await page.waitForURL(/\/onboarding/);
  console.log('At onboarding:', page.url());
  
  // Fill step 1
  await page.fill('input[name="businessName"]', 'Test Co');
  await page.click('button:has-text("Next")');
  
  // Upload docs
  await page.setInputFiles('input[type="file"]', 'tests/fixtures/test.pdf');
  
  // Click complete and track redirect
  await page.click('button:has-text("Complete")');
  
  await page.waitForTimeout(2000);
  
  console.log('Final URL after onboarding:', page.url());
  
  // Check session
  const response = await page.request.get('/api/auth/session');
  const session = await response.json();
  console.log('Session after onboarding:', JSON.stringify(session, null, 2));
});
```

## 🔍 Common Issues & Solutions

### Issue 1: Wrong Dashboard After Login

**Symptoms:**
- Supplier sees influencer dashboard
- Influencer sees supplier dashboard

**Debug Steps:**
1. Check middleware redirect logic
2. Verify session contains correct role
3. Check if role is set during signup/onboarding
4. Verify RLS policies return correct user role

**Check:**
```typescript
// In middleware.ts
const session = await getSession(request);
console.log('User role in middleware:', session?.user?.role);

// Redirect logic
if (session?.user?.role === 'supplier') {
  return NextResponse.redirect('/dashboard/supplier');
} else if (session?.user?.role === 'influencer') {
  return NextResponse.redirect('/dashboard/influencer');
}
```

### Issue 2: Session Not Persisting

**Symptoms:**
- User logs in but redirected back to login
- Session lost on page refresh

**Debug Steps:**
1. Check cookie settings (httpOnly, secure, sameSite)
2. Verify JWT secret is set
3. Check cookie domain/path
4. Verify session storage (database/JWT)

**Check:**
```typescript
// In auth config
cookies: {
  sessionToken: {
    name: 'session-token',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production'
    }
  }
}
```

### Issue 3: Onboarding Doesn't Set Role

**Symptoms:**
- User completes onboarding but has no role
- Dashboard shows blank/error

**Debug Steps:**
1. Check user update logic in onboarding completion
2. Verify database schema has role column
3. Check if role is included in session callback

**Check:**
```typescript
// In onboarding completion handler
await supabase
  .from('users')
  .update({ 
    role: 'supplier',
    onboarding_completed: true 
  })
  .eq('id', userId);

// In auth session callback
callbacks: {
  async session({ session, user, token }) {
    session.user.role = user.role || token.role;
    return session;
  }
}
```

### Issue 4: Checkout UI Elements Not Found

**Symptoms:**
- Tests fail with "element not found"
- Buttons/inputs not clickable

**Debug Steps:**
1. Check if elements are hidden by CSS (opacity: 0, display: none)
2. Verify z-index stacking
3. Check if elements are inside shadow DOM
4. Verify animations are complete

**Solutions:**
```typescript
// Wait for animations
await page.waitForTimeout(300);

// Check if element is actually visible
const isVisible = await page.locator('button').isVisible();

// Get computed styles
const styles = await page.locator('button').evaluate(el => {
  const computed = window.getComputedStyle(el);
  return {
    display: computed.display,
    opacity: computed.opacity,
    visibility: computed.visibility
  };
});
```

## 📊 Test Coverage Report

Generate coverage report:

```bash
# Run tests with coverage
pnpm test:e2e --coverage

# View report
open coverage/index.html
```

## 🎯 Test Execution Matrix

| Test Suite | Purpose | Run Frequency |
|------------|---------|---------------|
| `role-based-routing.spec.ts` | Verify dashboard routing | Every commit |
| `complete-flow-role-verification.spec.ts` | Onboarding flow | Before deploy |
| `checkout-flow.spec.ts` | Purchase flow | Every commit |
| `middleware-auth.spec.ts` | Auth protection | Every commit |
| `session-verification.spec.ts` | Session integrity | Daily |
| `visual-a11y-tests.spec.ts` | UI/Accessibility | Before deploy |

## 🚀 CI/CD Integration

Add to `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Install Playwright
        run: pnpm exec playwright install --with-deps
      
      - name: Run E2E tests
        env:
          TEST_SUPPLIER_EMAIL: ${{ secrets.TEST_SUPPLIER_EMAIL }}
          TEST_SUPPLIER_PASSWORD: ${{ secrets.TEST_SUPPLIER_PASSWORD }}
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
        run: pnpm test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## 📝 Recommended Next Steps

1. **Run diagnostic tests first:**
   ```bash
   pnpm test:e2e -- tests/debug/
   ```

2. **Check session and role assignment:**
   ```bash
   pnpm test:e2e -- tests/e2e/api/session-verification.spec.ts
   ```

3. **Verify routing logic:**
   ```bash
   pnpm test:e2e -- tests/e2e/auth/role-based-routing.spec.ts
   ```

4. **Test complete flows:**
   ```bash
   pnpm test:e2e -- tests/e2e/onboarding/
   ```

5. **Review test report:**
   ```bash
   npx playwright show-report
   ```

## 🔧 Quick Fixes Checklist

- [ ] Verify middleware has correct role-to-route mapping
- [ ] Check session callback includes role in session object
- [ ] Ensure onboarding completion updates user role in database
- [ ] Verify cookies are set with correct domain/path
- [ ] Check RLS policies return user role correctly
- [ ] Confirm redirect URLs are correct after onboarding
- [ ] Test with cleared cache/cookies
- [ ] Verify environment variables are set correctly
- [ ] Check for any cached routing in browser
- [ ] Review auth provider configuration