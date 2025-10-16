import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "../../helpers/auth";

test.describe("Export drawer (read-only, freeze on)", () => {
  test.beforeEach(async ({ context }) => {
    // Ensure freeze flags are on for this project run
    process.env.CORE_FREEZE = process.env.CORE_FREEZE || "true";
    process.env.SHOPS_FREEZE = process.env.SHOPS_FREEZE || "true";
  });

  test("export endpoint returns CSV for admin under freeze (no UI)", async ({
    page,
    context,
  }) => {
    await loginAsAdmin(page);
    const resp = await context.request.get(
      "/api/products/export?status=active"
    );
    expect(resp.ok()).toBeTruthy();
    const contentType =
      resp.headers()["content-type"] || resp.headers()["Content-Type"];
    expect(String(contentType)).toContain("text/csv");
    const body = await resp.text();
    expect(body.split("\n")[0]).toMatch(
      /sku,title,description,image_urls,base_price,commission_pct,regions,inventory,active/i
    );
  });
});
