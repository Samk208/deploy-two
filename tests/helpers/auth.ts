import { Page, expect } from "@playwright/test";

export const TEST_ADMIN_CREDENTIALS = {
  email: process.env.TEST_ADMIN_EMAIL || "test.admin+e2e@test.local",
  password: process.env.TEST_ADMIN_PASSWORD || "TestAdmin123!",
};

export const TEST_SUPPLIER_CREDENTIALS = {
  email: process.env.TEST_SUPPLIER_EMAIL || "test.brand+e2e@test.local",
  password: process.env.TEST_SUPPLIER_PASSWORD || "NewBrandPassword123!",
};

export const TEST_INFLUENCER_CREDENTIALS = {
  email: process.env.TEST_INFLUENCER_EMAIL || "test.influencer+e2e@test.local",
  password:
    process.env.TEST_INFLUENCER_PASSWORD || "NewInfluencerPassword123!",
};

export async function loginAsAdmin(page: Page) {
  await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
  const email = page
    .getByLabel(/email/i)
    .or(page.locator('input[name="email"]').first());
  const pass = page
    .getByLabel(/password/i)
    .or(page.locator('input[name="password"]').first());
  await email.fill(TEST_ADMIN_CREDENTIALS.email);
  await pass.fill(TEST_ADMIN_CREDENTIALS.password);
  await page
    .getByRole("button", { name: /sign in/i })
    .or(page.locator('button[type="submit"]').first())
    .click();

  // Wait for either dashboard or a failure signal; extend timeout to cover SSR
  try {
    await page.waitForURL("**/admin/dashboard", {
      timeout: 30000,
      waitUntil: "networkidle",
    });
  } catch (e) {
    // Capture diagnostics before failing
    await page
      .screenshot({
        path: "test-results/Dashboard Report/test-artifacts/admin-login-failure.png",
        fullPage: true,
      })
      .catch(() => {});
    throw e;
  }
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: /Admin Dashboard/i })
  ).toBeVisible({ timeout: 15000 });
}

export async function loginAsInfluencer(page: Page) {
  await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
  const email = page
    .getByLabel(/email/i)
    .or(page.locator('input[name="email"]').first());
  const pass = page
    .getByLabel(/password/i)
    .or(page.locator('input[name="password"]').first());
  await email.fill(TEST_INFLUENCER_CREDENTIALS.email);
  await pass.fill(TEST_INFLUENCER_CREDENTIALS.password);
  await page
    .getByRole("button", { name: /sign in/i })
    .or(page.locator('button[type="submit"]').first())
    .click();

  try {
    await page.waitForURL("**/dashboard/influencer**", {
      timeout: 30000,
      waitUntil: "networkidle",
    });
  } catch (e) {
    await page
      .screenshot({
        path: "test-results/Dashboard Report/test-artifacts/influencer-login-failure.png",
        fullPage: true,
      })
      .catch(() => {});
    throw e;
  }
  await expect(page).toHaveURL(/\/dashboard\/influencer(\/.*)?$/);
}

export async function loginAsSupplier(page: Page) {
  await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
  const email = page
    .getByLabel(/email/i)
    .or(page.locator('input[name="email"]').first());
  const pass = page
    .getByLabel(/password/i)
    .or(page.locator('input[name="password"]').first());
  await email.fill(TEST_SUPPLIER_CREDENTIALS.email);
  await pass.fill(TEST_SUPPLIER_CREDENTIALS.password);
  await page
    .getByRole("button", { name: /sign in/i })
    .or(page.locator('button[type="submit"]').first())
    .click();

  try {
    await page.waitForURL("**/dashboard/supplier**", {
      timeout: 30000,
      waitUntil: "networkidle",
    });
  } catch (e) {
    await page
      .screenshot({
        path: "test-results/Dashboard Report/test-artifacts/supplier-login-failure.png",
        fullPage: true,
      })
      .catch(() => {});
    throw e;
  }
  await expect(page).toHaveURL(/\/dashboard\/supplier(\/.*)?$/);
}

export async function ensureSignedOut(page: Page) {
  try {
    await page.goto("/");
    const userMenuButton = page
      .locator(
        '[data-testid="user-menu"], [aria-label*="account" i], [aria-haspopup="menu"]'
      )
      .first();
    await userMenuButton.click({ timeout: 3000 });
    await page
      .getByRole("menuitem", { name: /sign out/i })
      .click({ timeout: 3000 });
    await page.waitForLoadState("networkidle");
  } catch {
    // already signed out
  }
}
