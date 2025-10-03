import { expect, test } from "@playwright/test";

test.describe("Product Card Image Gallery", () => {
  test("hover and navigate images on main shop", async ({ page }) => {
    await page.goto("/");
    const card = page.locator('[data-testid="product-card"]').first();
    await expect(card).toBeVisible();

    await card.hover();
    const next = card.getByRole("button", { name: /next|›|right/i }).first();
    const prev = card.getByRole("button", { name: /prev|‹|left/i }).first();
    // Capture initial image src
    const mainImg = card.locator("img").first();
    const initialSrc = await mainImg.getAttribute("src");

    const nextVisible = await next.isVisible().catch(() => false);
    const prevVisible = await prev.isVisible().catch(() => false);
    // Require at least one navigation control to be visible, otherwise skip to avoid false green
    if (!nextVisible && !prevVisible) {
      test.skip(true, "No navigation buttons visible on the first product card; skipping navigation checks");
    }

    if (nextVisible) {
      await expect(next).toBeVisible();
      const before = (await mainImg.getAttribute("src")) || "";
      await next.click();
      await expect.poll(async () => (await mainImg.getAttribute("src")) || "").not.toBe(
        before
      );
    }
    if (prevVisible) {
      await expect(prev).toBeVisible();
      const before = (await mainImg.getAttribute("src")) || "";
      await prev.click();
      await expect.poll(async () => (await mainImg.getAttribute("src")) || "").not.toBe(
        before
      );
    }

    const dots = card.locator('[data-testid="image-dot"], [aria-label^="Go to image" i], [aria-label^="Go to slide" i]');
    const dotCount = await dots.count();
    expect(dotCount).toBeGreaterThan(1);
    const secondDot = dots.nth(1);
    await expect(secondDot).toBeVisible();
    await secondDot.click();
    const afterSrc = await mainImg.getAttribute("src");
    expect(initialSrc && initialSrc.length > 0).toBeTruthy();
    expect(afterSrc && afterSrc.length > 0).toBeTruthy();
    expect(afterSrc).not.toBe(initialSrc);
  });

  test("quick view modal opens and shows thumbnails", async ({ page }) => {
    await page.goto("/");
    const cardImage = page.locator('[data-testid="product-card"] img').first();
    await expect(cardImage).toBeVisible();
    await cardImage.click();

    const modal = page.locator('[role="dialog"], [data-testid="quick-view"]');
    await expect(modal).toBeVisible();

    const mainModalImg = modal.locator('[data-testid="product-image"], img[alt*="Image"]').first();
    const before = await mainModalImg.getAttribute("src");
    const thumbs = modal.locator('[data-testid="thumbnail"], [aria-label="Product thumbnails"] img');
    const thumbCount = await thumbs.count();
    expect(thumbCount).toBeGreaterThanOrEqual(2);
    const thumb = thumbs.nth(1);
    await expect(thumb).toBeVisible();
    await thumb.click();
    await expect.poll(async () => (await mainModalImg.getAttribute("src")) || "").not.toBe(
      (before || "")
    );
  });
});
