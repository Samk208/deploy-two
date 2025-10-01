import { expect, test } from "@playwright/test";

// Verifies influencer shops directory renders cards with banner/avatar fallbacks
// and does not crash when media is missing. Target: /shops

test.describe("Influencer shops directory", () => {
  test("renders shop cards with banner/avatar or fallbacks", async ({
    page,
  }) => {
    await page.goto("/shops");

    // Page heading present
    await expect(page.getByText(/Discover Amazing Shops/i)).toBeVisible();

    // We expect at least one visible shop card (based on mock/data)
    const visitButtons = page.getByRole("button", { name: /Visit Shop/i });
    await expect(visitButtons.first()).toBeVisible();

    // Select the first shop card via stable test id
    const card = page.locator('[data-testid="shop-card"]').first();

    // Banner image or a banner placeholder element should be present
    const bannerImg = card.locator("img").first();
    // Don't assert src; assert layout (not collapsed)
    if (await bannerImg.isVisible().catch(() => false)) {
      const box = await bannerImg.boundingBox();
      expect(box).toBeTruthy();
      if (box) expect(box.height).toBeGreaterThan(40);
    } else {
      // If no img, ensure there is a non-zero-height banner container
      const bannerContainer = card
        .locator(
          '[class*="banner"], [data-testid="shop-banner"], div:has-text("STYLE FORWARD")'
        )
        .first();
      await expect(bannerContainer).toBeVisible();
    }

    // Avatar image or initials fallback
    const avatarImg = card.locator(
      'img[alt*="avatar" i], img[alt*="profile" i]'
    );
    if (
      await avatarImg
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      const abox = await avatarImg.first().boundingBox();
      expect(abox).toBeTruthy();
      if (abox) expect(abox.height).toBeGreaterThan(24);
    } else {
      // Check for a circular placeholder with initial letter
      const avatarFallback = card
        .locator('[class*="rounded-full"], [data-testid="avatar-fallback"]')
        .first();
      await expect(avatarFallback).toBeVisible();
    }

    // Product count label should be visible (even if 0 products)
    await expect(card.getByText(/products?\b/i)).toBeVisible();
  });
});
