import { expect, test } from "@playwright/test";
import { loginAsSupplier } from "../../helpers/auth";

test.describe("Supplier Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSupplier(page);
  });

  test("overview page loads with stats cards", async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/supplier$/);
    // generic check for cards
    await expect(
      page.locator('[data-testid="stat-card"], .card, [role="article"]').first()
    ).toBeVisible();
  });

  test("products page loads with table and Add Product", async ({ page }) => {
    await page.goto("/dashboard/supplier/products");
    await expect(page.locator("table")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /add product/i })
    ).toBeVisible();
  });

  test("orders page is unimplemented (404)", async ({ page }) => {
    const resp = await page.goto("/dashboard/supplier/orders");
    expect(resp?.status()).toBe(404);
  });

  test("analytics page is unimplemented (404)", async ({ page }) => {
    const resp = await page.goto("/dashboard/supplier/analytics");
    expect(resp?.status()).toBe(404);
  });

  test("commissions page loads", async ({ page }) => {
    await page.goto("/dashboard/supplier/commissions");
    await expect(page).toHaveURL(/\/dashboard\/supplier\/commissions$/);
  });

  test("settings page loads", async ({ page }) => {
    await page.goto("/dashboard/supplier/settings");
    await expect(page).toHaveURL(/\/dashboard\/supplier\/settings$/);
  });
});
