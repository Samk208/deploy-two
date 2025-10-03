// scripts/checkout-diagnostics.ts
// Extracted, testable diagnostics logic (no process.exit calls)

import fs from "fs";
import path from "path";
import Stripe from "stripe";

export const stripeKey =
  process.env.STRIPE_SECRET_KEY || process.env.TEST_STRIPE_SECRET_KEY;
export const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export interface DiagnosticResult {
  step: string;
  status: "pass" | "fail" | "warning";
  details: string;
  error?: string;
  recommendations?: string[];
}

export function addResult(
  step: string,
  status: DiagnosticResult["status"],
  details: string,
  error?: string,
  recommendations?: string[]
): DiagnosticResult {
  return { step, status, details, error, recommendations };
}

export async function checkStripeKeys(): Promise<DiagnosticResult[] | false> {
  console.log("\n🔍 Step 1: Checking Stripe API keys...\n");
  const out: DiagnosticResult[] = [];
  if (!stripeKey) {
    out.push(
      addResult(
        "Stripe Secret Key",
        "fail",
        "STRIPE_SECRET_KEY not found in environment",
        undefined,
        [
          "Add STRIPE_SECRET_KEY to .env.local",
          "Get key from Stripe Dashboard → Developers → API Keys",
          "Use test key (sk_test_...) for development",
        ]
      )
    );
    return out;
  }

  if (!stripeKey.startsWith("sk_")) {
    out.push(
      addResult(
        "Stripe Secret Key Format",
        "fail",
        "Secret key has invalid format",
        `Key prefix (masked): ${stripeKey.slice(0, 4)}***`,
        ["Secret keys should start with sk_test_ or sk_live_"]
      )
    );
    return out;
  }

  out.push(
    addResult(
      "Stripe Secret Key",
      "pass",
      `Found ${stripeKey.startsWith("sk_test_") ? "test" : "live"} key`
    )
  );

  if (!stripePublicKey) {
    out.push(
      addResult(
        "Stripe Publishable Key",
        "fail",
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not found",
        undefined,
        [
          "Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env.local",
          "Must be prefixed with NEXT_PUBLIC_ to be available in browser",
        ]
      )
    );
    return out;
  }

  if (!stripePublicKey.startsWith("pk_")) {
    out.push(
      addResult(
        "Stripe Publishable Key Format",
        "fail",
        "Publishable key has invalid format",
        undefined,
        ["Publishable keys should start with pk_test_ or pk_live_"]
      )
    );
    return out;
  }

  const secretEnv = stripeKey.startsWith("sk_test") ? "test" : "live";
  const publicEnv = stripePublicKey.startsWith("pk_test") ? "test" : "live";

  if (secretEnv !== publicEnv) {
    out.push(
      addResult(
        "Stripe Key Pair",
        "fail",
        "Secret and publishable keys are from different environments",
        `Secret: ${secretEnv}, Publishable: ${publicEnv}`,
        [
          "Ensure both keys are from the same environment (both test or both live)",
          "Check Stripe Dashboard for matching key pairs",
        ]
      )
    );
    return out;
  }

  out.push(
    addResult(
      "Stripe Publishable Key",
      "pass",
      `Found ${publicEnv} key, matches secret key environment`
    )
  );
  return out;
}

export async function testStripeConnection(): Promise<DiagnosticResult[]> {
  console.log("\n🔍 Step 2: Testing Stripe API connection...\n");
  const out: DiagnosticResult[] = [];
  if (!stripeKey) {
    out.push(addResult("Stripe Connection", "fail", "Cannot test - no API key"));
    return out;
  }

  try {
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const account = await stripe.accounts.retrieve();

    out.push(
      addResult(
        "Stripe Connection",
        "pass",
        `Connected to account: ${(account as any).email || (account as any).id}`
      )
    );

    if (!(account as any).charges_enabled) {
      out.push(
        addResult(
          "Account Status",
          "warning",
          "Account cannot process charges yet",
          "Charges not enabled",
          ["Complete account verification in Stripe Dashboard"]
        )
      );
    } else {
      out.push(addResult("Account Status", "pass", "Account is fully activated"));
    }
    return out;
  } catch (error: any) {
    out.push(
      addResult(
        "Stripe Connection",
        "fail",
        "Failed to connect to Stripe",
        error?.message,
        [
          "Verify API key is correct",
          "Check network connectivity",
          "Ensure API key has not been revoked",
        ]
      )
    );
    return out;
  }
}

export async function testCheckoutSessionCreation(): Promise<DiagnosticResult[]> {
  console.log("\n🔍 Step 3: Testing Checkout Session creation...\n");
  const out: DiagnosticResult[] = [];
  if (!stripeKey) {
    out.push(addResult("Session Creation", "fail", "Cannot test - no API key"));
    return out;
  }

  try {
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Prefer PLAYWRIGHT_BASE_URL for E2E, fallback to BASE_URL, then site/api URLs, finally localhost
    const baseUrl =
      process.env.PLAYWRIGHT_BASE_URL ||
      process.env.BASE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: 1999,
            product_data: {
              name: "Test Product",
              description: "Diagnostic test product",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl.replace(/\/$/, "")}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl.replace(/\/$/, "")}/checkout`,
      customer_email: "test@example.com",
    } as any);

    if (!(session as any).id || !(session as any).url) {
      out.push(
        addResult(
          "Session Creation",
          "fail",
          "Session created but missing required fields",
          `ID: ${(session as any).id}, URL: ${(session as any).url}`,
          ["Check Stripe API version compatibility"]
        )
      );
      return out;
    }

    out.push(
      addResult(
        "Session Creation",
        "pass",
        "Successfully created checkout session",
        undefined,
        [
          `Session ID: ${(session as any).id}`,
          `URL: ${((session as any).url as string)?.substring(0, 50)}...`,
        ]
      )
    );

    const retrieved = await stripe.checkout.sessions.retrieve(
      (session as any).id
    );

    if ((retrieved as any).id !== (session as any).id) {
      out.push(
        addResult(
          "Session Retrieval",
          "fail",
          "Session retrieval returned different ID"
        )
      );
      return out;
    }

    out.push(
      addResult(
        "Session Retrieval",
        "pass",
        "Session can be retrieved successfully"
      )
    );
    return out;
  } catch (error: any) {
    out.push(
      addResult(
        "Session Creation",
        "fail",
        "Failed to create checkout session",
        error?.message,
        [
          "Check if account is restricted",
          "Verify line_items format is correct",
          "Ensure success_url and cancel_url are valid",
        ]
      )
    );
    return out;
  }
}

export async function testAPIRoute(): Promise<DiagnosticResult[]> {
  console.log("\n🔍 Step 4: Testing /api/checkout endpoint...\n");
  const out: DiagnosticResult[] = [];
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  try {
    const response = await fetch(`${apiUrl}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [
          {
            productId: "test_prod_123",
            title: "Test Product",
            quantity: 1,
            price: 19.99,
            image: "https://via.placeholder.com/150",
          },
        ],
        customer: {
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
        },
        shipping: {
          address: "123 Test St",
          city: "Seoul",
          postalCode: "12345",
          country: "KR",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      out.push(
        addResult(
          "API Route",
          "fail",
          `API returned status ${response.status}`,
          errorText,
          [
            "Check if API route file exists: app/api/checkout/route.ts",
            "Verify STRIPE_SECRET_KEY is available to API route",
            "Check server logs for errors",
            "Ensure request body validation is not too strict",
          ]
        )
      );
      return out;
    }

    const data = await response.json();

    if (!(data as any).sessionId || !(data as any).url) {
      out.push(
        addResult(
          "API Route Response",
          "fail",
          "API response missing required fields",
          `Response: ${JSON.stringify(data)}`,
          [
            "API should return { sessionId: string, url: string }",
            "Check API route implementation",
          ]
        )
      );
      return out;
    }

    if (!((data as any).url as string).includes("checkout.stripe.com")) {
      out.push(
        addResult(
          "API Route Response",
          "fail",
          "Stripe URL appears invalid",
          `URL: ${(data as any).url}`,
          ["Verify Stripe session is created correctly in API route"]
        )
      );
      return out;
    }

    out.push(addResult("API Route", "pass", "API route working correctly", undefined, [
      `Session ID: ${(data as any).sessionId}`,
      `Stripe URL: ${((data as any).url as string).substring(0, 50)}...`,
    ]));
    return out;
  } catch (error: any) {
    out.push(
      addResult(
        "API Route",
        "fail",
        "Failed to call API endpoint",
        error?.message,
        [
          "Ensure dev server is running: npm run dev",
          "Check if port 3000 is available",
          "Verify API_URL environment variable if set",
        ]
      )
    );
    return out;
  }
}

export function checkClientSideCode(): DiagnosticResult[] {
  console.log("\n🔍 Step 5: Checking client-side checkout code...\n");
  const out: DiagnosticResult[] = [];
  const checkoutPagePath = path.join(process.cwd(), "app/checkout/page.tsx");
  const checkoutComponentPath = path.join(
    process.cwd(),
    "components/shop/checkout-page.tsx"
  );

  if (!fs.existsSync(checkoutPagePath)) {
    out.push(
      addResult(
        "Checkout Page",
        "fail",
        "Checkout page not found",
        `Expected: ${checkoutPagePath}`,
        ["Create app/checkout/page.tsx"]
      )
    );
    return out;
  }
  out.push(addResult("Checkout Page", "pass", "Checkout page file exists"));

  if (!fs.existsSync(checkoutComponentPath)) {
    out.push(
      addResult(
        "Checkout Component",
        "warning",
        "Checkout component not found",
        `Expected: ${checkoutComponentPath}`,
        ["Component may be defined elsewhere - verify in page.tsx"]
      )
    );
  } else {
    out.push(addResult("Checkout Component", "pass", "Checkout component file exists"));

    const componentCode = fs.readFileSync(checkoutComponentPath, "utf8");

    if (!componentCode.includes("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY")) {
      out.push(
        addResult(
          "Stripe Key Usage",
          "warning",
          "Component may not be using Stripe publishable key",
          undefined,
          ["Verify Stripe.js is properly initialized with publishable key"]
        )
      );
    } else {
      out.push(
        addResult(
          "Stripe Key Usage",
          "pass",
          "Component references publishable key"
        )
      );
    }

    if (
      !componentCode.includes("window.location") &&
      !componentCode.includes("router.push")
    ) {
      out.push(
        addResult(
          "Redirect Logic",
          "warning",
          "No redirect logic found in component",
          undefined,
          [
            "After session creation, component should redirect to session.url",
            "Use window.location.href = sessionUrl or router.push()",
          ]
        )
      );
    } else {
      out.push(addResult("Redirect Logic", "pass", "Component has redirect logic"));
    }

    if (!componentCode.includes("try") || !componentCode.includes("catch")) {
      out.push(
        addResult(
          "Error Handling",
          "warning",
          "No try-catch error handling found",
          undefined,
          [
            "Add try-catch blocks around API calls",
            "Show error toast/message to user",
          ]
        )
      );
    } else {
      out.push(addResult("Error Handling", "pass", "Component has error handling"));
    }

    if (
      !componentCode.includes("loading") &&
      !componentCode.includes("isSubmitting")
    ) {
      out.push(
        addResult(
          "Loading States",
          "warning",
          "No loading state management found",
          undefined,
          [
            "Add loading state to prevent double submissions",
            "Disable submit button while processing",
          ]
        )
      );
    } else {
      out.push(
        addResult(
          "Loading States",
          "pass",
          "Component manages loading states"
        )
      );
    }
  }
  return out;
}

export function checkSuccessPage(): DiagnosticResult[] {
  console.log("\n🔍 Step 6: Checking success page...\n");
  const out: DiagnosticResult[] = [];
  const successPagePath = path.join(
    process.cwd(),
    "app/checkout/success/page.tsx"
  );

  if (!fs.existsSync(successPagePath)) {
    out.push(
      addResult(
        "Success Page",
        "fail",
        "Success page not found",
        `Expected: ${successPagePath}`,
        [
          "Create app/checkout/success/page.tsx",
          "Page should verify session_id query param",
          "Retrieve session from Stripe to confirm payment",
        ]
      )
    );
    return out;
  }
  out.push(addResult("Success Page", "pass", "Success page file exists"));

  const successCode = fs.readFileSync(successPagePath, "utf8");

  if (
    !successCode.includes("session_id") &&
    !successCode.includes("sessionId")
  ) {
    out.push(
      addResult(
        "Session ID Verification",
        "warning",
        "Success page may not verify session ID",
        undefined,
        [
          "Read session_id from query params",
          "Verify session with Stripe API before showing success",
        ]
      )
    );
  } else {
    out.push(
      addResult(
        "Session ID Verification",
        "pass",
        "Success page handles session ID"
      )
    );
  }
  return out;
}

export async function checkCartStore(): Promise<DiagnosticResult[]> {
  console.log("\n🔍 Step 7: Checking cart store implementation...\n");
  const out: DiagnosticResult[] = [];
  const possiblePaths = [
    path.join(process.cwd(), "lib/store/cart.ts"),
    path.join(process.cwd(), "lib/stores/cart.ts"),
    path.join(process.cwd(), "store/cart.ts"),
    path.join(process.cwd(), "stores/cart.ts"),
  ];

  let cartStorePath: string | null = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      cartStorePath = p;
      break;
    }
  }

  if (!cartStorePath) {
    out.push(addResult("Cart Store", "warning", "Cart store file not found", undefined, [
      "Verify cart state management implementation",
      "Check if using different state solution",
    ]));
    return out;
  }
  out.push(
    addResult(
      "Cart Store",
      "pass",
      `Cart store found at ${path.relative(process.cwd(), cartStorePath)}`
    )
  );

  const storeCode = fs.readFileSync(cartStorePath, "utf8");

  if (!storeCode.includes("create") || !storeCode.includes("zustand")) {
    out.push(
      addResult(
        "Cart Store Implementation",
        "warning",
        "May not be using Zustand",
        undefined,
        ["Verify cart state management approach"]
      )
    );
  } else {
    out.push(
      addResult(
        "Cart Store Implementation",
        "pass",
        "Using Zustand for cart state"
      )
    );
  }

  if (!storeCode.includes("items")) {
    out.push(
      addResult(
        "Cart Items",
        "warning",
        "No items array found in cart store",
        undefined,
        ["Cart store should maintain array of cart items"]
      )
    );
  } else {
    out.push(addResult("Cart Items", "pass", "Cart store has items array"));
  }

  if (!storeCode.includes("checkout") && !storeCode.includes("getItems")) {
    out.push(
      addResult(
        "Checkout Method",
        "warning",
        "No method to retrieve cart items for checkout",
        undefined,
        [
          "Add method to get all cart items",
          "Or add method to clear cart after successful checkout",
        ]
      )
    );
  }
  return out;
}

export function printReport(results: DiagnosticResult[]) {
  console.log("\n\n═══════════════════════════════════════════════════════");
  console.log("          CHECKOUT DIAGNOSTIC REPORT");
  console.log("═══════════════════════════════════════════════════════\n");

  const passed = results.filter((r) => r.status === "pass").length;
  const warnings = results.filter((r) => r.status === "warning").length;
  const failed = results.filter((r) => r.status === "fail").length;

  for (const result of results) {
    const icon =
      result.status === "pass"
        ? "✅"
        : result.status === "warning"
          ? "⚠️"
          : "❌";

    console.log(`${icon} ${result.step}`);
    console.log(`   ${result.details}`);

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }

    if (result.recommendations && result.recommendations.length > 0) {
      console.log("   Recommendations:");
      for (const rec of result.recommendations) {
        console.log(`   • ${rec}`);
      }
    }
    console.log("");
  }

  console.log("═══════════════════════════════════════════════════════");
  console.log(
    `Summary: ${passed} passed, ${warnings} warnings, ${failed} failed`
  );
  console.log("═══════════════════════════════════════════════════════\n");

  return { passed, warnings, failed };
}

export async function runAllDiagnostics() {
  const all: DiagnosticResult[] = [];
  const keys = await checkStripeKeys();
  if (keys && Array.isArray(keys)) all.push(...keys);
  // If Stripe keys check produced a fail, skip further steps
  const failedKeys = (keys && Array.isArray(keys)) ? keys.some((r) => r.status === "fail") : false;
  if (failedKeys) return { success: false, results: all };

  all.push(...(await testStripeConnection()));
  all.push(...(await testCheckoutSessionCreation()));
  all.push(...(await testAPIRoute()));
  all.push(...checkClientSideCode());
  all.push(...checkSuccessPage());
  all.push(...(await checkCartStore()));

  const success = all.every((r) => r.status !== "fail");
  return { success, results: all };
}
