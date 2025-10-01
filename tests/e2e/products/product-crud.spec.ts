import { expect, test } from "@playwright/test";
import { loginAsSupplier } from "../../helpers/auth";

test.describe("Supplier Product CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSupplier(page);
  });

  test("create product", async ({ page }) => {
    // Navigate to products
    await page.goto("/dashboard/supplier/products");
    await expect(
      page.getByRole("heading", { name: /My Products/i })
    ).toBeVisible();

    // Filter by region
    await page.locator('[data-testid="region-filter"]').click();
    await page.getByRole("option").filter({ hasText: "KR" }).click();
    await page.getByTestId("apply-filters").click();

    // Add Product
    await page.getByRole("button", { name: /add product/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/supplier\/products\/new$/);

    // Fill form
    await page.getByTestId("product-title").fill("E2E Product X");
    await page
      .getByTestId("product-description")
      .fill("Created by Playwright E2E");

    await page.getByTestId("product-category").click();
    await page.getByRole("option").first().click();

    await page.getByTestId("product-price").fill("19.99");
    await page.getByTestId("product-stock").fill("25");
    await page.getByTestId("product-commission").fill("10");

    await page.getByTestId("region-global").check();

    // Simulate image upload by toggling hidden input via label (no real file needed as UI uses placeholders)
    await page.getByTestId("product-images").click();

    // Submit
    await page.getByTestId("submit-product").click();

    // Either success message then back to products, or redirect; accept both
    await page.waitForLoadState("networkidle");
    const url = page.url();
    if (/\/dashboard\/supplier\/products$/.test(url)) {
      // back to list
      await expect(
        page.getByRole("heading", { name: /My Products/i })
      ).toBeVisible();
    } else {
      // stayed on page and showed success message; navigate back manually
      const success = page.getByTestId("success-message");
      if (await success.isVisible()) {
        await page.goto("/dashboard/supplier/products");
      }
    }

    // Table renders
    await expect(page.locator("table")).toBeVisible();
  });
});
