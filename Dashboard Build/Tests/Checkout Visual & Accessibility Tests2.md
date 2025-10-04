import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Visual Regression & Accessibility Tests for Checkout
 * Catches UI/CSS issues through screenshots and a11y validation
 */

test.describe('Checkout Visual & Accessibility Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('Checkout page has no accessibility violations', async ({ page }) => {
    const shopHandle = process.env.TEST_SHOP_HANDLE || 'test-shop';
    
    // Add item to cart
    await page.goto(`/shop/${shopHandle}`);
    const addToCart = page.locator('button:has-text("Add to Cart")').first();
    await expect(addToCart).toBeVisible();
    await expect(addToCart).toBeEnabled();
    await addToCart.click();
    
    // Navigate to checkout
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    
    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    // Log violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility Violations:');
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`- ${violation.id}: ${violation.description}`);
        console.log(`  Impact: ${violation.impact}`);
        console.log(`  Help: ${violation.helpUrl}`);
      });
    }
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Cart overlay has no accessibility violations', async ({ page }) => {
    const shopHandle = process.env.TEST_SHOP_HANDLE || 'test-shop';
    await page.goto(`/shop/${shopHandle}`);
    
    // Add to cart and open cart
    const addBtn4 = page.locator('button:has-text("Add to Cart")').first();
    await expect(addBtn4).toBeVisible();
    await addBtn4.click();
    await page.waitForTimeout(500);
    
    // Open cart
    const cartButton = page.locator('[aria-label*="cart" i], button:has-text("Cart")').first();
    await cartButton.click();
    await page.waitForTimeout(300);
    
    // Run a11y scan on cart overlay
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[role="dialog"], [data-testid="cart-sheet"]')
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Visual regression - Checkout page layout', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('checkout-page-full.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Visual regression - Empty cart state', async ({ page }) => {
    await page.goto('/');
    
    const cartButton = page.locator('[aria-label*="cart" i], button:has-text("Cart")').first();
    await cartButton.click();
    await page.waitForTimeout(300);
    
    // Screenshot of empty cart
    const cartDialog = page.locator('[role="dialog"]').first();
    await expect(cartDialog).toHaveScreenshot('empty-cart-state.png', {
      animations: 'disabled',
    });
  });

  test('Visual regression - Cart with items', async ({ page }) => {
    const shopHandle = process.env.TEST_SHOP_HANDLE || 'test-shop';
    await page.goto(`/shop/${shopHandle}`);
    
    const addBtn6 = page.locator('button:has-text("Add to Cart")').first();
    await expect(addBtn6).toBeVisible();
    await addBtn6.click();
    await page.waitForTimeout(500);
    
    const cartButton = page.locator('[aria-label*="cart" i], button:has-text("Cart")').first();
    await cartButton.click();
    await page.waitForTimeout(300);
    
    const cartDialog = page.locator('[role="dialog"]').first();
    await expect(cartDialog).toHaveScreenshot('cart-with-items.png', {
      animations: 'disabled',
    });
  });

  test('Responsive layout - Checkout mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('checkout-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Responsive layout - Checkout tablet view', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('checkout-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Keyboard navigation works on checkout form', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    
    // Tab through form fields
    const formFields = ['email', 'name', 'address', 'city', 'postalCode'];
    
    for (const field of formFields) {
      await page.keyboard.press('Tab');
      
      // Check if focused element is an input
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el?.tagName,
          type: (el as HTMLInputElement)?.type,
          name: (el as HTMLInputElement)?.name,
          id: el?.id,
        };
      });
      
      console.log('Focused element:', focusedElement);
      
      // Verify focus is on an input element
      expect(['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA']).toContain(focusedElement.tagName);
    }
  });

  test('Form validation errors are visible and accessible', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    
    // Try to submit empty form
    await page.click('button[type="submit"], button:has-text("Complete Order")').catch(() => {});
    await page.waitForTimeout(500);
    
    // Check for error messages
    const errorElements = await page.locator('[role="alert"], .error, [aria-invalid="true"]').all();
    
    for (const error of errorElements) {
      // Verify error is visible
      await expect(error).toBeVisible();
      
      // Verify error has text content
      const text = await error.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
    
    // Screenshot errors
    await page.screenshot({ path: 'test-screenshots/validation-errors-visible.png', fullPage: true });
  });

  test('Focus trap works in cart modal', async ({ page }) => {
    const shopHandle = process.env.TEST_SHOP_HANDLE || 'test-shop';
    await page.goto(`/shop/${shopHandle}`);
    
    const addBtn7 = page.locator('button:has-text("Add to Cart")').first();
    await expect(addBtn7).toBeVisible();
    await addBtn7.click();
    await page.waitForTimeout(500);
    
    // Open cart
    const cartButton = page.locator('[aria-label*="cart" i], button:has-text("Cart")').first();
    await cartButton.click();
    await page.waitForTimeout(300);
    
    // Get all focusable elements in the modal
    const focusableElements = await page.locator(
      '[role="dialog"] a, [role="dialog"] button, [role="dialog"] input, [role="dialog"] select, [role="dialog"] textarea'
    ).all();
    
    expect(focusableElements.length).toBeGreaterThan(0);
    
    // Tab through all elements
    for (let i = 0; i < focusableElements.length + 2; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      // Verify focus stays within modal
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        const dialog = document.querySelector('[role="dialog"]');
        return dialog?.contains(el);
      });
      
      expect(focusedElement).toBeTruthy();
    }
  });

  test('Loading states are visible during checkout', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    
    // Fill form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="address"]', '123 Test St');
    await page.fill('input[name="city"]', 'Seoul');
    await page.fill('input[name="postalCode"]', '12345');
    
    // Intercept API call to slow it down
    await page.route('**/api/checkout/**', async (route) => {
      await page.waitForTimeout(2000); // Artificial delay
      await route.continue();
    });
    
    // Click submit and look for loading state
    const submitButton = page.locator('button[type="submit"], button:has-text("Complete Order")').first();
    await submitButton.click();
    
    // Check for loading indicators
    const loadingSelectors = [
      '[role="status"]',
      '.loading',
      '[data-loading="true"]',
      'text=/loading|processing/i',
      'svg[class*="spin"]',
      'svg[class*="animate"]',
    ];
    
    let loadingFound = false;
    for (const selector of loadingSelectors) {
      if (await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false)) {
        loadingFound = true;
        await page.screenshot({ path: 'test-screenshots/loading-state.png' });
        break;
      }
    }
    
    expect(loadingFound).toBeTruthy();
  });

  test('Success page displays order confirmation', async ({ page }) => {
    // Mock successful order
    await page.route('**/api/checkout/**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ 
          orderId: 'test-order-123',
          status: 'success' 
        }),
      });
    });
    
    await page.goto('/checkout');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="address"]', '123 Test St');
    await page.fill('input[name="city"]', 'Seoul');
    await page.fill('input[name="postalCode"]', '12345');
    
    await page.click('button[type="submit"]');
    
    // Should redirect to success page
    await page.waitForURL(/\/(success|orders)/);
    
    // Visual regression of success page
    await expect(page).toHaveScreenshot('success-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Color contrast meets WCAG AA standards', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();
    
    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );
    
    if (contrastViolations.length > 0) {
      console.log('Color contrast violations found:');
      contrastViolations.forEach(v => {
        console.log(v.nodes);
      });
    }
    
    expect(contrastViolations).toEqual([]);
  });

  test('Images have alt text', async ({ page }) => {
    const shopHandle = process.env.TEST_SHOP_HANDLE || 'test-shop';
    await page.goto(`/shop/${shopHandle}`);
    
    await page.click('button:has-text("Add to Cart")').catch(() => {});
    
    const cartButton = page.locator('[aria-label*="cart" i], button:has-text("Cart")').first();
    await cartButton.click();
    await page.waitForTimeout(300);
    
    // Check all images in cart
    const images = await page.locator('[role="dialog"] img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeDefined();
      // Alt can be empty for decorative images, but must be present
      expect(alt).not.toBeNull();
    }
  });

  test('Cart updates are announced to screen readers', async ({ page }) => {
    const shopHandle = process.env.TEST_SHOP_HANDLE || 'test-shop';
    await page.goto(`/shop/${shopHandle}`);
    
    // Check for aria-live region
    const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').all();
    
    await page.click('button:has-text("Add to Cart")').catch(() => {});
    await page.waitForTimeout(500);
    
    // Verify announcement was made
    let announcementFound = false;
    for (const region of liveRegions) {
      const text = await region.textContent();
      if (text && text.toLowerCase().includes('added')) {
        announcementFound = true;
        break;
      }
    }
    
    // If no live region found, check for toast/notification
    const toastSelectors = [
      '[role="status"]',
      '.toast',
      '[data-toast]',
      '[data-sonner-toast]',
    ];
    
    for (const selector of toastSelectors) {
      if (await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false)) {
        announcementFound = true;
        break;
      }
    }
    
    expect(announcementFound).toBeTruthy();
  });

  test('Form labels are properly associated', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    
    const inputs = await page.locator('input[type="text"], input[type="email"]').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      // Input must have either: id with associated label, aria-label, or aria-labelledby
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        if (label === 0 && !ariaLabel && !ariaLabelledBy) {
          const name = await input.getAttribute('name');
          throw new Error(`Input field "${name}" has no associated label`);
        }
      } else if (!ariaLabel && !ariaLabelledBy) {
        const name = await input.getAttribute('name');
        throw new Error(`Input field "${name}" has no label mechanism`);
      }
    }
  });

  test('Disabled state is visually distinct', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    
    // Get submit button
    const submitButton = page.locator('button[type="submit"]').first();
    
    // Take screenshot of initial state (may be disabled)
    await submitButton.screenshot({ path: 'test-screenshots/button-initial-state.png' });
    
    // Fill some fields but not all
    await page.fill('input[name="email"]', 'test@example.com');
    
    // Button might still be disabled
    const isDisabled = await submitButton.isDisabled();
    
    if (isDisabled) {
      // Verify disabled attribute is present
      const disabled = await submitButton.getAttribute('disabled');
      expect(disabled).not.toBeNull();
      
      // Verify aria-disabled
      const ariaDisabled = await submitButton.getAttribute('aria-disabled');
      expect(ariaDisabled === 'true' || disabled !== null).toBeTruthy();
    }
  });

  test('Error states are clearly visible', async ({ page }) => {
    await page.goto('/checkout');
    
    // Fill invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="name"]', 'Test');
    
    // Trigger validation
    await page.click('button[type="submit"]').catch(() => {});
    await page.waitForTimeout(500);
    
    // Check for error styling
    const errorInputs = await page.locator('[aria-invalid="true"]').all();
    
    for (const input of errorInputs) {
      // Take screenshot
      await input.screenshot({ path: `test-screenshots/error-field-${Date.now()}.png` });
      
      // Verify error message is visible
      const ariaDescribedBy = await input.getAttribute('aria-describedby');
      if (ariaDescribedBy) {
        const errorMessage = page.locator(`#${ariaDescribedBy}`);
        await expect(errorMessage).toBeVisible();
      }
    }
    
    expect(errorInputs.length).toBeGreaterThan(0);
  });

  test('Modal close buttons are accessible', async ({ page }) => {
    const shopHandle = process.env.TEST_SHOP_HANDLE || 'test-shop';
    await page.goto(`/shop/${shopHandle}`);
    
    await page.click('button:has-text("Add to Cart")').catch(() => {});
    
    const cartButton = page.locator('[aria-label*="cart" i]').first();
    await cartButton.click();
    await page.waitForTimeout(300);
    
    // Find close button
    const closeSelectors = [
      '[aria-label*="close" i]',
      'button:has-text("×")',
      'button:has-text("Close")',
      '[data-testid="close-cart"]',
    ];
    
    let closeButton;
    for (const selector of closeSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        closeButton = btn;
        break;
      }
    }
    
    expect(closeButton).toBeDefined();
    
    // Verify it has accessible name
    const ariaLabel = await closeButton?.getAttribute('aria-label');
    const text = await closeButton?.textContent();
    
    expect(ariaLabel || text?.trim()).toBeTruthy();
    
    // Verify it's keyboard accessible
    await closeButton?.focus();
    const isFocused = await closeButton?.evaluate(el => el === document.activeElement);
    expect(isFocused).toBeTruthy();
  });

  test('Price displays are formatted correctly', async ({ page }) => {
    const shopHandle = process.env.TEST_SHOP_HANDLE || 'test-shop';
    await page.goto(`/shop/${shopHandle}`);
    
    // Check product price format
    const priceElements = await page.locator('[data-testid*="price"], .price').all();
    
    for (const priceEl of priceElements) {
      const text = await priceEl.textContent();
      
      // Should contain currency symbol or code
      const hasCurrency = /[$₩€£¥]|USD|KRW|EUR|GBP|JPY/.test(text || '');
      expect(hasCurrency).toBeTruthy();
      
      // Should contain numbers
      const hasNumber = /\d/.test(text || '');
      expect(hasNumber).toBeTruthy();
    }
  });

  test('Cart quantity controls are accessible', async ({ page }) => {
    const shopHandle = process.env.TEST_SHOP_HANDLE || 'test-shop';
    await page.goto(`/shop/${shopHandle}`);
    
    await page.click('button:has-text("Add to Cart")').catch(() => {});
    
    const cartButton = page.locator('[aria-label*="cart" i]').first();
    await cartButton.click();
    await page.waitForTimeout(300);
    
    // Find increment/decrement buttons
    const incrementBtn = page.locator('button[aria-label*="increase" i], button:has-text("+")').first();
    const decrementBtn = page.locator('button[aria-label*="decrease" i], button:has-text("-")').first();
    
    // Verify they have labels
    const incLabel = await incrementBtn.getAttribute('aria-label');
    const decLabel = await decrementBtn.getAttribute('aria-label');
    
    expect(incLabel || await incrementBtn.textContent()).toBeTruthy();
    expect(decLabel || await decrementBtn.textContent()).toBeTruthy();
  });
});