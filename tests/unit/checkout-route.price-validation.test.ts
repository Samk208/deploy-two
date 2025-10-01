import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

// Supabase returns one product with price; toggle invalid with env flag
const makeSupabaseMock = (price: any) => ({
  from: () => ({
    select: () => ({
      in: () => ({
        eq: () => ({
          eq: () =>
            Promise.resolve({
              data: [
                {
                  id: "p1",
                  title: "P1",
                  price,
                  images: [],
                  in_stock: true,
                  stock_count: 10,
                  supplier_id: "s1",
                  commission: 10,
                  active: true,
                },
              ],
              error: null,
            }),
        }),
      }),
    }),
  }),
});

vi.mock("../../lib/supabase/server", () => {
  return {
    createServerSupabaseClient: vi.fn(async () =>
      makeSupabaseMock(vi.getMockedSystemTime?.() ? 0 : 19.99)
    ),
  };
});

vi.mock("../../lib/auth-helpers", () => ({
  getCurrentUser: vi.fn(async () => ({
    id: "user_1",
    email: "user@example.com",
  })),
}));

vi.mock("../../lib/stripe", () => ({
  stripe: {} as any,
  formatAmountForStripe: (n: number) => Math.round(n * 100),
}));

import { POST } from "../../app/api/checkout/route";

function makeRequest(body: any): any {
  return {
    json: async () => body,
    headers: new Map(),
    nextUrl: { origin: "http://localhost:3001" },
  } as any;
}

describe("checkout route - price validation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "test");
    process.env.STRIPE_SECRET_KEY = "sk_test_abc";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://example";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  });

  afterEach(() => {
    Object.assign(process.env, ORIGINAL_ENV);
  });

  it("succeeds when price is valid and > 0", async () => {
    // Override supabase mock to return valid price 19.99
    const server = await import("../../lib/supabase/server");
    (server.createServerSupabaseClient as any).mockResolvedValueOnce(
      makeSupabaseMock(19.99)
    );

    const req = makeRequest({
      items: [{ productId: "p1", quantity: 2 }],
      shippingAddress: {
        address: "123",
        city: "X",
        state: "Y",
        zipCode: "Z",
        country: "US",
      },
      billingAddress: {
        address: "123",
        city: "X",
        state: "Y",
        zipCode: "Z",
        country: "US",
      },
    });
    const res = await POST(req);
    expect((res as any).status).toBe(200);
  });

  it("fails when price is invalid (NaN)", async () => {
    const server = await import("../../lib/supabase/server");
    (server.createServerSupabaseClient as any).mockResolvedValueOnce(
      makeSupabaseMock(NaN)
    );

    const req = makeRequest({
      items: [{ productId: "p1", quantity: 1 }],
      shippingAddress: {
        address: "123",
        city: "X",
        state: "Y",
        zipCode: "Z",
        country: "US",
      },
      billingAddress: {
        address: "123",
        city: "X",
        state: "Y",
        zipCode: "Z",
        country: "US",
      },
    });
    const res = await POST(req);
    expect((res as any).status).toBe(400);
  });

  it("fails when Stripe unit amount would be 0 (price 0)", async () => {
    const server = await import("../../lib/supabase/server");
    (server.createServerSupabaseClient as any).mockResolvedValueOnce(
      makeSupabaseMock(0)
    );

    const req = makeRequest({
      items: [{ productId: "p1", quantity: 1 }],
      shippingAddress: {
        address: "123",
        city: "X",
        state: "Y",
        zipCode: "Z",
        country: "US",
      },
      billingAddress: {
        address: "123",
        city: "X",
        state: "Y",
        zipCode: "Z",
        country: "US",
      },
    });
    const res = await POST(req);
    expect((res as any).status).toBe(400);
  });
});
