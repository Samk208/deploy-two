import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY!

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const formatAmountForStripe = (amount: number, currency: string = 'usd'): number => {
  // Convert to smallest currency unit (cents for USD, etc.)
  const numberFormat = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  })
  
  const parts = numberFormat.formatToParts(amount)
  let zeroDecimalCurrency = true
  
  for (const part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false
      break
    }
  }
  
  return zeroDecimalCurrency ? amount : Math.round(amount * 100)
}

export const formatAmountFromStripe = (amount: number, currency: string = 'usd'): number => {
  const numberFormat = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  })
  
  const parts = numberFormat.formatToParts(amount)
  let zeroDecimalCurrency = true
  
  for (const part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false
      break
    }
  }
  
  return zeroDecimalCurrency ? amount : amount / 100
}
