import { expect, test, type Page } from "@playwright/test";

async function emailPasswordLogin(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }).catch(() => {}),
    page.getByRole("button", { name: "Sign In" }).click(),
  ]);
}

test.describe("Auth Access - Email/Password and Role Redirects", () => {
  test("admin email/password redirects to /admin/dashboard", async ({
    page,
  }) => {
    await emailPasswordLogin(
      page,
      "test.admin+e2e@test.local",
      "TestAdmin123!"
    );
    await page.waitForURL("**/admin/dashboard", { timeout: 15000 });
    await expect(
      page.getByRole("heading", { name: /Admin Dashboard/i })
    ).toBeVisible();
  });

  test("customer redirects to home (no dashboard)", async ({ page }) => {
    await emailPasswordLogin(
      page,
      "test.customer+e2e@test.local",
      "NewTestPassword123!"
    );
    await page.waitForLoadState("networkidle");
    // customers should land on site root
    const pathname = new URL(page.url()).pathname;
    expect(pathname).toBe("/");
  });

  test("brand/supplier redirects to /dashboard/supplier", async ({ page }) => {
    await emailPasswordLogin(
      page,
      "test.brand+e2e@test.local",
      "NewBrandPassword123!"
    );
    await page.waitForURL("**/dashboard/supplier", { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard\/supplier$/);
  });

  test("influencer redirects to /dashboard/influencer", async ({ page }) => {
    await emailPasswordLogin(
      page,
      "test.influencer+e2e@test.local",
      "NewInfluencerPassword123!"
    );
    await page.waitForURL("**/dashboard/influencer", { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard\/influencer$/);
  });
});
