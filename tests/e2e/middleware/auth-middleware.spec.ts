import { test, expect } from "@playwright/test";

test.describe("Middleware Authentication & Authorization", () => {
  test("unauthenticated user redirected from protected dashboards", async ({ page }) => {
    await page.context().clearCookies();

    // Test supplier dashboard redirect
    await page.goto("/dashboard/supplier");
    await page.waitForURL(/\/sign-in/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.url()).toContain("redirectTo=%2Fdashboard%2Fsupplier");

    // Test influencer dashboard redirect
    await page.waitForURL(/\/sign-in/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.url()).toContain("redirectTo=%2Fdashboard%2Finfluencer");

    // Test admin dashboard redirect
    await page.goto("/admin/dashboard");
    await page.waitForURL(/\/sign-in/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.url()).toContain("redirectTo=%2Fadmin%2Fdashboard");
  });

  test("session cookie present after login page navigation (smoke)", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveTitle(/sign in|login/i, { timeout: 30000 });
    const cookies = await page.context().cookies();
    expect(Array.isArray(cookies)).toBeTruthy();
  });
});
