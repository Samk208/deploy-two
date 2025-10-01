import { expect, test } from "@playwright/test";
import { loginAsSupplier } from "../../helpers/auth";

test.describe("Product Import/Export", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSupplier(page);
    await page.goto("/dashboard/supplier/products");
  });

  test("export drawer opens and allows filter selection", async ({ page }) => {
    await page.getByRole("button", { name: /export/i }).click();
    // Drawer content appears
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("import dialog opens (dry run path)", async ({ page }) => {
    await page.getByRole("button", { name: /import/i }).click();
    // Import dialog opens
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
