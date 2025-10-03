import { test, expect } from "@playwright/test";

// End-to-end checkout flow with UI/CSS robustness checks.
// Notes:
// - Uses generic selectors with fallbacks to reduce brittleness.
// - Handles possible Stripe Checkout redirect in test mode.
// - Adds validations for required fields and success page content.

test.describe("Checkout Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a shop page or fallback to generic listing
    await page.goto("/shops");
    await page.waitForLoadState("domcontentloaded");

    const firstShop = page.locator('a[href^="/shop/"]').first();
    if (await firstShop.isVisible().catch(() => false)) {
      await firstShop.click();
      await page.waitForLoadState("networkidle");
    } else {
      await page.goto("/shop");
      await page.waitForLoadState("networkidle");
    }
  });

  test("complete checkout to success page (Stripe test mode supported)", async ({ page }) => {
    // 1) Add first visible product to cart
    const addToCart = page
      .locator('[data-testid="add-to-cart-button"]').first()
      .or(page.getByRole("button", { name: /add to cart/i }).first());
    await expect(addToCart).toBeVisible();
    await addToCart.click();

    // 2) Verify cart badge increments
    const cartBadge = page
      .locator('[data-testid="cart-badge"], [data-testid="cart-count"], .cart-count')
      .first();
    await expect(cartBadge).toBeVisible();
    await expect(cartBadge).toContainText(/\d+/);

    // 3) Open cart
    const openCart = page
      .locator('[aria-label*="cart" i]')
      .or(page.getByRole("button", { name: /cart/i }))
      .first();
    await openCart.click();

    // 4) Proceed to checkout
    const toCheckout = page
      .getByRole("button", { name: /checkout/i })
      .or(page.locator('a:has-text("Checkout"), button:has-text("Checkout")').first());
    await expect(toCheckout).toBeVisible();
    await toCheckout.click();

    // 5) Should navigate to checkout page
    await expect(page).toHaveURL(/\/checkout/);

    // 6) Fill checkout form (use common field names)
    await page.fill('input[name="email"], input[type="email"]', 'customer@test.com');
    await page.fill('input[name="name"], input[autocomplete="name"]', 'Test Customer');
    await page.fill('input[name="address"], input[autocomplete="address-line1"]', '123 Test St');
    await page.fill('input[name="city"], input[autocomplete="address-level2"]', 'Seoul');
    const postal = page.locator('input[name="postalCode"], input[autocomplete="postal-code"]');
    if (await postal.count()) await postal.fill('12345');

    // 7) Pay/Complete order
    const payBtn = page
      .getByRole("button", { name: /complete order|pay/i })
      .or(page.locator('button:has-text("Complete Order"), button:has-text("Pay")').first());
    await expect(payBtn).toBeEnabled();
    await payBtn.click();

    // 8) Handle Stripe Checkout redirect if it occurs
    // Wait explicitly for Stripe navigation to avoid racing on slow redirects
    const maybeStripe = await Promise.race([
      page.waitForURL(/checkout\.stripe\.com\/.+/, { timeout: 15000 }).then(() => true).catch(() => false),
      page.waitForLoadState("networkidle").then(() => false).catch(() => false),
    ]);
    if (maybeStripe || page.url().includes("checkout.stripe.com")) {
      // Best-effort fill of Stripe test card fields (selectors vary by integration)
      const card = page.locator('[placeholder*="Card number" i], input[name*="cardnumber" i]').first();
      const exp = page.locator('[placeholder*="MM / YY" i], input[name*="exp-date" i]').first();
      const cvc = page.locator('[placeholder*="CVC" i], input[name*="cvc" i]').first();
      const zip = page.locator('[placeholder*="ZIP" i], input[name*="postal" i]').first();

      try {
        await card.waitFor({ state: 'visible', timeout: 10000 });
        await card.fill('4242424242424242');
      } catch (e) {
        console.error('Stripe fill error: card number field not available');
        throw e;
      }
      try {
        await exp.waitFor({ state: 'visible', timeout: 10000 });
        await exp.fill('12/34');
      } catch (e) {
        console.error('Stripe fill error: expiration field not available');
        throw e;
      }
      try {
        await cvc.waitFor({ state: 'visible', timeout: 10000 });
        await cvc.fill('123');
      } catch (e) {
        console.error('Stripe fill error: CVC field not available');
        throw e;
      }
      try {
        await zip.waitFor({ state: 'visible', timeout: 10000 });
        await zip.fill('12345');
      } catch (e) {
        console.error('Stripe fill error: postal/ZIP field not available');
        throw e;
      }

      const submit = page.getByRole('button', { name: /pay|complete|submit/i }).first();
      await expect(submit).toBeEnabled({ timeout: 10000 });
      await submit.click();
    }

    // 9) Verify success page
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/(success|orders\/[^/]+|thank-you)/);
    await expect(page.locator('text=/success|thank you|order confirmed/i')).toBeVisible();
  });

  test("checkout validation prevents submission with missing fields", async ({ page }) => {
    // Add product
    const addToCart = page
      .locator('[data-testid="add-to-cart-button"]').first()
      .or(page.getByRole("button", { name: /add to cart/i }).first());
    await addToCart.click();

    // Go to cart and checkout
    await page.locator('[aria-label*="cart" i]').first().click();
    await page.getByRole("button", { name: /checkout/i }).or(page.locator('a:has-text("Checkout")')).first().click();
    await expect(page).toHaveURL(/\/checkout/);

    // Try to submit without filling fields
    const payBtn = page
      .getByRole("button", { name: /complete order|pay/i })
      .or(page.locator('button:has-text("Complete Order"), button:has-text("Pay")').first());
    await payBtn.click();

    // Expect visible validation errors and stay on checkout
    await expect(page.locator('text=/required|invalid|please enter/i')).toBeVisible();
    await expect(page).toHaveURL(/\/checkout/);
  });
});
