import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!stripeSecretKey || typeof stripeSecretKey !== "string") return null;
  if (!stripeInstance) {
    stripeInstance = new Stripe(stripeSecretKey, {
      apiVersion: "2024-06-20",
      typescript: true,
    });
  }
  return stripeInstance;
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
