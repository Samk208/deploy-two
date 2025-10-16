import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { TEST_USERS } from "../config/testUsers";

export const TEST_ADMIN_CREDENTIALS = TEST_USERS.ADMIN;
export const TEST_SUPPLIER_CREDENTIALS = TEST_USERS.SUPPLIER;
export const TEST_INFLUENCER_CREDENTIALS = TEST_USERS.INFLUENCER;

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

  // Wait for admin dashboard URL; avoid relying on networkidle which can be flaky
  try {
    await expect(page).toHaveURL(/\/admin\/dashboard$/i, { timeout: 45000 });
  } catch (e) {
    // Capture diagnostics before failing
    const artifactsDir = path.join(
      process.cwd(),
      "test-results",
      "test-artifacts"
    );
    try {
      fs.mkdirSync(artifactsDir, { recursive: true });
    } catch {}
    const filePath = path.join(artifactsDir, `admin-login-failure.png`);
    await page.screenshot({ path: filePath, fullPage: true }).catch(() => {});
    throw e;
  }
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
    await expect(page).toHaveURL(/\/dashboard\/influencer(\/.*)?$/i, {
      timeout: 45000,
    });
  } catch (e) {
    const artifactsDir = path.join(
      process.cwd(),
      "test-results",
      "test-artifacts"
    );
    try {
      fs.mkdirSync(artifactsDir, { recursive: true });
    } catch {}
    const filePath = path.join(artifactsDir, `influencer-login-failure.png`);
    await page.screenshot({ path: filePath, fullPage: true }).catch(() => {});
    throw e;
  }
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
    await expect(page).toHaveURL(/\/dashboard\/supplier(\/.*)?$/i, {
      timeout: 45000,
    });
  } catch (e) {
    const artifactsDir = path.join(
      process.cwd(),
      "test-results",
      "test-artifacts"
    );
    try {
      fs.mkdirSync(artifactsDir, { recursive: true });
    } catch {}
    const filePath = path.join(artifactsDir, `supplier-login-failure.png`);
    await page.screenshot({ path: filePath, fullPage: true }).catch(() => {});
    throw e;
  }
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
