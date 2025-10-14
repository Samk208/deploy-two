import { test, expect } from '@playwright/test';

async function collectRequests(page: import('@playwright/test').Page, predicate: (url: string) => boolean) {
  const hits: string[] = [];
  page.on('request', (req) => {
    const url = req.url();
    if (predicate(url)) hits.push(url);
  });
  return hits;
}

const isTranslateScript = (url: string) =>
  url.includes('translate.google.com/translate_a/element.js');

const noGTConsoleErrors = (msg: string) => {
  const lower = msg.toLowerCase();
  // Known flaky React/GT conflict signature
  return !(
    lower.includes('removechild') ||
    lower.includes('the node to be removed is not a child') ||
    (lower.includes('google') && lower.includes('translate'))
  );
};

// Public page: widget SHOULD load
test('home loads Google Translate script on public pages', async ({ page }) => {
  const hits = await collectRequests(page, isTranslateScript);
  const consoleErrors: string[] = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  expect(hits.length, 'translate script should be requested on public pages').toBeGreaterThan(0);
  expect(consoleErrors.filter((m) => !noGTConsoleErrors(m)), 'no GT DOM conflict errors on home').toHaveLength(0);
});

// Auth page: widget MUST NOT load
test('sign-in excludes Google Translate and form is interactive', async ({ page }) => {
  const hits = await collectRequests(page, isTranslateScript);
  const consoleErrors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });

  await page.goto('/sign-in');
  await page.waitForLoadState('networkidle');

  // Form fields should be interactable
  await page.fill('[data-testid="signin-email"]', 'test@example.com');
  await page.fill('[data-testid="signin-password"]', 'password123');

  // Do not assert successful auth; just ensure click works and page stays responsive
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.click('button[type="submit"]'),
  ]);

  expect(hits.length, 'translate script must NOT be requested on sign-in').toBe(0);
  expect(consoleErrors.filter((m) => !noGTConsoleErrors(m)), 'no GT DOM conflict errors on sign-in').toHaveLength(0);
});

// Checkout flow pages: widget MUST NOT load
test('checkout excludes Google Translate', async ({ page }) => {
  const hits = await collectRequests(page, isTranslateScript);
  await page.goto('/checkout');
  await page.waitForLoadState('networkidle');
  expect(hits.length, 'translate script must NOT be requested on checkout').toBe(0);
});

// Admin routes (may redirect if unauthenticated): widget MUST NOT load at any point
test('admin routes exclude Google Translate (across redirects)', async ({ page }) => {
  const hits = await collectRequests(page, isTranslateScript);
  await page.goto('/admin/dashboard');
  await page.waitForLoadState('networkidle');
  expect(hits.length, 'translate script must NOT be requested when visiting admin').toBe(0);
});
