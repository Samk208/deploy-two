#!/usr/bin/env node
/**
 * Script to refactor waits and remove silent catches in
 * "Dashboard Build/Tests/Checkout Visual & Accessibility Tests2.md".
 * It performs targeted, context-aware string replacements observed in the file.
 */
import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('Dashboard Build/Tests/Checkout Visual & Accessibility Tests2.md');
if (!fs.existsSync(file)) {
  console.error('File not found:', file);
  process.exit(1);
}

let src = fs.readFileSync(file, 'utf8');
let changed = false;

function replaceOnce(find, replace) {
  const before = src;
  src = src.replace(find, replace);
  if (src !== before) changed = true;
}

// 1) Remove silent catches for Add to Cart clicks with assertion and click
replaceOnce(
  `await page.click('button:has-text("Add to Cart")').catch(() => {});`,
  `const addToCart = page.locator('button:has-text("Add to Cart")').first();
    await expect(addToCart).toBeVisible();
    await expect(addToCart).toBeEnabled();
    await addToCart.click();`
);

// Subsequent occurrences
replaceOnce(
  `await page.click('button:has-text("Add to Cart")').catch(() => {});
    await page.waitForTimeout(500);`,
  `const addBtn = page.locator('button:has-text("Add to Cart")').first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();
    await page.waitForLoadState('networkidle');`
);

// Another block in focus trap test
replaceOnce(
  `await page.click('button:has-text("Add to Cart")').catch(() => {});
    await page.waitForTimeout(500);`,
  `const addBtn3 = page.locator('button:has-text("Add to Cart")').first();
    await expect(addBtn3).toBeVisible();
    await addBtn3.click();
    await page.waitForLoadState('networkidle');`
);

// Images alt text block
replaceOnce(
  `await page.click('button:has-text("Add to Cart")').catch(() => {});`,
  `const addBtn4 = page.locator('button:has-text("Add to Cart")').first();
    await expect(addBtn4).toBeVisible();
    await addBtn4.click();`
);

// Cart updates announced block
replaceOnce(
  `await page.click('button:has-text("Add to Cart")').catch(() => {});
    await page.waitForTimeout(500);`,
  `const addBtn5 = page.locator('button:has-text("Add to Cart")').first();
    await expect(addBtn5).toBeVisible();
    await addBtn5.click();
    await page.waitForLoadState('networkidle');`
);

// Modal close buttons block
replaceOnce(
  `await page.click('button:has-text("Add to Cart")').catch(() => {});`,
  `const addBtn6 = page.locator('button:has-text("Add to Cart")').first();
    await expect(addBtn6).toBeVisible();
    await addBtn6.click();`
);

// Cart quantity controls block
replaceOnce(
  `await page.click('button:has-text("Add to Cart")').catch(() => {});`,
  `const addBtn7 = page.locator('button:has-text("Add to Cart")').first();
    await expect(addBtn7).toBeVisible();
    await addBtn7.click();`
);

// 2) Replace waitForTimeout after clicking cart with wait for dialog visible
replaceOnce(
  `await cartButton.click();
    await page.waitForTimeout(300);`,
  `await expect(cartButton).toBeVisible();
    await cartButton.click();
    await page.locator('[role="dialog"], [data-testid="cart-sheet"]').first().waitFor({ state: 'visible' });`
);

// Other occurrences where role="dialog" exists
replaceOnce(
  `await cartButton.click();
    await page.waitForTimeout(300);`,
  `await expect(cartButton).toBeVisible();
    await cartButton.click();
    await page.locator('[role="dialog"]').first().waitFor({ state: 'visible' });`
);

// 3) Replace route handler artificial delay using Promise-based timeout
replaceOnce(
  `await page.route('**/api/checkout/**', async (route) => {
      await page.waitForTimeout(2000); // Artificial delay
      await route.continue();
    });`,
  `await page.route('**/api/checkout/**', async (route) => {
      await new Promise(r => setTimeout(r, 2000)); // Artificial delay
      await route.continue();
    });`
);

// 4) Replace submit catches and timeouts with visible + wait for error selectors
replaceOnce(
  `await page.click('button[type="submit"], button:has-text("Complete Order")').catch(() => {});
    await page.waitForTimeout(500);`,
  `const submit = page.locator('button[type="submit"], button:has-text("Complete Order")').first();
    await expect(submit).toBeVisible();
    await submit.click();
    await page.waitForSelector('[role="alert"], .error, [aria-invalid="true"]');`
);

replaceOnce(
  `await page.click('button[type="submit"]').catch(() => {});
    await page.waitForTimeout(500);`,
  `await page.click('button[type="submit"]');
    await page.waitForSelector('[aria-invalid="true"], [role="alert"], .error');`
);

// 5) In focus trap loop, replace tiny timeout with a microtask tick
replaceOnce(
  `await page.keyboard.press('Tab');
      await page.waitForTimeout(100);`,
  `await page.keyboard.press('Tab');
      await page.waitForFunction(() => true);`
);

if (!changed) {
  console.log('No known patterns were updated. The file may have changed or patches already applied.');
  process.exit(0);
}

fs.writeFileSync(file, src);
console.log('Patched checkout tests:', file);
