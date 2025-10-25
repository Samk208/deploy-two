# Core Freeze Handover Notes

This document explains the read-only "Core Freeze" mode implemented to protect dashboards and enhanced onboarding from accidental writes while you work on the main shop. All changes are code-only and fully reversible.

## Scope

- **Protected areas** (write methods blocked):
  - `app/api/onboarding/**` (steps, docs, submit)
  - `app/auth/onboarding/**` (server actions/forms)
  - `app/dashboard/**` (influencer, supplier/brand, admin)
  - `app/(onboarding)/**` (if present)
  - Role APIs: `api/admin/**`, `api/influencer/**`, `api/brand/**`, `api/supplier/**`
- **Allowed write prefixes (system-critical)**:
  - `api/auth/**`, `api/checkout/**`, `api/stripe/**`, `api/webhooks/stripe`
- **Reads** continue to work normally, so pages render and GET APIs respond.

## How it works

- **Middleware write-lock**: `middleware.ts`
  - When `process.env.CORE_FREEZE === "true"`, blocks non-GET/HEAD/OPTIONS to the protected paths above.
  - Returns HTTP 423 with JSON: `{ ok: false, error: "CORE_FREEZE active: ..." }`.
  - Existing auth/session handling and public allowlists preserved.

- **UI read-only banner + interaction guard**:
  - Dashboard wrapper: `app/dashboard/layout.tsx`
  - Onboarding wrapper: `app/auth/onboarding/layout.tsx`
  - Helpers: `components/FreezeBanner.tsx`, `components/isFrozen.ts`
  - When `process.env.NEXT_PUBLIC_CORE_FREEZE === "true"`, a banner is shown and user interactions are disabled (`pointer-events-none select-none`).
  - This prevents direct browser-triggered writes (e.g., Storage uploads) if any client code bypasses Next middleware.

- **Commit guard & code owners**:
  - CODEOWNERS: `.github/CODEOWNERS` (requires GitHub branch protection to enforce)
    - `app/dashboard/**`, `app/api/onboarding/**`, `app/(onboarding)/**`, `app/auth/onboarding/**` → `@Samk208`
  - Husky pre-commit: `.husky/pre-commit`
    - Blocks commits touching the protected paths when `CORE_FREEZE=true`, unless overridden by `ALLOW_CORE_EDITS=true` for that commit.

## Flags & scripts

- `.env.example` contains:
  - `CORE_FREEZE=false`
  - `NEXT_PUBLIC_CORE_FREEZE=false`

- `package.json` scripts:
  - `pnpm run freeze:on` → `CORE_FREEZE=true NEXT_PUBLIC_CORE_FREEZE=true next dev`
  - `pnpm run freeze:build` → `CORE_FREEZE=true NEXT_PUBLIC_CORE_FREEZE=true next build && next start`

## Typical workflows (PowerShell)

- **Turn freeze on (dev)**
```powershell
pnpm run freeze:on
```

- **Turn freeze off**
```powershell
pnpm dev
```

- **Commit while frozen (single override commit)**
```powershell
# Stage changes as usual
# Temporarily allow commit to protected paths
$env:ALLOW_CORE_EDITS = "true"
git commit -m "override: change in protected path during freeze"
$env:ALLOW_CORE_EDITS = $null
```

- **Husky v10 notice**
If you see a Husky deprecation notice about these two lines in `.husky/pre-commit`:
```
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
```
You can remove them to silence the warning; the hook will continue to work.

## Verification checklist

- **Server write lock**
  - With freeze on, POST/PATCH/PUT/DELETE under onboarding/dashboard return 423.
  - Example:
    ```bash
    curl -i -X POST http://localhost:3000/api/onboarding/step-1 -H 'content-type: application/json' -d '{}'
    ```

- **UI read-only**
  - Navigate to:
    - `/dashboard/influencer`, `/dashboard/supplier`, `/dashboard/admin`
    - `/auth/onboarding`
  - You should see the banner, and clicks/inputs are disabled.

- **Reads still work**
  - All pages render, GET APIs (e.g., `api/products`, `api/shop`) still respond.

- **E2E seeding safety**
  - Already guarded in `tests/setup/global-setup.ts` → runs only when `E2E_SEED==='true'`.

## Rollback (unfreeze)

- Use normal dev or build commands (no freeze flags) and everything returns to normal. No DB or policy changes were made, so there’s nothing to migrate back.

## Files changed/added

- `middleware.ts` → added `CORE_FREEZE` write-lock
- `.env.example` → added `CORE_FREEZE`, `NEXT_PUBLIC_CORE_FREEZE`
- `package.json` → added `freeze:on`, `freeze:build`, `prepare` (husky)
- `.github/CODEOWNERS` → added code owners for dashboards/onboarding
- `.husky/pre-commit` → commit guard for protected paths during freeze
- `components/FreezeBanner.tsx` → UI banner
- `components/isFrozen.ts` → UI flag helper
- `app/dashboard/layout.tsx` → UI wrapper
- `app/auth/onboarding/layout.tsx` → UI wrapper

## Troubleshooting

- **PowerShell and command separators**
  - Use `;` or run commands on separate lines. Example:
    ```powershell
    pnpm install; pnpm prepare
    ```

- **Commit blocked unexpectedly**
  - Ensure you’ve set the override only when you intend to bypass the guard:
    ```powershell
    $env:ALLOW_CORE_EDITS = "true"
    git commit -m "override"
    $env:ALLOW_CORE_EDITS = $null
    ```

- **Freeze appears on but UI not disabled**
  - Ensure both flags are set in the environment for `next dev/start`: `CORE_FREEZE=true` and `NEXT_PUBLIC_CORE_FREEZE=true`.

## Security considerations

- Middleware blocks server writes; the UI wrapper reduces risk of client-side writes.
- No database schema, RLS, or policy changes were introduced.
- CODEOWNERS sets review expectations; enforce with GitHub branch protection.

## Future enhancements (optional)

- Add a CI job that fails if `CORE_FREEZE=true` on production builds.
- Expand allowlist/denylist as new routes are introduced (e.g., read-only shop feeds).
- Centralize freeze configuration (single object of paths) to make audits trivial.
