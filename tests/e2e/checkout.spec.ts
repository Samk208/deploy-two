import { expect, test } from "@playwright/test";

const HANDLE = "style-forward";

// Creates a Stripe Checkout session via our API using a real seeded product.
// Skips if STRIPE_SECRET_KEY is not available (prevents false negatives locally).

test.describe("Checkout API", () => {
  test("creates checkout session for influencer shop product", async ({
    request,
    baseURL,
  }) => {
    test.skip(
      !process.env.STRIPE_SECRET_KEY,
      "STRIPE_SECRET_KEY missing; skipping checkout test"
    );

    // 1) Get products from the influencer shop API
    const shopRes = await request.get(`${baseURL}/api/shop/${HANDLE}`);
    expect(shopRes.ok()).toBeTruthy();
    const shopJson = (await shopRes.json()) as any;
    expect(shopJson?.ok).toBeTruthy();
    const first = shopJson?.data?.products?.[0];
    expect(first).toBeTruthy();

    // 2) Post to checkout API
    const payload = {
      items: [
        {
          productId: first.id,
          quantity: 1,
          // help route infer influencer context
          shopHandle: HANDLE,
          // provide effectivePrice to allow sale price testing
          effectivePrice: first.sale_price ?? first.price,
          image: first.image,
          title: first.title,
        },
      ],
      shippingAddress: { line1: "123 Test", city: "Seoul", country: "KR" },
      billingAddress: { line1: "123 Test", city: "Seoul", country: "KR" },
    };

    const res = await request.post(`${baseURL}/api/checkout`, {
      data: payload,
    });

    expect(res.ok()).toBeTruthy();
    const json = (await res.json()) as any;
    expect(json?.ok).toBeTruthy();
    expect(json?.data?.sessionId).toBeTruthy();
    expect(typeof json?.data?.url).toBe("string");
    expect(String(json?.data?.url)).toContain("checkout"); // usually checkout.stripe.com
  });
});
