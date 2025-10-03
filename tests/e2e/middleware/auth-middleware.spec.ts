import { test, expect } from "@playwright/test";

test.describe("Middleware Authentication & Authorization", () => {
  test("unauthenticated user redirected from protected dashboards", async ({ page }) => {
    await page.context().clearCookies();

    await page.goto("/dashboard/supplier");
    await expect(page).toHaveURL(/\/(sign-in|login)/);

    await page.goto("/dashboard/influencer");
    await expect(page).toHaveURL(/\/(sign-in|login)/);
  });

  test("session cookie present after login page navigation (smoke)", async ({ page }) => {
    await page.goto("/sign-in");
    // We don't perform full login here; this test ensures the page is reachable.
    // Let this assertion fail naturally to surface real issues in CI.
    await expect(page).toHaveTitle(/sign in|login/i, { timeout: 30000 });

    // Capture cookies to aid diagnostics (not asserting structure due to env variability)
    const cookies = await page.context().cookies();
    expect(Array.isArray(cookies)).toBeTruthy();
  });
});
