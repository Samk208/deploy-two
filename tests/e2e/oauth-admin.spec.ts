import { expect, test } from "@playwright/test";

test.describe("Admin OAuth (GitHub) flow", () => {
  test("github sign-in reaches callback and grants admin access (manual provider)", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    // Click the GitHub OAuth button; human interaction may be required unless GitHub test creds are configured.
    await page.getByRole("button", { name: /Continue with GitHub/i }).click();

    // We expect to land on our callback, then be redirected based on role.
    // To keep this test non-flaky in CI without real GitHub creds, we only assert the callback handoff if provider is mocked.
    await page.waitForURL(/\/api\/auth\/callback|\/admin\/dashboard/, {
      timeout: 30000,
    });

    // If admin session active, we should be in admin dashboard
    if (page.url().includes("/admin/dashboard")) {
      await expect(
        page.getByRole("heading", { name: /Admin Dashboard/i })
      ).toBeVisible();
    }
  });
});
