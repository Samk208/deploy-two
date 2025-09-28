import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "../helpers/auth";

test.describe("Role-based dashboards", () => {
  test("admin can access /admin/dashboard", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(
      page.getByRole("heading", { name: /Admin Dashboard/i })
    ).toBeVisible();
  });

  test("non-admin redirected away from /dashboard/admin", async ({ page }) => {
    // Sign up a supplier quickly via UI
    const email = `e2e_supplier_${Date.now()}@example.com`;
    const password = "Password123!";
    await page.goto("/sign-up");
    await page.fill('input[name="firstName"]', "Supplier");
    await page.fill('input[name="lastName"]', "User");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState("networkidle");

    // Try visiting admin dashboard directly
    await page.goto("/dashboard/admin");
    // Expect redirect to their own dashboard or home (middleware enforces)
    await page.waitForLoadState("networkidle");
    const redirected =
      page.url().includes("/dashboard/supplier") || page.url().endsWith("/");
    expect(redirected).toBeTruthy();
  });
});
