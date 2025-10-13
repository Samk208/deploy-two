import { test, expect } from "@playwright/test";
import { loginAsSupplier } from "../helpers/auth";

const SANDBOX_TRUE = String(process.env.CHECKOUT_SANDBOX || "").toLowerCase() === "true";
const SHOPS_FREEZE_TRUE = String(process.env.SHOPS_FREEZE || "").toLowerCase() === "true";

test.describe("Freeze/Sandbox Checkout", () => {
  test.skip(!SANDBOX_TRUE, "CHECKOUT_SANDBOX must be true");
  test.skip(!SHOPS_FREEZE_TRUE, "SHOPS_FREEZE must be true");

  test("supplier can run sandbox checkout flow without real writes", async ({ page, request, baseURL }) => {
    const freezes = await request.get(`${baseURL}/api/debug/freezes`);
    expect(freezes.ok()).toBeTruthy();
    const flags = (await freezes.json()) as any;
    expect(String(flags?.SHOPS_FREEZE).toLowerCase()).toBe("true");

    const writes: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      const method = req.method();
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        if (!/\/api\/checkout(\b|\/)/.test(url)) {
          writes.push(`${method} ${url}`);
        }
      }
    });

    await page.route("**/api/checkout", async (route) => {
      const json = {
        ok: true,
        data: {
          sessionId: "cs_test_sandbox",
          url: `${baseURL}/checkout-test-success`,
        },
        message: "Checkout session created successfully (sandbox)",
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(json),
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

    // Use the public shop route
    await page.goto("/shop", { waitUntil: "domcontentloaded" });

    // Try normal add-to-cart first; if not present (e.g., empty DB), seed cart via localStorage
    const addToCart = page.getByRole("button", { name: /add to cart/i }).first();
    const found = await addToCart.isVisible().catch(() => false);
    if (found) {
      await addToCart.click();
    } else {
      await page.evaluate(() => {
        const key = "cart-storage";
        const payload = {
          state: {
            items: [
              {
                id: "test-product-1",
                title: "Sandbox Test Product",
                price: 19.99,
                originalPrice: 24.99,
                image: "/placeholder.svg",
                quantity: 1,
                maxQuantity: 5,
                category: "test",
                supplierId: "sup_test",
                supplierName: "Test Supplier",
                supplierVerified: true,
              },
            ],
          },
          version: 0,
        } as any;
        localStorage.setItem(key, JSON.stringify(payload));
      });
      await page.reload();
    }

    // Open cart from header button (aria-label="Cart")
    await page.getByRole("button", { name: /^cart$/i }).click();

    // Proceed to checkout from the cart sidebar
    const toCheckout = page.getByRole("button", { name: /proceed to checkout/i });
    await expect(toCheckout).toBeVisible();
    await toCheckout.click();

    await expect(page).toHaveURL(/\/checkout/);

    const payBtn = page.getByRole("button", { name: /complete order|pay|place order|continue|checkout/i });
    await expect(payBtn).toBeVisible();
    await payBtn.click();

    await expect(page).toHaveURL(/\/checkout-test-success$/);
    await expect(page.locator("text=redirect received")).toBeVisible();

    const disallowedWrite = writes.filter((w) => /\/api\/(orders|products|influencer|supplier|shops)\b/.test(w));
    expect(disallowedWrite.length).toBe(0);
  });
});
