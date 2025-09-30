# Next Tests and Commands (2025-09-30)

This note summarizes the next Playwright tests to run and supporting commands, based on recent fixes in `components/shop/enhanced-product-card.tsx` and environment setup.

# Tests to Run

- **[Shop visuals]**
  - Purpose: Validate image visibility and non-collapsing layout in grid/list.
  - Test: `tests/e2e/shop-visual.spec.ts`
  - Command:
    ```powershell
    pnpm exec playwright test tests/e2e/shop-visual.spec.ts
    ```

- **[Influencer shop page]**
  - Purpose: Ensure `/shop/[handle]` renders product cards and images for a seeded handle.
  - Prep:
    - Verify products are linked to the influencer handle via `influencer_shop_products`.
    - Ensure filters (active/published/stock) allow visibility.
  - Test: `tests/e2e/influencer-shop-page.spec.ts`
  - Command:
    ```powershell
    pnpm exec playwright test tests/e2e/influencer-shop-page.spec.ts
    ```

- **[Checkout]**
  - Purpose: Validate `POST /api/checkout` returns OK with a session ID.
  - Verify keys (masked):
    ```powershell
    $env:DOTENV_CONFIG_PATH = ".env.local"
    node -r dotenv/config -e "const m=v=>v?(v.slice(0,7)+'...'+v.slice(-4)):'MISSING'; console.log('STRIPE_SECRET_KEY=',m(process.env.STRIPE_SECRET_KEY)); console.log('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=',m(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY));"
    ```
  - Diagnostics:
    ```powershell
    pnpm run diagnose:checkout | Tee-Object -FilePath "test-results\checkout-reports\diagnose-checkout.txt"
    ```
  - Test (safe reporters, no spaces in paths):
    ```powershell
    New-Item -ItemType Directory -Path "test-results\checkout-reports" -Force | Out-Null
    pnpm exec playwright test tests/e2e/checkout.spec.ts `
      --reporter=list `
      --reporter=json="test-results\checkout-reports\results.json" `
      --reporter=html="test-results\checkout-reports\playwright-report" `
      --output="test-results\checkout-reports\playwright-artifacts"
    ```

# Alternate baseURL (if not using 3001)

- Default `playwright.config.ts` uses `baseURL: http://127.0.0.1:3001` and a `webServer` on 3001.
- If your app runs on another host/port (e.g., `http://192.168.0.2:3000`), create an override config without `webServer` and set `use.baseURL` accordingly, then pass `--config=...` when running tests.

# References

- Fix applied: `components/shop/enhanced-product-card.tsx`
- Pages: `app/shop/enhanced-page-fixed.tsx`
- Tests: `tests/e2e/shop-visual.spec.ts`, `tests/e2e/influencer-shop-page.spec.ts`, `tests/e2e/checkout.spec.ts`
- Config: `playwright.config.ts`
