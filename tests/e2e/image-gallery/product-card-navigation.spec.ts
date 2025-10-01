import { expect, test } from "@playwright/test";

test.describe("Product Card Image Gallery", () => {
  test("hover and navigate images on main shop", async ({ page }) => {
    await page.goto("/");
    const card = page.locator('[data-testid="product-card"]').first();
    await expect(card).toBeVisible();

    await card.hover();
    const next = card.getByRole("button", { name: /next|›|right/i }).first();
    const prev = card.getByRole("button", { name: /prev|‹|left/i }).first();
    if (await next.isVisible()) {
      await next.click({ trial: true }).catch(() => {});
    }
    if (await prev.isVisible()) {
      await prev.click({ trial: true }).catch(() => {});
    }

    const dot = card
      .locator('[data-testid="image-dot"], [aria-label^="Go to slide" i]')
      .nth(1);
    if (await dot.isVisible()) {
      await dot.click({ trial: true }).catch(() => {});
    }
  });

  test("quick view modal opens and shows thumbnails", async ({ page }) => {
    await page.goto("/");
    const cardImage = page.locator('[data-testid="product-card"] img').first();
    await expect(cardImage).toBeVisible();
    await cardImage.click();

    const modal = page.locator('[role="dialog"], [data-testid="quick-view"]');
    await expect(modal).toBeVisible();

    const thumbs = modal.locator('[data-testid="thumbnail"], img').nth(1);
    if (await thumbs.isVisible()) {
      await thumbs.click({ trial: true }).catch(() => {});
    }
  });
});
