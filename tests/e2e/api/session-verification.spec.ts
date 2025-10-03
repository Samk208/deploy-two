import { test, expect } from "@playwright/test";
import { loginAsSupplier, loginAsInfluencer } from "../../helpers/auth";

test.describe("Session & Role API Verification", () => {
  test("supplier session exposes correct role and supplier dashboard API authorized", async ({ page, request }) => {
    await loginAsSupplier(page);

    const sessionRes = await request.get("/api/auth/session");
    expect(sessionRes.status()).toBeLessThan(400);
    const session = await sessionRes.json();
    expect(session).toBeDefined();
    expect(session?.user).toBeDefined();
    expect(session?.user?.role).toBe("supplier");

    const dashRes = await request.get("/api/dashboard/supplier");
    expect(dashRes.status()).toBe(200);
  });

  test("influencer session exposes correct role; supplier dashboard API forbidden", async ({ page, request }) => {
    await loginAsInfluencer(page);

    const sessionRes = await request.get("/api/auth/session");
    expect(sessionRes.status()).toBeLessThan(400);
    const session = await sessionRes.json();
    expect(session).toBeDefined();
    expect(session?.user).toBeDefined();
    expect(session?.user?.role).toBe("influencer");

    const supplierDash = await request.get("/api/dashboard/supplier");
    expect([401, 403]).toContain(supplierDash.status());
  });
});
