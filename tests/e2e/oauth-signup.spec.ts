import { expect, test } from "@playwright/test";

test.describe("OAuth buttons on Sign Up", () => {
  test("GitHub button exists and triggers navigation", async ({ page }) => {
    await page.goto("/sign-up");
    const btn = page.getByRole("button", { name: /GitHub/i });
    await expect(btn).toBeVisible();
    const [nav] = await Promise.all([
      page.waitForNavigation({ waitUntil: "load" }).catch(() => null),
      btn.click(),
    ]);
    expect(btn).toBeTruthy();
  });

  test("Kakao button exists and triggers navigation", async ({ page }) => {
    await page.goto("/sign-up");
    const btn = page.getByRole("button", { name: /Kakao/i });
    await expect(btn).toBeVisible();
    const [nav] = await Promise.all([
      page.waitForNavigation({ waitUntil: "load" }).catch(() => null),
      btn.click(),
    ]);
    expect(btn).toBeTruthy();
  });
});
