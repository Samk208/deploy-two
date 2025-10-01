import { vi } from "vitest";

// Default env for tests; individual tests can override
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "sk_test_123"; // Use STRIPE_SECRET_KEY; secret keys must not use NEXT_PUBLIC_ prefix and must remain private
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "pk_test_123";
process.env.NEXT_PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// Provide a default fetch mock; tests can override per-case
if (!(global as any).fetch) {
  (global as any).fetch = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      // Simulate a happy-path /api/checkout response
      if (String(input).includes("/api/checkout")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            sessionId: "cs_test_123",
            url: "https://checkout.stripe.com/test_123",
          }),
          text: async () => "OK",
        } as any;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({}),
        text: async () => "OK",
      } as any;
    }
  );
}
