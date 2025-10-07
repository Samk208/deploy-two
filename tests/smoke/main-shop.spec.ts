import { test, expect } from "@playwright/test";

test("Main Shop loads and product detail works", async ({ page }) => {
  await page.goto("/main-shop");
  const count = await page.locator("[data-testid='product-card']").count();
  if (count > 0) {
    await page.locator("[data-testid='product-card']").first().click();
    await expect(page.locator("h1")).toBeVisible();
  } else {
    await expect(page.locator("[data-testid='empty-state']")).toBeVisible();
  }
});
