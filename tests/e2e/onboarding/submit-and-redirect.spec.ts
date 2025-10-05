import { test, expect } from "@playwright/test";

function randomEmail(prefix: string) {
  const n = Math.floor(Math.random() * 1e6);
  return `${prefix}+${n}@example.com`;
}

test.describe("Onboarding Submit & Dashboard Redirect", () => {
  test("influencer onboarding completes and redirects correctly", async ({ page }) => {
    const email = randomEmail("e2e.influencer.submit");
    
    // Sign up as influencer
    await page.goto("/sign-up");
    await page.getByRole("heading", { name: "Create your account" }).waitFor();
    // Dismiss cookie banner if it appears
    const acceptCookies = page.getByRole("button", { name: /Accept All|Accept cookies/i });
    if (await acceptCookies.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptCookies.click();
    }
    await page.getByRole("radio", { name: "Influencer" }).click();
    await page.locator('input[name="firstName"]').fill("E2E");
    await page.locator('input[name="lastName"]').fill("Influencer");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill("Passw0rd!");
    await page.locator('input[name="confirmPassword"]').fill("Passw0rd!");
    await page.getByRole("button", { name: "Create account" }).click();
    // Wait for sign-up API to resolve successfully before navigation assertions
    await page.waitForResponse((resp) => resp.url().includes("/api/auth/sign-up") && resp.ok(), { timeout: 30000 });

    // Robust waits after sign-up
    const toast = page.getByText(/Account created successfully|Welcome to One-Link/i);
    await Promise.race([
      expect(page).toHaveURL(/\/auth\/onboarding\?role=influencer/, { timeout: 30000 }),
      toast.waitFor({ state: "visible", timeout: 30000 }),
      page.locator('h1:text-is("Welcome to One-Link")').waitFor({ state: "visible", timeout: 30000 }),
    ]);
    // Final fallback: poll URL for onboarding, then force navigate if needed
    if (!/\/auth\/onboarding/.test(page.url())) {
      await expect.poll(() => page.url(), { timeout: 10000, intervals: [500, 500, 1000, 2000, 3000] }).toContain("/auth/onboarding").catch(async () => {
        await page.goto("/auth/onboarding?role=influencer");
        await expect(page).toHaveURL(/\/auth\/onboarding/);
      });
    }

    // Complete Step 1: Profile Basics
    await page.getByLabel("Full name").fill("E2E Influencer Test");
    await page.getByLabel("Display name").fill("E2E Influencer");
    await page.getByLabel("Country").selectOption({ index: 1 });
    await page.getByLabel("Phone").fill("+1234567890");
    await page.getByRole("button", { name: /Continue/i }).click();

    // Step 2: Social Profile - fill minimal required fields
    await page.waitForSelector('input[name*="instagram"], input[placeholder*="instagram"]', { timeout: 5000 });
    const instagramInput = page.locator('input[name*="instagram"], input[placeholder*="instagram"]').first();
    await instagramInput.fill("https://instagram.com/e2etest");
    
    await page.getByRole("button", { name: /Continue/i }).click();

    // Step 3: Verification - may have file uploads, skip if not required
    const continueBtn = page.getByRole("button", { name: /Continue/i });
    await continueBtn.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
    if (await continueBtn.isVisible()) {
      await expect(continueBtn).toBeEnabled({ timeout: 5000 });
      await continueBtn.click();
    }

    // Step 4: Commission
    const commissionContinue = page.getByRole("button", { name: /Continue/i });
    await commissionContinue.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
    if (await commissionContinue.isVisible()) {
      await expect(commissionContinue).toBeEnabled({ timeout: 5000 });
      await commissionContinue.click();
    }

    // Step 5: Review and Submit
    const submitBtn = page.getByRole("button", { name: /Submit|Complete/i });
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });
    await submitBtn.click();

    // Should redirect to influencer dashboard
    await page.waitForURL(/\/dashboard\/influencer/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard\/influencer/);

    // Verify role persisted correctly by checking API
    const roleResponse = await page.request.get("/api/me");
    expect(roleResponse.ok()).toBeTruthy();
    const userData = await roleResponse.json();
    expect(userData.role).toBe("influencer");
    
    // Also verify page loaded correctly
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("brand/supplier onboarding completes and redirects correctly", async ({ page }) => {
    const email = randomEmail("e2e.brand.submit");
    
    // Sign up as supplier/brand
    await page.goto("/sign-up");
    await page.getByRole("heading", { name: "Create your account" }).waitFor();
    await page.getByLabel("Supplier").click();
    await page.locator('input[name="firstName"]').fill("E2E");
    await page.locator('input[name="lastName"]').fill("Brand");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill("Passw0rd!");
    await page.locator('input[name="confirmPassword"]').fill("Passw0rd!");
    await page.getByRole("button", { name: "Create account" }).click();

    // Wait for onboarding with brand role
    await page.waitForResponse((resp) => resp.url().includes("/api/auth/sign-up") && resp.ok(), { timeout: 30000 });
    await Promise.race([
      expect(page).toHaveURL(/\/auth\/onboarding\?role=brand/, { timeout: 30000 }),
      page.getByText(/Account created successfully|Welcome to One-Link/i).waitFor({ state: "visible", timeout: 30000 }),
      page.locator('h1:text-is("Welcome to One-Link")').waitFor({ state: "visible", timeout: 30000 }),
    ]);
    if (!/\/auth\/onboarding/.test(page.url())) {
      await expect.poll(() => page.url(), { timeout: 10000, intervals: [500, 500, 1000, 2000, 3000] }).toContain("/auth/onboarding").catch(async () => {
        await page.goto("/auth/onboarding?role=brand");
        await expect(page).toHaveURL(/\/auth\/onboarding/);
      });
    }

    // Complete Step 1: Profile Basics
    await page.getByLabel("Full name").fill("E2E Brand Test");
    await page.getByLabel("Display name").fill("E2E Brand");
    await page.getByLabel("Country").selectOption({ index: 1 });
    await page.getByLabel("Phone").fill("+1234567890");
    await page.getByRole("button", { name: /Continue/i }).click();

    // Step 2: Business Profile - fill minimal required fields
    const businessContinue = page.getByRole("button", { name: /Continue/i });
    await businessContinue.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
    if (await businessContinue.isVisible()) {
      await expect(businessContinue).toBeEnabled({ timeout: 5000 });
      await businessContinue.click();
    }

    // Step 3: Verification
    const verifyContinue = page.getByRole("button", { name: /Continue/i });
    await verifyContinue.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
    if (await verifyContinue.isVisible()) {
      await expect(verifyContinue).toBeEnabled({ timeout: 5000 });
      await verifyContinue.click();
    }

    // Step 4: Commission
    const commissionContinue = page.getByRole("button", { name: /Continue/i });
    await commissionContinue.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
    if (await commissionContinue.isVisible()) {
      await expect(commissionContinue).toBeEnabled({ timeout: 5000 });
      await commissionContinue.click();
    }

    // Step 5: Review and Submit
    await page.waitForTimeout(1000);
    const submitBtn = page.getByRole("button", { name: /Submit|Complete/i });
    await submitBtn.click();

    // Should redirect to supplier dashboard
    await page.waitForURL(/\/dashboard\/supplier/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard\/supplier/);

    // Verify role persisted correctly as 'supplier' (not 'brand')
    const roleResponse = await page.request.get("/api/me");
    expect(roleResponse.ok()).toBeTruthy();
    const userData = await roleResponse.json();
    expect(userData.role).toBe("supplier");
    
    // Also verify page loaded correctly
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("onboarding submit blocked without required documents", async ({ page }) => {
    const email = randomEmail("e2e.nodocs.submit");
    
    // Sign up as supplier/brand
    await page.goto("/sign-up");
    await page.getByRole("heading", { name: "Create your account" }).waitFor();
    await page.getByLabel("Supplier").click();
    await page.locator('input[name="firstName"]').fill("E2E");
    await page.locator('input[name="lastName"]').fill("NoDocs");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill("Passw0rd!");
    await page.locator('input[name="confirmPassword"]').fill("Passw0rd!");
    await page.getByRole("button", { name: "Create account" }).click();

    // Wait for onboarding
    await page.waitForResponse((resp) => resp.url().includes("/api/auth/sign-up") && resp.ok(), { timeout: 30000 });
    await Promise.race([
      expect(page).toHaveURL(/\/auth\/onboarding\?role=brand/, { timeout: 30000 }),
      page.getByText(/Account created successfully|Welcome to One-Link/i).waitFor({ state: "visible", timeout: 30000 }),
      page.locator('h1:text-is("Welcome to One-Link")').waitFor({ state: "visible", timeout: 30000 }),
    ]);
    if (!/\/auth\/onboarding/.test(page.url())) {
      await expect.poll(() => page.url(), { timeout: 10000, intervals: [500, 500, 1000, 2000, 3000] }).toContain("/auth/onboarding").catch(async () => {
        await page.goto("/auth/onboarding?role=brand");
        await expect(page).toHaveURL(/\/auth\/onboarding/);
      });
    }

    // Complete steps WITHOUT uploading documents
    await page.getByLabel("Full name").fill("E2E NoDocs Test");
    await page.getByLabel("Display name").fill("E2E NoDocs");
    await page.getByLabel("Country").selectOption({ index: 1 });
    await page.getByLabel("Phone").fill("+1234567890");
    await page.getByRole("button", { name: /Continue/i }).click();

    // Skip through other steps
    let continueBtn = page.getByRole("button", { name: /Continue/i });
    await continueBtn.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
    if (await continueBtn.isVisible()) {
      await expect(continueBtn).toBeEnabled({ timeout: 5000 });
      await continueBtn.click();
    }
    
    continueBtn = page.getByRole("button", { name: /Continue/i });
    await continueBtn.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
    if (await continueBtn.isVisible()) {
      await expect(continueBtn).toBeEnabled({ timeout: 5000 });
      await continueBtn.click();
    }
    
    continueBtn = page.getByRole("button", { name: /Continue/i });
    await continueBtn.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
    if (await continueBtn.isVisible()) {
      await expect(continueBtn).toBeEnabled({ timeout: 5000 });
      await continueBtn.click();
    }

    // Try to submit without documents
    const submitBtn = page.getByRole("button", { name: /Submit|Complete/i });
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });
    await submitBtn.click();

    // Should see error message about missing documents
    const errorMessage = page.getByText(/upload.*verification documents/i);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Should still be on onboarding page
    await expect(page).toHaveURL(/\/auth\/onboarding/);
  });
});
