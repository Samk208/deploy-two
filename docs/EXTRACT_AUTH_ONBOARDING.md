# Auth + Onboarding Extraction Guide

This guide explains how to copy the working Auth (sign-in, sign-up, reset, update-password), Onboarding flow (Brand/Influencer, KYC/KYB, progress, OTP), and Document Uploads into a clean standalone project without modifying the source repository.

## What gets exported

- Pages and API
  - `app/(auth)/sign-in/`
  - `app/(auth)/sign-up/`
  - `app/(auth)/reset/`
  - `app/(auth)/update-password/`
  - `app/auth/onboarding/`
  - `app/api/auth/sign-in/`
  - `app/api/auth/sign-up/`
  - `app/api/auth/reset/`
  - `app/api/auth/callback/` (if present)
  - `app/api/onboarding/brand/`
  - `app/api/onboarding/influencer/`
  - `app/api/onboarding/check-handle/`
  - `app/api/onboarding/send-otp/`
  - `app/api/onboarding/verify-otp/`
  - `app/api/onboarding/progress/`
  - `app/api/onboarding/step-1/`
  - `app/api/onboarding/step-2/`
  - `app/api/onboarding/step-3/`
  - `app/api/onboarding/step-4/`
  - `app/api/onboarding/submit/`
  - `app/api/onboarding/docs/`
  - `app/api/onboarding/docs/[id]/` (if present)

- Supporting libs and hooks
  - `lib/supabase/` (entire folder)
  - `lib/auth-helpers.ts`
  - `lib/auth-context.tsx`
  - `lib/storage.ts`
  - `lib/validation/` (entire folder)
  - `lib/validators.ts`
  - `lib/utils/api-helpers.ts`
  - `lib/types.ts`
  - `hooks/use-toast.ts`

- UI components
  - `components/ui/document-uploader.tsx`
  - UI primitives used by the above (copy only those actually imported):
    - `components/ui/button.tsx`
    - `components/ui/input.tsx`
    - `components/ui/form.tsx`
    - `components/ui/label.tsx`
    - `components/ui/progress.tsx`
    - `components/ui/alert.tsx`
    - `components/ui/dialog.tsx`
    - `components/ui/select.tsx`
    - `components/ui/radio-group.tsx`
    - `components/ui/checkbox.tsx`
    - `components/ui/table.tsx`
  - If used: `components/client-providers.tsx`

- Middleware and guards
  - `middleware.ts`
  - `middleware/admin-auth.ts` (optional, if you also export admin routes)

- Supabase configuration and migrations
  - `supabase/migrations/` (project schema, onboarding tables, RLS)
  - `supabase/config.toml`
  - `supabase/check-schema.sql`
  - Any consolidated setup SQL you maintain (e.g., `setup-auth-compatible.sql`)

- Configuration and documentation
  - `env.example`
  - `next.config.mjs`
  - This guide: `docs/EXTRACT_AUTH_ONBOARDING.md`

- Optional tests and scripts for parity
  - `tests/e2e/onboarding-brand.spec.ts`
  - `tests/e2e/onboarding-influencer.spec.ts`
  - `tests/auth.spec.ts`
  - `scripts/test-onboarding-integration.ts`
  - `scripts/diagnose-signup.mjs`

## Environment variables required

Create an `.env.local` in the new project based on `env.example` and add:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- (Optional CI) `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID`, `SUPABASE_DB_URL`

## Storage buckets

Ensure these buckets exist in Supabase Storage:

- `documents` (KYC/KYB uploads)
- `avatars`
- `products` (only if you also export product UI)

## How the export works (non-destructive)

- We copy files from the source project into a new destination folder.
- The script never edits or deletes files in the source project.
- You can re-run the export to refresh the destination; it will only overwrite the destination files.

## Steps

1) Choose a destination path, e.g. `C:\temp\auth-onboarding-starter`.
2) Run the PowerShell script:

```powershell
# From the repository root
powershell -ExecutionPolicy Bypass -File .\scripts\export-auth-onboarding.ps1 -Destination "C:\temp\auth-onboarding-starter"
```

3) In the destination folder:

- Copy `env.example` to `.env.local` and set the values listed above.
- Run Supabase migrations (or apply your consolidated SQL). For example, using the Supabase CLI in that project or manually via SQL editor.
- Install dependencies and run the dev server.

## Post-export verification checklist

- Sign Up
  - New user can sign up and is immediately signed in (session established).
- Sign In
  - Existing user can sign in with valid credentials.
- Onboarding flow
  - Access `auth/onboarding` and complete steps (Profile basics, Brand/Influencer forms).
  - Progress persists across refresh.
  - OTP send/verify endpoints work (if configured).
- Document upload
  - Upload sample files through `document-uploader`.
  - Files appear in the `documents` bucket; server enforces size/type checks and sanitized file names.
- RLS
  - Users can only see their own onboarding data.
- Middleware
  - Protected routes are gated properly; public routes accessible.

## Notes

- If the destination project uses different UI primitives, you can swap the imported `components/ui/*` with equivalents. Keep interfaces in `document-uploader.tsx` unchanged or adapt accordingly.
- If you don’t need admin routes, skip copying `middleware/admin-auth.ts` and any admin-specific API/pages.
- Keep the bucket names consistent with `lib/storage.ts` or adjust that file and RLS policies accordingly.
