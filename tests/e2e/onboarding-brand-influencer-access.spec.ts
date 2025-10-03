import { expect, test } from "@playwright/test";
import { TEST_INFLUENCER_CREDENTIALS, loginAsSupplier } from "../helpers/auth";

function makeFile(name: string, mimeType: string, content = "dummy") {
  return { name, mimeType, buffer: Buffer.from(content) };
}

test.describe("Onboarding access and document uploads", () => {
  test("influencer login, reach onboarding verify, upload docs, then access dashboard (and role is influencer)", async ({
    page,
    request,
  }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(TEST_INFLUENCER_CREDENTIALS.email);
    await page.getByLabel("Password").fill(TEST_INFLUENCER_CREDENTIALS.password);
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
    // Verify session role
    const sessionRes = await request.get("/api/auth/session");
    expect(sessionRes.status()).toBeLessThan(400);
    const session = await sessionRes.json();
    expect(session?.user?.role).toBe("influencer");
  });

  test("brand login, access supplier dashboard (and role is supplier)", async ({ page, request }) => {
    await loginAsSupplier(page);
    await expect(page).toHaveURL(/\/dashboard\/supplier(\/.*)?$/);
    // Verify session role
    const sessionRes = await request.get("/api/auth/session");
    expect(sessionRes.status()).toBeLessThan(400);
    const session = await sessionRes.json();
    expect(session?.user?.role).toBe("supplier");
  });
});
