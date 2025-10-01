import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "../../helpers/auth";

test.describe("Admin Dashboard Access", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("can access admin dashboard", async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/dashboard$/);
    await expect(
      page.getByRole("heading", { name: /Admin Dashboard/i })
    ).toBeVisible();
  });

  test("can access supplier dashboard pages", async ({ page }) => {
    await page.goto("/dashboard/supplier");
    await expect(page).toHaveURL(/\/dashboard\/supplier$/);

    await page.goto("/dashboard/supplier/products");
    await expect(page).toHaveURL(/\/dashboard\/supplier\/products$/);
    await expect(page.getByText(/Verification in progress/i)).toBeVisible();
  });

  test("supplier orders and analytics pages load", async ({ page }) => {
    const r1 = await page.goto("/dashboard/supplier/orders");
    expect(r1).not.toBeNull();
    expect(r1!.status()).toBe(200);

    const r2 = await page.goto("/dashboard/supplier/analytics");
    expect(r2).not.toBeNull();
    expect(r2!.status()).toBe(200);
  });
});
