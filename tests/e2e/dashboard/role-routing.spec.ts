import { expect, test } from "@playwright/test";
import { ensureSignedOut, loginAsInfluencer, loginAsSupplier } from "../../helpers/auth";

// Verifies that role-based dashboard routing and protections work as expected.
// NOTE: If this spec fails with dashboards loading without auth, remove public whitelisting
// for `/dashboard/supplier` and `/dashboard/influencer` in `middleware.ts`.

test.describe("Role-based dashboard routing", () => {
  test.beforeEach(async ({ page }) => {
    await ensureSignedOut(page);
  });

  test("unauthenticated users are redirected to sign-in for both dashboards", async ({ page }) => {
    await page.goto("/dashboard/supplier");
    await page.waitForURL(/\/sign-in(\?.*)?$/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/sign-in/);

    await page.goto("/dashboard/influencer");
    await page.waitForURL(/\/sign-in(\?.*)?$/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("influencer cannot access supplier dashboard and is redirected to influencer", async ({ page, request }) => {
    await loginAsInfluencer(page);
    await page.goto("/dashboard/supplier");
    await page.waitForURL("**/dashboard/influencer**", { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard\/influencer(\/.*)?$/);
    // API authZ: influencer should not access supplier dashboard API
    const api = await request.get("/api/dashboard/supplier");
    expect([401, 403]).toContain(api.status());
  });

  test("supplier cannot access influencer dashboard and is redirected to supplier", async ({ page, request }) => {
    await loginAsSupplier(page);
    await page.goto("/dashboard/influencer");
    await page.waitForURL("**/dashboard/supplier**", { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard\/supplier(\/.*)?$/);
    // API authZ: supplier should not access influencer dashboard API (when implemented)
    const api = await request.get("/api/dashboard/influencer");
    expect([401, 403, 404]).toContain(api.status());
  });
});
