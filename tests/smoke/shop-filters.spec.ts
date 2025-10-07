import { test, expect } from "@playwright/test";

test("shop filters + pagination + PDP", async ({ page }) => {
  await page.goto("/shop");

  // Search input (debounced)
  const search = page.getByPlaceholder("Search products…");
  await search.fill("Test");
  await page.waitForTimeout(350);

  // Sort change
  await page.selectOption("select", "price-asc");

  // Pagination next
  const nextBtn = page.getByRole("button", { name: "Next" });
  if (await nextBtn.isEnabled()) {
    await nextBtn.click();
    await expect(page).toHaveURL(/page=\d+/);
  }

  // Product detail navigation
  const cards = page.locator("[data-testid='product-card']");
  if (await cards.count() > 0) {
    await cards.first().click();
    await expect(page.locator("h1")).toBeVisible();
  } else {
    await expect(page.locator("[data-testid='empty-state']")).toBeVisible();
  }
});
