Dashboard E2E Suite

Setup

1. Ensure Supabase env vars are set in `.env.local` (global-setup uses it).
2. Start tests:
   - `pnpm test:e2e` (headless)
   - `pnpm test:e2e:ui` (UI mode)
   - `pnpm test:e2e:headed` (headed)

Reports

- HTML: `test-results/Dashboard Report/html-report/index.html`
- JSON: `test-results/Dashboard Report/test-results.json`
- JUnit: `test-results/Dashboard Report/junit-results.xml`
- Artifacts: `test-results/Dashboard Report/test-artifacts/`
- Markdown summary is written by global teardown into `test-results/Dashboard Report/`.

Known issues are tracked in `tests/KNOWN_ISSUES.md`.
