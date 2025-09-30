// scripts/checkout-diagnostics.ts
// Extracted, testable diagnostics logic (no process.exit calls)

import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';

export const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.TEST_STRIPE_SECRET_KEY;
export const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export interface DiagnosticResult {
  step: string;
  status: 'pass' | 'fail' | 'warning';
  details: string;
  error?: string;
  recommendations?: string[];
}

export const results: DiagnosticResult[] = [];
export function clearResults() {
  results.length = 0;
}

export function addResult(
  step: string,
  status: DiagnosticResult['status'],
  details: string,
  error?: string,
  recommendations?: string[]
) {
  results.push({ step, status, details, error, recommendations });
}

export async function checkStripeKeys() {
  console.log('\n🔍 Step 1: Checking Stripe API keys...\n');

  if (!stripeKey) {
    addResult(
      'Stripe Secret Key',
      'fail',
      'STRIPE_SECRET_KEY not found in environment',
      undefined,
      [
        'Add STRIPE_SECRET_KEY to .env.local',
        'Get key from Stripe Dashboard → Developers → API Keys',
        'Use test key (sk_test_...) for development',
      ]
    );
    return false;
  }

  if (!stripeKey.startsWith('sk_')) {
    addResult(
      'Stripe Secret Key Format',
      'fail',
      'Secret key has invalid format',
      `Key starts with: ${stripeKey.substring(0, 7)}`,
      ['Secret keys should start with sk_test_ or sk_live_']
    );
    return false;
  }

  addResult(
    'Stripe Secret Key',
    'pass',
    `Found ${stripeKey.startsWith('sk_test_') ? 'test' : 'live'} key`
  );

  if (!stripePublicKey) {
    addResult(
      'Stripe Publishable Key',
      'fail',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not found',
      undefined,
      [
        'Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env.local',
        'Must be prefixed with NEXT_PUBLIC_ to be available in browser',
      ]
    );
    return false;
  }

  if (!stripePublicKey.startsWith('pk_')) {
    addResult(
      'Stripe Publishable Key Format',
      'fail',
      'Publishable key has invalid format',
      undefined,
      ['Publishable keys should start with pk_test_ or pk_live_']
    );
    return false;
  }

  const secretEnv = stripeKey.includes('test') ? 'test' : 'live';
  const publicEnv = stripePublicKey.includes('test') ? 'test' : 'live';

  if (secretEnv !== publicEnv) {
    addResult(
      'Stripe Key Pair',
      'fail',
      'Secret and publishable keys are from different environments',
      `Secret: ${secretEnv}, Publishable: ${publicEnv}`,
      [
        'Ensure both keys are from the same environment (both test or both live)',
        'Check Stripe Dashboard for matching key pairs',
      ]
    );
    return false;
  }

  addResult(
    'Stripe Publishable Key',
    'pass',
    `Found ${publicEnv} key, matches secret key environment`
  );

  return true;
}

export async function testStripeConnection() {
  console.log('\n🔍 Step 2: Testing Stripe API connection...\n');

  if (!stripeKey) {
    addResult('Stripe Connection', 'fail', 'Cannot test - no API key');
    return false;
  }

  try {
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const account = await stripe.accounts.retrieve();

    addResult(
      'Stripe Connection',
      'pass',
      `Connected to account: ${(account as any).email || (account as any).id}`
    );

    if (!(account as any).charges_enabled) {
      addResult(
        'Account Status',
        'warning',
        'Account cannot process charges yet',
        'Charges not enabled',
        ['Complete account verification in Stripe Dashboard']
      );
    } else {
      addResult('Account Status', 'pass', 'Account is fully activated');
    }

    return true;
  } catch (error: any) {
    addResult(
      'Stripe Connection',
      'fail',
      'Failed to connect to Stripe',
      error?.message,
      [
        'Verify API key is correct',
        'Check network connectivity',
        'Ensure API key has not been revoked',
      ]
    );
    return false;
  }
}

export async function testCheckoutSessionCreation() {
  console.log('\n🔍 Step 3: Testing Checkout Session creation...\n');

  if (!stripeKey) {
    addResult('Session Creation', 'fail', 'Cannot test - no API key');
    return false;
  }

  try {
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: 1999,
            product_data: {
              name: 'Test Product',
              description: 'Diagnostic test product',
            },
          },
          quantity: 1,
        },
      ],
      success_url:
        'http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/checkout',
      customer_email: 'test@example.com',
    } as any);

    if (!(session as any).id || !(session as any).url) {
      addResult(
        'Session Creation',
        'fail',
        'Session created but missing required fields',
        `ID: ${(session as any).id}, URL: ${(session as any).url}`,
        ['Check Stripe API version compatibility']
      );
      return false;
    }

    addResult(
      'Session Creation',
      'pass',
      'Successfully created checkout session',
      undefined,
      [`Session ID: ${(session as any).id}`, `URL: ${((session as any).url as string)?.substring(0, 50)}...`]
    );

    const retrieved = await stripe.checkout.sessions.retrieve((session as any).id);

    if ((retrieved as any).id !== (session as any).id) {
      addResult('Session Retrieval', 'fail', 'Session retrieval returned different ID');
      return false;
    }

    addResult('Session Retrieval', 'pass', 'Session can be retrieved successfully');

    return true;
  } catch (error: any) {
    addResult(
      'Session Creation',
      'fail',
      'Failed to create checkout session',
      error?.message,
      [
        'Check if account is restricted',
        'Verify line_items format is correct',
        'Ensure success_url and cancel_url are valid',
      ]
    );
    return false;
  }
}

export async function testAPIRoute() {
  console.log('\n🔍 Step 4: Testing /api/checkout endpoint...\n');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${apiUrl}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          {
            productId: 'test_prod_123',
            title: 'Test Product',
            quantity: 1,
            price: 19.99,
            image: 'https://via.placeholder.com/150',
          },
        ],
        customer: {
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        shipping: {
          address: '123 Test St',
          city: 'Seoul',
          postalCode: '12345',
          country: 'KR',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      addResult(
        'API Route',
        'fail',
        `API returned status ${response.status}`,
        errorText,
        [
          'Check if API route file exists: app/api/checkout/route.ts',
          'Verify STRIPE_SECRET_KEY is available to API route',
          'Check server logs for errors',
          'Ensure request body validation is not too strict',
        ]
      );
      return false;
    }

    const data = await response.json();

    if (!(data as any).sessionId || !(data as any).url) {
      addResult(
        'API Route Response',
        'fail',
        'API response missing required fields',
        `Response: ${JSON.stringify(data)}`,
        [
          'API should return { sessionId: string, url: string }',
          'Check API route implementation',
        ]
      );
      return false;
    }

    if (!((data as any).url as string).includes('checkout.stripe.com')) {
      addResult(
        'API Route Response',
        'fail',
        'Stripe URL appears invalid',
        `URL: ${(data as any).url}`,
        ['Verify Stripe session is created correctly in API route']
      );
      return false;
    }

    addResult(
      'API Route',
      'pass',
      'API route working correctly',
      undefined,
      [`Session ID: ${(data as any).sessionId}`, `Stripe URL: ${((data as any).url as string).substring(0, 50)}...`]
    );

    return true;
  } catch (error: any) {
    addResult(
      'API Route',
      'fail',
      'Failed to call API endpoint',
      error?.message,
      [
        'Ensure dev server is running: npm run dev',
        'Check if port 3000 is available',
        'Verify API_URL environment variable if set',
      ]
    );
    return false;
  }
}

export function checkClientSideCode() {
  console.log('\n🔍 Step 5: Checking client-side checkout code...\n');

  const checkoutPagePath = path.join(process.cwd(), 'app/checkout/page.tsx');
  const checkoutComponentPath = path.join(
    process.cwd(),
    'components/shop/checkout-page.tsx'
  );

  if (!fs.existsSync(checkoutPagePath)) {
    addResult(
      'Checkout Page',
      'fail',
      'Checkout page not found',
      `Expected: ${checkoutPagePath}`,
      ['Create app/checkout/page.tsx']
    );
    return false;
  }

  addResult('Checkout Page', 'pass', 'Checkout page file exists');

  if (!fs.existsSync(checkoutComponentPath)) {
    addResult(
      'Checkout Component',
      'warning',
      'Checkout component not found',
      `Expected: ${checkoutComponentPath}`,
      ['Component may be defined elsewhere - verify in page.tsx']
    );
  } else {
    addResult('Checkout Component', 'pass', 'Checkout component file exists');

    const componentCode = fs.readFileSync(checkoutComponentPath, 'utf8');

    if (!componentCode.includes('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')) {
      addResult(
        'Stripe Key Usage',
        'warning',
        'Component may not be using Stripe publishable key',
        undefined,
        ['Verify Stripe.js is properly initialized with publishable key']
      );
    } else {
      addResult('Stripe Key Usage', 'pass', 'Component references publishable key');
    }

    if (!componentCode.includes('window.location') && !componentCode.includes('router.push')) {
      addResult(
        'Redirect Logic',
        'warning',
        'No redirect logic found in component',
        undefined,
        [
          'After session creation, component should redirect to session.url',
          'Use window.location.href = sessionUrl or router.push()',
        ]
      );
    } else {
      addResult('Redirect Logic', 'pass', 'Component has redirect logic');
    }

    if (!componentCode.includes('try') || !componentCode.includes('catch')) {
      addResult(
        'Error Handling',
        'warning',
        'No try-catch error handling found',
        undefined,
        ['Add try-catch blocks around API calls', 'Show error toast/message to user']
      );
    } else {
      addResult('Error Handling', 'pass', 'Component has error handling');
    }

    if (!componentCode.includes('loading') && !componentCode.includes('isSubmitting')) {
      addResult(
        'Loading States',
        'warning',
        'No loading state management found',
        undefined,
        ['Add loading state to prevent double submissions', 'Disable submit button while processing']
      );
    } else {
      addResult('Loading States', 'pass', 'Component manages loading states');
    }
  }

  return true;
}

export function checkSuccessPage() {
  console.log('\n🔍 Step 6: Checking success page...\n');

  const successPagePath = path.join(process.cwd(), 'app/checkout/success/page.tsx');

  if (!fs.existsSync(successPagePath)) {
    addResult(
      'Success Page',
      'fail',
      'Success page not found',
      `Expected: ${successPagePath}`,
      [
        'Create app/checkout/success/page.tsx',
        'Page should verify session_id query param',
        'Retrieve session from Stripe to confirm payment',
      ]
    );
    return false;
  }

  addResult('Success Page', 'pass', 'Success page file exists');

  const successCode = fs.readFileSync(successPagePath, 'utf8');

  if (!successCode.includes('session_id') && !successCode.includes('sessionId')) {
    addResult(
      'Session ID Verification',
      'warning',
      'Success page may not verify session ID',
      undefined,
      [
        'Read session_id from query params',
        'Verify session with Stripe API before showing success',
      ]
    );
  } else {
    addResult('Session ID Verification', 'pass', 'Success page handles session ID');
  }

  return true;
}

export async function checkCartStore() {
  console.log('\n🔍 Step 7: Checking cart store implementation...\n');

  const possiblePaths = [
    path.join(process.cwd(), 'lib/store/cart.ts'),
    path.join(process.cwd(), 'lib/stores/cart.ts'),
    path.join(process.cwd(), 'store/cart.ts'),
    path.join(process.cwd(), 'stores/cart.ts'),
  ];

  let cartStorePath: string | null = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      cartStorePath = p;
      break;
    }
  }

  if (!cartStorePath) {
    addResult(
      'Cart Store',
      'warning',
      'Cart store file not found',
      undefined,
      ['Verify cart state management implementation', 'Check if using different state solution']
    );
    return false;
  }

  addResult('Cart Store', 'pass', `Cart store found at ${path.relative(process.cwd(), cartStorePath)}`);

  const storeCode = fs.readFileSync(cartStorePath, 'utf8');

  if (!storeCode.includes('create') || !storeCode.includes('zustand')) {
    addResult(
      'Cart Store Implementation',
      'warning',
      'May not be using Zustand',
      undefined,
      ['Verify cart state management approach']
    );
  } else {
    addResult('Cart Store Implementation', 'pass', 'Using Zustand for cart state');
  }

  if (!storeCode.includes('items')) {
    addResult(
      'Cart Items',
      'warning',
      'No items array found in cart store',
      undefined,
      ['Cart store should maintain array of cart items']
    );
  } else {
    addResult('Cart Items', 'pass', 'Cart store has items array');
  }

  if (!storeCode.includes('checkout') && !storeCode.includes('getItems')) {
    addResult(
      'Checkout Method',
      'warning',
      'No method to retrieve cart items for checkout',
      undefined,
      ['Add method to get all cart items', 'Or add method to clear cart after successful checkout']
    );
  }

  return true;
}

export function printReport() {
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('          CHECKOUT DIAGNOSTIC REPORT');
  console.log('═══════════════════════════════════════════════════════\n');

  const passed = results.filter((r) => r.status === 'pass').length;
  const warnings = results.filter((r) => r.status === 'warning').length;
  const failed = results.filter((r) => r.status === 'fail').length;

  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';

    console.log(`${icon} ${result.step}`);
    console.log(`   ${result.details}`);

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }

    if (result.recommendations && result.recommendations.length > 0) {
      console.log('   Recommendations:');
      for (const rec of result.recommendations) {
        console.log(`   • ${rec}`);
      }
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log(`Summary: ${passed} passed, ${warnings} warnings, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════\n');

  return { passed, warnings, failed };
}

export async function runAllDiagnostics() {
  clearResults();
  const keysValid = await checkStripeKeys();
  if (!keysValid) {
    return { success: false, results: [...results] };
  }
  await testStripeConnection();
  await testCheckoutSessionCreation();
  await testAPIRoute();
  checkClientSideCode();
  checkSuccessPage();
  await checkCartStore();
  return { success: results.every((r) => r.status !== 'fail'), results: [...results] };
}
