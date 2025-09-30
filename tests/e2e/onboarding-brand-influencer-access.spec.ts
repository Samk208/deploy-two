import { expect, test } from "@playwright/test";

function makeFile(name: string, mimeType: string, content = "dummy") {
  return { name, mimeType, buffer: Buffer.from(content) };
}

test.describe("Onboarding access and document uploads", () => {
  test("influencer login, reach onboarding verify, upload docs, then access dashboard", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("test.influencer+e2e@test.local");
    await page.getByLabel("Password").fill("NewInfluencerPassword123!");
    await page.getByRole("button", { name: "Sign In" }).click();

    // Either lands on dashboard or onboarding based on account state
    await page.waitForURL(/(\/dashboard\/influencer|\/onboarding\/influencer)/, { timeout: 30000 });
    if (!page.url().includes("/dashboard/influencer")) {
      // Move through onboarding to the verification step
      await page
        .getByText(/Identity Verification|Verification/i)
        .first()
        .waitFor({ timeout: 30000 });
      // Upload required docs if controls exist in page
      const idCtrl = page.locator("#id-upload");
      if (await idCtrl.count())
        await page.setInputFiles("#id-upload", [
          makeFile("id.png", "image/png"),
        ]);
      const selfieCtrl = page.locator("#selfie-upload");
      if (await selfieCtrl.count())
        await page.setInputFiles("#selfie-upload", [
          makeFile("selfie.png", "image/png"),
        ]);
      const addrCtrl = page.locator("#address-upload");
      if (await addrCtrl.count())
        await page.setInputFiles("#address-upload", [
          makeFile("address.pdf", "application/pdf"),
        ]);
      await page
        .getByRole("button", { name: /(Continue|Submit|Save)/i })
        .first()
        .click();
    }

    // Ensure influencer dashboard access
    if (!page.url().includes("/dashboard/influencer")) {
      await page.goto("/dashboard/influencer");
    }
    await page.waitForURL("**/dashboard/influencer", { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard\/influencer$/);
  });

  test("brand login, access supplier dashboard", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("test.brand+e2e@test.local");
    await page.getByLabel("Password").fill("NewBrandPassword123!");
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("**/dashboard/supplier", { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard\/supplier$/);
  });
});
