import { expect, test } from "@playwright/test";
import { loginAsInfluencer } from "../../helpers/auth";

test.describe("Influencer Dashboard Access", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsInfluencer(page);
  });

  test("dashboard loads and shows influencer UI", async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/influencer(\/.*)?$/);
    // generic heading/section check to avoid brittle selectors
    await expect(page.locator("h1, h2").filter({ hasText: /influencer|shop|commissions/i })).toBeVisible();
  });
});
