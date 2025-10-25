# Shops ⇄ Onboarding ⇄ Dashboards – Handover (2025-10-09)

## Current Status
- `DryRunBanner` now renders for onboarding flows via `app/auth/onboarding/layout.tsx`, ensuring users see a dry-run warning whenever freezes are active.
- Google Translate widget is globally active (`app/layout.tsx`) leveraging `components/global/GoogleTranslate.tsx`; no UI regressions observed locally.
- Added automation for freeze verification:
  - `scripts/integration-smoke.ps1` runs read/write matrix checks aligned with CORE/SHOPS freeze flags.
  - README freeze section updated so the broader team understands the workflows.
- `.env.example` (and local `.env.local`) now ship with freeze + dry-run defaults to keep environments protected by default.

## Outstanding Follow-ups
1. Run `pnpm test:shops-freeze` and `pwsh ./scripts/integration-smoke.ps1` to confirm middleware guards respond as expected (not executed yet in this session).
2. While running locally unfrozen, follow the controlled ritual (`pwsh ./scripts/toggle-local-unfreeze.ps1`) before attempting writes.
3. Once smoke scripts are validated, capture outputs (or at minimum confirm green status) before merging downstream branches.

## Suggested Next Actions
1. **Verify Scripts** – Execute both freeze-related test scripts; document any failing endpoint for triage.
2. **Spot-check Onboarding UI** – With freezes ON, visit `/auth/onboarding` to confirm the new banner positioning is acceptable and that UI remains read-only.
3. **Google Translate QA** – Load the main shop page and toggle languages (en/ko/zh-CN) to ensure inline text updates without layout shifts.
4. **Update PR Notes** – Reference this file plus `docs/integration-plan.md` in the PR description so reviewers have context on freeze handling.

## References
- README freeze workflow: `README.md`
- Integration plan / runbook: `docs/integration-plan.md`
- Scripts: `scripts/integration-smoke.ps1`, `scripts/test-shops-freeze.mjs`, `scripts/toggle-local-unfreeze.ps1`
- Env defaults: `.env.example`, `.env.local`
