import { expect, test } from "@playwright/test";

test.describe("Shops Directory Navigation", () => {
  test("visit /shops and navigate to a shop", async ({ page }) => {
    await page.goto("/shops");
    await expect(page).toHaveURL(/\/shops$/);

    const firstCard = page
      .locator('[data-testid="shop-card"], a[href^="/shop/"]')
      .first();
    await expect(firstCard).toBeVisible();
    const href = await firstCard.getAttribute("href");

    // Click card (works whether it's an anchor or container)
    await firstCard.click();
    if (href) {
      await expect(page).toHaveURL(
        new RegExp(`^${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`)
      );
    } else {
      await expect(page).toHaveURL(/\/shop\//);
    }

    // Shop product grid visible
    await expect(
      page.locator('[data-testid="product-card"], [data-testid="product-grid"]')
    ).toBeVisible();
  });
});
