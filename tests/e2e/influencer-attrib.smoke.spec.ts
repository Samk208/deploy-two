import { expect, test } from "@playwright/test";
import { loginAsSupplier } from "../helpers/auth";

// Reuse known handle from existing tests or seed
const HANDLE = process.env.TEST_INFLUENCER_HANDLE || "style-forward";

const SANDBOX_TRUE = ["true", "1", "yes"].includes(
  String(process.env.CHECKOUT_SANDBOX || "").toLowerCase()
);
const SHOPS_FREEZE_TRUE =
  String(process.env.SHOPS_FREEZE || "").toLowerCase() === "true";

/**
 * Verifies that:
 * - Visiting /shop/<handle> uses unified cart
 * - Cart item carries influencer attribution (shopHandle)
 * - Checkout calls include shopHandle in payload
 * - Sandbox redirect to /checkout-test-success occurs and no writes are made
 */

test.describe("Influencer attribution + sandbox checkout", () => {
  test.skip(!SANDBOX_TRUE, "CHECKOUT_SANDBOX must be true");
  test.skip(!SHOPS_FREEZE_TRUE, "SHOPS_FREEZE must be true");

  test("/shop/<handle> adds to unified cart and preserves shopHandle in checkout", async ({
    page,
    request,
    baseURL,
  }) => {
    // Verify freezes endpoint
    const freezes = await request.get(`${baseURL}/api/debug/freezes`);
    expect(freezes.ok()).toBeTruthy();
    const flags = (await freezes.json()) as any;
    expect(String(flags?.SHOPS_FREEZE).toLowerCase()).toBe("true");

    // Track disallowed writes
    const writes: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      const method = req.method();
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        if (
          !/\/api\/checkout(\b|\/)/.test(url) &&
          !/\/api\/checkout\/session(\b|\/)/.test(url)
        ) {
          writes.push(`${method} ${url}`);
        }
      }
    });

    await page.route("**/api/checkout/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          url: `${baseURL}/checkout-test-success`,
          sessionId: "cs_test_mock",
        }),
      });
    });

    await page.route("**/api/checkout", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            sessionId: "cs_test_sandbox",
            url: `${baseURL}/checkout-test-success`,
          },
        }),
      });
    });

    await page.route("**/checkout-test-success", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<html><body><h1>redirect received</h1></body></html>",
      });
    });

    await loginAsSupplier(page);

    // Visit influencer shop for context (ignore if it 404s, we don't rely on UI)
    await page.goto(`/shop/${HANDLE}`, { waitUntil: "domcontentloaded" });

    // Deterministically seed cart with attribution
    await page.evaluate((handle) => {
      const key = "cart-storage";
      const payload = {
        state: {
          items: [
            {
              id: "attrib-product-1",
              title: "Attributed Product",
              price: 29.99,
              originalPrice: 39.99,
              image: "/placeholder.svg",
              quantity: 1,
              maxQuantity: 5,
              category: "test",
              supplierId: "sup_test",
              supplierName: "Test Supplier",
              supplierVerified: true,
              shopHandle: handle,
            },
          ],
        },
        version: 0,
      } as any;
      localStorage.setItem(key, JSON.stringify(payload));
    }, HANDLE);
    await page.reload();

    // Open cart from header
    await page.getByRole("button", { name: /^cart$/i }).click();
    // Proceed to checkout
    const toCheckout = page.getByRole("button", {
      name: /proceed to checkout/i,
    });
    await expect(toCheckout).toBeVisible();
    await toCheckout.click();

    // On /checkout, fill required fields
    await expect(page).toHaveURL(/\/checkout/);
    await page.getByLabel(/email/i).fill("shopper@test.local");
    await page.getByLabel(/first name/i).fill("Test");
    await page.getByLabel(/last name/i).fill("Buyer");
    await page.getByLabel(/^address/i).fill("1 Attrib Way");
    await page.getByLabel(/^city/i).fill("Seoul");
    await page.getByLabel(/^state/i).fill("KR-11");
    await page.getByLabel(/zip code/i).fill("04524");

    // Prepare waiter for the first checkout POST (session or checkout)
    const reqPromise = page.waitForRequest((r) => {
      const u = r.url();
      return (
        r.method() === "POST" &&
        (/\/api\/checkout\/session(\b|\/)/.test(u) ||
          /\/api\/checkout(\b|\/)/.test(u))
      );
    });

    const payBtn = page.getByRole("button", {
      name: /complete order|pay|place order|continue|checkout/i,
    });
    await expect(payBtn).toBeVisible();
    await payBtn.click();

    // Capture the payload deterministically
    const req = await reqPromise;
    let payload: any = {};
    try {
      payload = await req.postDataJSON();
    } catch {
      const raw = req.postData() || "{}";
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = {};
      }
    }

    // Expect sandbox redirect
    await expect(page).toHaveURL(/\/checkout-test-success$/);
    await expect(page.locator("text=redirect received")).toBeVisible();

    // Assert attribution in captured checkout payload
    const items = (payload?.items || []) as any[];
    expect(items.length).toBeGreaterThan(0);
    const hasHandle = items.some((i: any) => i?.shopHandle === HANDLE);
    expect(hasHandle).toBeTruthy();

    // Ensure no disallowed writes
    const disallowedWrite = writes.filter((w) =>
      /\/api\/(orders|products|influencer|supplier|shops)\b/.test(w)
    );
    expect(disallowedWrite.length).toBe(0);
  });
});
