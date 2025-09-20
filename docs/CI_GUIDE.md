# Complete CI/CD Pipeline – Guide and Rationale

This document explains the new workflow `/.github/workflows/ci-modern.yml`, how jobs are organized, security posture, performance optimizations, and how to reproduce steps locally.

## Overview

Pipeline triggers:
- Pull Requests to `main` and `develop`
- Pushes to `main` and `develop`
- Manual `workflow_dispatch`

Global features:
- Concurrency group per-branch to cancel in-progress PR runs
- Minimal default permissions; job-level escalation as needed
- Centralized tool versions via `env` (`NODE_VERSION`, `PNPM_VERSION`)

## Job Topology

1. `changes` (Detect Changes)
- Uses `dorny/paths-filter` to compute which areas changed.
- Outputs `only_docs` to short-circuit heavy jobs.

2. `quality` (Lint, Prettier check, TypeScript)
- Runs ESLint, Prettier (check), and `tsc --noEmit`.
- Uses composite action `./.github/actions/setup-node-pnpm` for consistent setup/caching.

3. `security` (Supply Chain & Security)
- Dependency Review (on PR)
- CodeQL Init/Autobuild/Analyze (JS)
- CycloneDX SBOM generation and artifact upload

4. `test-unit`
- Placeholder that runs `pnpm test:unit` if present (non-failing for now).

5. `build`
- Caches `.next/cache` and builds app.
- Uploads `.next` as artifact.
- Emits build provenance attestation via `actions/attest-build-provenance@v1` (OIDC-backed).

6. `test-integration`
- Downloads build artifact, starts app, waits until ready, runs API contract/smoke/security/perf via `pnpm ci:api`.
- Uploads API artifacts.

7. `test-e2e`
- Playwright matrix across browsers and suites.
- Downloads build artifact, installs browsers, starts app, runs tests.
- Uploads HTML report; posts PR comment for a canonical run.

8. `quality-gates`
- Aggregates outcomes from `security`, `test-integration`, and `test-e2e`.
- Posts a concise PR summary with references.

## Security & Compliance (SLSA-oriented)

- Minimal permissions; explicit `id-token: write` for provenance attestation.
- `step-security/harden-runner@v2` used in composite action to audit outbound connections.
- CodeQL analysis with SARIF publishing via `security-events` permission.
- Dependency Review on PRs.
- SBOM generation (CycloneDX) and artifact retention.
- OIDC-enabled attestation to support supply chain integrity.

References:
- SLSA: https://slsa.dev/
- GitHub Security Hardening: https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions
- StepSecurity: https://www.stepsecurity.io/blog/github-actions-security-best-practices

## Performance Optimizations

- pnpm store caching and Node modules cache via `actions/setup-node`.
- Next.js incremental build cache `.next/cache` keyed on lockfile + source globs.
- Parallel jobs where safe: `security` runs in parallel with `quality`, and test jobs depend only on what they need.
- Conditional execution (`only_docs`) to skip heavy jobs on doc-only changes.

## Monitoring & Observability

- Artifacts: build, SBOM, API test reports, Playwright HTML.
- PR comments for E2E smoke and final summary.
- Console logs for failures; app logs available via job logs.

## Developer Experience

- Reusable composite setup reduces boilerplate and flakiness across jobs.
- Fast feedback: lint/typecheck early; matrix E2E runs after build artifact reuse.
- Clear error messages and validation for Supabase environment inputs.

## Local Reproduction

Use the new scripts in `package.json`:
- `pnpm ci:quality` – ESLint + Prettier check + TypeScript
- `pnpm build` – Next.js build (ensure `.env` or environment variables exist)
- `pnpm start` – Start the app locally
- `pnpm ci:api` – API contract/smoke/security/perf tests (requires running app)
- `pnpm e2e` – Playwright tests (install browsers via `npx playwright install`)

Suggested local sequence:
```
pnpm install
pnpm ci:quality
pnpm build
pnpm start & npx wait-on http://localhost:3000
pnpm ci:api
pnpm e2e
```

## Notes on Supabase-dependent Checks

- E2E and integration/API tests can be conditionally skipped if `NEXT_PUBLIC_SUPABASE_URL` and keys are not provided.
- The older workflow `ci.yml` includes deep Supabase validation and can continue to run in parallel until full migration.

## Future Enhancements

- Add unit testing framework (Vitest/Jest) and replace the `test:unit` placeholder.
- Integrate coverage collection, thresholds, and upload (Codecov) for `test-unit` and possibly E2E.
- Expand security scans (e.g., Trivy for containers, npm audit triage).
- Add bundle size report (e.g., with `next-bundle-analyzer` + PR comments).
