# OneLink project scope

_Automatically synced with your [v0.app](https://v0.app) deployments_

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/skonneh2020-6609s-projects/v0-one-link-project-scope)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/UPdyAsLaHYm)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/skonneh2020-6609s-projects/v0-one-link-project-scope](https://vercel.com/skonneh2020-6609s-projects/v0-one-link-project-scope)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/UPdyAsLaHYm](https://v0.app/chat/projects/UPdyAsLaHYm)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Security and Test Credentials

Sensitive test user credentials were removed from the repository and rotated.

- Test credentials are now available only via secure stores (1Password or CI secrets)
- For local development, use environment variables defined in `env.example`
- If you need seed users, run your team’s seeding script (see `My test users/README.md` for details)

Important:

- Supabase keys and any leaked credentials were rotated. Pull updated secrets before testing.

## Freeze Controls & Safety Scripts

- Run `pnpm freeze:all:on` to develop with both core and shop freezes enforced (default).
- Run `pnpm shops:freeze:on` for a read-only shop session while onboarding stays writable.
- Use `pwsh ./scripts/toggle-local-unfreeze.ps1` for a controlled local unfreeze; it backs up `.env.local`, flips all freeze flags off, starts `pnpm dev`, then restores the backup when you exit.
- Verify middleware coverage with `pnpm test:shops-freeze` (Node smoke test) and `pwsh ./scripts/integration-smoke.ps1` (PowerShell matrix of read/write checks).
- See `docs/integration-plan.md` for the phased integration PRD, runbook, and disaster recovery steps.

### Freeze verification (local)
1. Start the dev server: `pnpm dev`
2. Confirm freeze flags: open <http://localhost:3000/api/debug/freezes> and verify all values are `false` while running unfrozen checks.
3. Execute the smoke scripts:

   ```powershell
   $env:BASE_URL="http://localhost:3000"
   pnpm test:shops-freeze
   .\scripts\integration-smoke.ps1
   ```

Expected (unfrozen): GET requests return 200 (or any non-423), and POST/PATCH/DELETE return non-423 codes while freezes are disabled.
