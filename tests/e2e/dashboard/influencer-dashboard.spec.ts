import { expect, test } from "@playwright/test";

test.describe("Influencer Dashboard Access", () => {
  test("page loads (if implemented) or redirects appropriately", async ({
    page,
  }) => {
    // We don't have a helper for influencer login; visit the page directly to validate route presence
    const response = await page.goto("/dashboard/influencer");
    // Accept either 200 page load or redirect away if not authenticated
    expect(response).not.toBeNull();
    expect([200, 302, 301, 307, 308]).toContain(response!.status());
  });
});
