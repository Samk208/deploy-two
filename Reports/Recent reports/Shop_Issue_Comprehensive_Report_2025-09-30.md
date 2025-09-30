# Shop Issues – Comprehensive Report (2025-09-30)

Sources analyzed (copied from `test-results/Shops Reports` to `analysis-cache/shops-reports/`):
- `diagnose-images.txt`
- `diagnose-checkout.txt`
- `db-verify.txt`
- `results.json`
- Playwright artifacts and HTML report

# Findings

- **[Images: Visibility/Layout]**
  - `tests/e2e/shop-visual.spec.ts` shows product `<img>` present but reported as "hidden" in grid view.
    - Error: expected visible, received hidden.
    - Likely cause: `next/image` with `fill` inside a container without explicit height/aspect ratio.
  - List view image height is too small: received ~42px (< expected 60px).
  - `diagnose-images.txt` confirms remote domains allowed and product image URLs are valid.

- **[Shops: Missing banners/avatars]**
  - `diagnose-images.txt`: 5 shops missing banner images and 5 missing avatars.
  - No UI fallback currently asserted; add defaults.

- **[Influencer Shops: Empty product grid / potential 404s]**
  - `tests/e2e/influencer-shop-page.spec.ts`: `getByTestId('product-card')` elements not found for `/shop/[handle]`.
  - Possible causes:
    - No seeded links in `influencer_shop_products` for the handle used by tests.
    - Query filters (active/published/stock) exclude products.
    - Mismatch in `data-testid` used by the page vs. tests.
    - For some handles, route may 404 or render empty silently.

- **[Checkout]**
  - `diagnose-checkout.txt`: Missing `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` detected at time of run; `/api/checkout` returning 500.
  - `tests/e2e/checkout.spec.ts` fails on `expect(res.ok()).toBeTruthy()` and missing `data.sessionId`.
  - Root cause: missing/invalid Stripe keys and lack of graceful error handling when keys are absent.

- **[Database]**
  - `db-verify.txt`: All schema and RLS smoke checks pass.
  - Anon can read active products and shops; authenticated flows basic checks OK.
  - Implication: issues are likely data linkage (seeding) or page query logic, not permissions.

- **[Auth tests (context)]**
  - `tests/e2e/auth-access.spec.ts` and `tests/e2e/auth.spec.ts` show admin redirect/login timing out or failing with `Could not authenticate user`.
  - Not directly a shop issue but may affect admin-managed shop flows.

# Likely Root Causes

- **[Image components]** Containers using `next/image` with `fill` lack a stable height (`aspect-*` + `min-h-*`), causing images to render but be non-visible to Playwright.
- **[UI fallbacks]** No default banner/avatar for shops without images.
- **[Influencer data]** Missing or filtered-out product associations for specific shop handles; or test and UI `data-testid` mismatch.
- **[Checkout config]** Stripe keys not loaded at runtime or not validated in the route; error path returns generic 500.

# Impacted Areas & Paths

- **[Shop UI]**
  - Product listing components used by `/shop/[handle]`.
  - Active document: `app/shop/enhanced-page-fixed.tsx` (verify image containers and testids here if used by the route).
  - Product card/image components under `components/` used by shop pages.

- **[Checkout API]**
  - `app/api/checkout/route.ts` (validate env, structured errors).

- **[Webhooks]**
  - `app/api/webhooks/stripe/route.ts` (already present; ensure `STRIPE_WEBHOOK_SECRET` is used).

- **[Tests]**
  - `tests/e2e/shop-visual.spec.ts`
  - `tests/e2e/influencer-shop-page.spec.ts`
  - `tests/e2e/checkout.spec.ts`

# Recommended Fixes

- **[High] Image layout fixes**
  - In product card container:
    - Add `relative aspect-[4/3] min-h-[120px] overflow-hidden` to ensure visible area.
    - Use `next/image` with `fill` and `className="object-cover"`.
    - Ensure the `<img>` is inside an element with `data-testid="product-card"` for tests.

- **[High] Influencer shop product rendering**
  - Seed or verify `influencer_shop_products` linking for the test handle used in `tests/e2e/influencer-shop-page.spec.ts`.
  - Ensure product filters (active/published/stock) allow at least one product for that handle.
  - Confirm/testid alignment: page should expose `data-testid="product-card"` for each product card.
  - If handle not found, render a friendly 404; ensure tests use a valid seeded handle.

- **[High] Checkout resilience and config**
  - Add startup-time checks or route-level guards in `app/api/checkout/route.ts`:
    - If `STRIPE_SECRET_KEY` or `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` missing → return 400 with descriptive message, log server-side.
  - Re-run diagnostics and test once keys are confirmed loaded.

- **[Medium] Shop header fallbacks**
  - Default banner and avatar when missing; optionally show initials.
  - Add `data-testid` hooks to facilitate testing.

- **[Medium] Admin auth test stability**
  - Ensure admin test account and role exist; confirm redirect logic to `/admin/dashboard`.

# Verification Plan

1. Fix image containers and add fallbacks, then run:
   - `pnpm exec playwright test tests/e2e/shop-visual.spec.ts`
2. Ensure influencer products are seeded and testids added, then run:
   - `pnpm exec playwright test tests/e2e/influencer-shop-page.spec.ts`
3. Confirm Stripe keys in `.env.local` and improve error handling, then run:
   - `pnpm run diagnose:checkout`
   - `pnpm exec playwright test tests/e2e/checkout.spec.ts`

# Artifacts

- Original results location: `analysis-cache/shops-reports/`
- After future runs, prefer no-space path like: `test-results/checkout-reports/` to avoid shell parsing issues.

# Notes

- `playwright.config.ts` targets `http://127.0.0.1:3001` and starts a web server on 3001; if your app runs elsewhere (e.g., `http://192.168.0.2:3000`), use a local override config or adjust `use.baseURL` and disable `webServer` for that session.
