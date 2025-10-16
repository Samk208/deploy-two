import { expect, test } from "@playwright/test";
import { loginAsSupplier } from "../../helpers/auth";

const CSV = `sku,title,description,image_urls,base_price,commission_pct,regions,inventory,active
SKU-CSV-1,CSV Item,Desc,,19.99,10,Global,5,true`;

test.describe("Import preview (read-only, freeze on)", () => {
  test.beforeEach(async () => {
    process.env.CORE_FREEZE = process.env.CORE_FREEZE || "true";
    process.env.SHOPS_FREEZE = process.env.SHOPS_FREEZE || "true";
  });

  test("validates CSV using preview endpoint without writes", async ({
    page,
    context,
  }) => {
    // Preview endpoint requires auth; use admin to avoid supplier credential variance
    await page.goto("/sign-in");
    const { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } = process.env as any;
    await page
      .getByLabel(/email/i)
      .fill(TEST_ADMIN_EMAIL || "test.admin+e2e@test.local");
    await page
      .getByLabel(/password/i)
      .fill(TEST_ADMIN_PASSWORD || "TestAdmin123!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/admin\/dashboard/i);
    const base64 = Buffer.from(CSV, "utf8").toString("base64");
    const resp = await context.request.get(
      `/api/products/import/preview?data=${encodeURIComponent(base64)}`
    );
    expect(resp.ok()).toBeTruthy();
    const json = await resp.json();
    expect(json?.ok).toBe(true);
    expect(json?.data?.total).toBeGreaterThan(0);
  });

  test("UI: shows preview table and blocks commit under freeze", async ({
    page,
  }) => {
    await loginAsSupplier(page);
    await page.goto("/dashboard/supplier/products");

    // Open import dialog using stable test id
    const importBtn = page.getByTestId("open-import-dialog");
    await expect(importBtn).toBeVisible();
    await importBtn.scrollIntoViewIfNeeded();
    // Use DOM-level click to avoid overlay intercepting pointer events
    await importBtn.evaluate((el: HTMLElement) => el.click());
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15000 });

    // Attach file by setting the hidden input directly (stable)
    await page.setInputFiles("#csv-upload", {
      name: "sample.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(CSV, "utf8"),
    });

    // Preview step appears (check for Dry run checkbox)
    await expect(page.getByLabel(/Dry run/i)).toBeVisible();

    // Attempt commit (uncheck Dry-run first)
    const dryRunCheckbox = page.getByLabel(/Dry run/i);
    await dryRunCheckbox.uncheck();
    await page
      .getByRole("button", {
        name: /Commit Import|Import for Real|Processing/i,
      })
      .click();

    // Expect a freeze/read-only message
    await expect(page.getByText(/Frozen|read-only|423/i)).toBeVisible({
      timeout: 15000,
    });
  });
});
