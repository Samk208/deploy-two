/**
 * Checkout diagnostics
 * Run with: tsx scripts/diagnose-checkout.ts
 */

import Stripe from 'stripe'

interface DiagnosticResult {
  check: string
  status: 'pass' | 'fail' | 'warning'
  details: string
  recommendations?: string[]
}

const results: DiagnosticResult[] = []

function addResult(
  check: string,
  status: DiagnosticResult['status'],
  details: string,
  recommendations?: string[]
) {
  results.push({ check, status, details, recommendations })
}

function printReport() {
  console.log('\n\n═══════════════════════════════════════════════════════')
  console.log('              CHECKOUT DIAGNOSTIC REPORT')
  console.log('═══════════════════════════════════════════════════════\n')

  const passed = results.filter((r) => r.status === 'pass').length
  const warnings = results.filter((r) => r.status === 'warning').length
  const failed = results.filter((r) => r.status === 'fail').length

  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'
    console.log(`${icon} ${result.check}`)
    console.log(`   ${result.details}`)
    if (result.recommendations?.length) {
      console.log('   Recommendations:')
      for (const rec of result.recommendations) console.log(`   • ${rec}`)
    }
    console.log('')
  }

  console.log('═══════════════════════════════════════════════════════')
  console.log(`Summary: ${passed} passed, ${warnings} warnings, ${failed} failed`)
  console.log('═══════════════════════════════════════════════════════\n')

  if (failed > 0) {
    console.log('⚠️  RECOMMENDATION: Fix critical issues before testing end-to-end\n')
  } else if (warnings > 0) {
    console.log('✅ No critical issues found. Safe to proceed with testing.\n')
  } else {
    console.log('✅ All checks passed!\n')
  }
}

async function checkEnv() {
  console.log('\n🔍 Checking environment variables...')
  const secret = process.env.STRIPE_SECRET_KEY
  const pub = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  if (!secret) addResult('Stripe Secret Key', 'fail', 'STRIPE_SECRET_KEY is missing', ['Add sk_test_... to env'])
  else addResult('Stripe Secret Key', 'pass', 'Found STRIPE_SECRET_KEY')

  if (!pub) addResult('Stripe Publishable Key', 'fail', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing', ['Add pk_test_... to env'])
  else addResult('Stripe Publishable Key', 'pass', 'Found NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')

  if (secret && !/^sk_(test|live)_/.test(secret)) {
    addResult('Stripe Secret Format', 'warning', 'Secret key format is unusual', ['Expected to start with sk_test_ in dev'])
  } else if (secret?.startsWith('sk_live_')) {
    addResult('Stripe Mode', 'warning', 'Using LIVE secret key', ['Use sk_test_ for development'])
  } else if (secret?.startsWith('sk_test_')) {
    addResult('Stripe Mode', 'pass', 'Using TEST secret key')
  }

  if (pub && !/^pk_(test|live)_/.test(pub)) {
    addResult('Stripe Publishable Format', 'warning', 'Publishable key format is unusual', ['Expected to start with pk_test_ in dev'])
  }
}

async function checkStripeConnectivity() {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) return

  console.log('\n🔍 Connecting to Stripe...')
  const stripe = new Stripe(secret, {})
  try {
    const account = await stripe.accounts.retrieve()
    addResult('Stripe Connection', 'pass', `Connected to account ${account.id}`)
  } catch (e: any) {
    addResult('Stripe Connection', 'fail', `Failed to connect: ${e?.message || e}`,[
      'Verify STRIPE_SECRET_KEY value',
      'Ensure network access to api.stripe.com'
    ])
  }
}

async function checkStripeSessionCreation() {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) return

  console.log('\n🔍 Creating test Checkout Session via Stripe API...')
  const stripe = new Stripe(secret, {})
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: 500,
            product_data: { name: 'Diagnostics Test Item' },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
    })
    if (session.id && session.url) {
      addResult('Stripe Session Creation', 'pass', `Created session ${session.id}`)
    } else {
      addResult('Stripe Session Creation', 'fail', 'Session missing id or url')
    }
  } catch (e: any) {
    addResult('Stripe Session Creation', 'fail', `Error: ${e?.message || e}`,[
      'Confirm keys are test keys',
      'Check account has Checkout enabled'
    ])
  }
}

async function checkApiRoute() {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const url = `${base}/api/checkout`
  console.log(`\n🔍 Testing API route: POST ${url}`)

  const payload = {
    items: [
      { productId: 'diagnostic-test', quantity: 1, price: 5.0, title: 'Diagnostics Item' },
    ],
    shippingAddress: {
      firstName: 'Diag', lastName: 'Bot', address: '1 Test Way', city: 'Testville', state: 'TS', zipCode: '00000', country: 'US'
    },
    billingAddress: {
      firstName: 'Diag', lastName: 'Bot', address: '1 Test Way', city: 'Testville', state: 'TS', zipCode: '00000', country: 'US'
    }
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.text()
      addResult('API /api/checkout', 'fail', `HTTP ${res.status}: ${body.slice(0, 200)}`,[
        'Ensure the Next.js server is running',
        'Check runtime logs for validation or Stripe errors'
      ])
      return
    }

    const data: any = await res.json()
    if (data?.ok && data?.data?.url && typeof data.data.url === 'string') {
      const ok = data.data.url.includes('checkout.stripe.com')
      addResult('API Response', ok ? 'pass' : 'warning', `ok=${data.ok}, url=${data.data.url}`,[
        'Client should redirect with window.location or stripe.redirectToCheckout'
      ])
    } else {
      addResult('API Response', 'fail', `Unexpected payload: ${JSON.stringify(data).slice(0, 200)}`,[
        'Make sure handler returns { ok, data: { sessionId, url } }'
      ])
    }
  } catch (e: any) {
    addResult('API /api/checkout', 'warning', `Request failed: ${e?.message || e}`,[
      'Start the dev server or set NEXT_PUBLIC_APP_URL to a running instance'
    ])
  }
}

async function main() {
  await checkEnv()
  await checkStripeConnectivity()
  await checkStripeSessionCreation()
  await checkApiRoute()
  printReport()
}

main().catch((e) => {
  console.error('Unexpected diagnostics error:', e)
  process.exitCode = 1
})
