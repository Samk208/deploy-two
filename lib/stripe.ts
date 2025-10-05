import Stripe from "stripe";

// Exposed for tests to mock via vi.mock("../../lib/stripe", () => ({ stripe: {} }))
export let stripe: Stripe | null = null;

export function setStripeClient(client: Stripe | null) {
  stripe = client;
}

export function getStripe(): Stripe | null {
  if (stripe) return stripe;
  const key = process.env.STRIPE_SECRET_KEY || "";
  if (!key || typeof key !== "string") return null;
  stripe = new Stripe(key, {
    apiVersion: "2023-10-16",
    typescript: true,
  });
  return stripe;
}

export const formatAmountForStripe = (
  amount: number,
  currency: string = "usd"
): number => {
  // Convert to smallest currency unit (cents for USD, etc.)
  const numberFormat = new Intl.NumberFormat(["en-US"], {
    style: "currency",
    currency: currency,
    currencyDisplay: "symbol",
  });

  const parts = numberFormat.formatToParts(amount);
  let zeroDecimalCurrency = true;

  for (const part of parts) {
    if (part.type === "decimal") {
      zeroDecimalCurrency = false;
      break;
    }
  }

  return zeroDecimalCurrency ? amount : Math.round(amount * 100);
};

export const formatAmountFromStripe = (
  amount: number,
  currency: string = "usd"
): number => {
  const numberFormat = new Intl.NumberFormat(["en-US"], {
    style: "currency",
    currency: currency,
    currencyDisplay: "symbol",
  });

  const parts = numberFormat.formatToParts(amount);
  let zeroDecimalCurrency = true;

  for (const part of parts) {
    if (part.type === "decimal") {
      zeroDecimalCurrency = false;
      break;
    }
  }

  return zeroDecimalCurrency ? amount : amount / 100;
};
