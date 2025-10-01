import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock environment as production to assert fail-fast behavior
const ORIGINAL_ENV = { ...process.env };

// Mocks
vi.mock("../../lib/supabase/server", () => {
  return {
    createServerSupabaseClient: vi.fn(async () => {
      // Minimal supabase client mock with query builder returning no products
      const queryBuilder: any = {
        select: () => queryBuilder,
        in: () => queryBuilder,
        eq: () => queryBuilder,
      };
      return {
        from: () => ({
          select: () => ({
            in: () => ({
              eq: () => ({
                eq: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
          }),
        }),
      } as any;
    }),
  };
});

vi.mock("../../lib/auth-helpers", () => ({
  getCurrentUser: vi.fn(async () => ({
    id: "user_1",
    email: "user@example.com",
  })),
}));

// Mock Stripe client to avoid real calls
vi.mock("../../lib/stripe", async () => {
  return {
    stripe: {} as any,
    formatAmountForStripe: (n: number) => Math.round(n * 100),
  };
});

// Import route under test AFTER mocks
import { POST } from "../../app/api/checkout/route";

function makeRequest(body: any): any {
  return {
    json: async () => body,
    headers: new Map(),
    nextUrl: { origin: "http://localhost:3001" },
  } as any;
}

describe("checkout route - production fail fast when products missing", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    process.env.NODE_ENV = "production";
    process.env.STRIPE_SECRET_KEY = "sk_test_abc";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://example";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service_role";
  });

  afterEach(() => {
    Object.assign(process.env, ORIGINAL_ENV);
  });

  it("returns 400 when no products found", async () => {
    const req = makeRequest({
      items: [{ productId: "nonexistent", quantity: 1 }],
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
    // NextResponse.json-like: ensure status code is 400
    expect((res as any).status).toBe(400);
  });
});
