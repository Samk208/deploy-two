# Checkout Diagnostics + CI/CD Strategy

Date: 2025-09-30 08:41 (local)
Branch in focus: `chore/playwright-stabilize`

## Findings

- **[Workflow triggers]** `.github/workflows/ci.yml` does not run on `chore/**` pushes. It triggers on:
  - `pull_request`: `main`, `develop`, `ci/combined-admin-translate-tests`
  - `push`: `main`, `develop`, `feature/**`, `ci/combined-admin-translate-tests`
  - Impact: pushing to `chore/playwright-stabilize` will not run CI unless you open a PR targeting `main`/`develop`.

- **[Executed checks in CI]** `.github/workflows/ci.yml` currently runs (when triggered):
  - `lint`: ESLint via `pnpm lint`
  - `typecheck`: TypeScript via `pnpm typecheck` + Supabase type drift detection (conditional on secrets)
  - `build`: Next.js build via `pnpm build`
  - Database checks (conditional on secrets): `db-smoke`, `db-validate`, `db-integrity`, `db-migrations`, `db-performance`
  - `e2e`: Playwright matrix across browsers/devices; runs only if required Supabase secrets are present
  - Note: There is **no unit test job** wired in CI.

- **[Unit tests not enforced]**
  - `package.json` has `"test:unit": "vitest run"`, but CI workflows never execute this script.
  - Result: unit test failures will not fail CI.

- **[Secrets-dependent coverage]**
  - E2E and DB checks run only if secrets are configured. If not set, these jobs are skipped; issues in those areas won’t be caught by CI.

## Recommended Actions

- **[Trigger on chore/*]** Update `.github/workflows/ci.yml` to include `chore/**` in both `push` and `pull_request` branches.
- **[Add Unit Test job]** Insert a `unit` job that installs dependencies and runs `pnpm test:unit` after `lint` and before `typecheck/build`.
- **[Secrets hygiene]** Ensure the following are set in repo/org secrets so E2E/DB checks actually run:
  - `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID`, `SUPABASE_DB_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - Optional: `SUPABASE_DB_URL_NONPROD`
- **[Optional fast-path]** If you want to shorten CI on non-app changes, implement real change detection in the `changes` job (currently hardcoded to run all code checks).

## Proposed CI Changes (high level)

- **.github/workflows/ci.yml**
  - Under `on.pull_request.branches` and `on.push.branches`, add `chore/**`.
  - Add a new `unit` job:
    - Uses `./.github/actions/setup-node-pnpm` with `install: 'true'`
    - Runs `pnpm test:unit`
    - Place it after `lint`, and make `typecheck` depend on `unit` as well.

## New Diagnostics Tests (local-only, not yet in CI)

- **Diagnostics module**: `scripts/checkout-diagnostics.ts`
  - Exposes `checkStripeKeys()`, `testStripeConnection()`, `testCheckoutSessionCreation()`, `testAPIRoute()`, `checkClientSideCode()`, `checkSuccessPage()`, `checkCartStore()`, `printReport()`, `runAllDiagnostics()`.
  - No `process.exit` so safe for unit tests.

- **Vitest setup**
  - Config: `vitest.config.ts`
  - Setup: `tests/setup/vitest.setup.ts`
  - Tests: `tests/unit/checkout-diagnostics.test.ts`
  - `package.json` scripts:
    - `test:unit`: `vitest run`
    - `test`: `vitest`

- **Next step**: add unit tests to CI via the `unit` job as described above so failures block merges.

## Relevant Files

- Workflows
  - `.github/workflows/ci.yml`
  - `.github/workflows/secrets-smoke.yml`

- App/Diagnostics
  - `scripts/checkout-diagnostics.ts`
  - `tests/unit/checkout-diagnostics.test.ts`
  - `tests/setup/vitest.setup.ts`
  - `vitest.config.ts`
  - `package.json`

- Other referenced paths in diagnostics (presence/heuristics only)
  - `app/checkout/page.tsx`
  - `components/shop/checkout-page.tsx`
  - `app/checkout/success/page.tsx`
  - `lib/store/cart.ts` or `lib/stores/cart.ts` or `store/cart.ts` or `stores/cart.ts`

## Notes

- Opening a PR from `chore/playwright-stabilize` to `main` will run the full CI (as long as required secrets exist). Pushes to the `chore/*` branch by itself will not trigger CI until the workflow is updated as recommended.
- The separate manual workflow `.github/workflows/secrets-smoke.yml` can be used via "Run workflow" to validate secrets formatting and optionally ping the DB.
