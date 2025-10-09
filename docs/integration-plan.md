# Shops ⇄ Onboarding ⇄ Dashboards Integration Plan

**Version:** 1.0
**Status:** Ready for Review
**Last Updated:** 2025-10-08
**Owner:** Integration Team

---

## Executive Summary

This document outlines the **zero-risk integration** of Shops, Onboarding, and Dashboards in the OneLink Next.js 15 (App Router) application. All work will be performed with **freezes ON** by default to protect working shop UIs and data.

### Goals

1. **Unify auth & roles** across onboarding → dashboards → shops
2. **Normalize domain types** to eliminate duplication
3. **Standardize feed APIs** for main shop and influencer shops
4. **Enable dry-run onboarding** under freeze protection
5. **Verify freeze coverage** and ship test scripts
6. **Fix Google Translate** with simple widget integration
7. **Document** freeze rituals and disaster recovery

### Non-Goals

- Schema changes beyond type normalization in code
- Visual redesigns of shop UIs
- Long-running migrations

---

## Current State Analysis

### ✅ What Works

- **Auth Context**: `lib/auth-context.tsx` provides client-side `AuthProvider` with `useAuth()` hook
- **Auth Helpers**: `lib/auth-helpers.ts` has server-side `getCurrentUser()`, `hasRole()`, role checks
- **Middleware Freeze Protection**:
  - `CORE_FREEZE` blocks writes to `/api/onboarding`, `/dashboard`, `/api/admin`, `/api/influencer`, `/api/brand`, `/api/supplier`
  - `SHOPS_FREEZE` blocks writes to `/api/products`, `/api/shop`, `/api/influencer-shop`
- **Main Shop Feed**: `/api/main-shop/feed/route.ts` returns paginated products with filters
- **Influencer Shop API**: `/api/influencer/shop/route.ts` returns shop products and available products
- **Onboarding Submit**: `/api/onboarding/submit/route.ts` validates docs, updates role, redirects to dashboard
- **Google Translate**: `components/global/GoogleTranslate.tsx` exists with isolated container strategy
- **Dashboards**: Supplier (`/dashboard/supplier`), Influencer (`/dashboard/influencer`), Admin (`/admin/dashboard`)

### ⚠️ Issues to Address

1. **No unified session helper** – `lib/auth-helpers.ts` has pieces but no consolidated `lib/auth/session.ts`
2. **Type duplication** – `lib/types.ts` has Product, Shop, User but no single `types/domain.ts` source
3. **Feed shape inconsistency** – Main shop uses `primary_image`, influencer uses `images[0]`
4. **No onboarding dry-run** – Submit route always writes when freeze is off
5. **Google Translate not in layout** – Widget exists but not loaded globally
6. **Missing freeze test scripts** – No automated verification of freeze behavior
7. **No freeze env vars in .env.local** – Missing `CORE_FREEZE`, `SHOPS_FREEZE` flags

### Environment Variables (Current vs Target)

**Current `.env.local`:**
- Missing: `CORE_FREEZE`, `NEXT_PUBLIC_CORE_FREEZE`, `SHOPS_FREEZE`, `NEXT_PUBLIC_SHOPS_FREEZE`, `DRY_RUN_ONBOARDING`

**Target `.env.local`:**
```bash
# Freeze Flags (ON by default for safety)
CORE_FREEZE=true
NEXT_PUBLIC_CORE_FREEZE=true
SHOPS_FREEZE=true
NEXT_PUBLIC_SHOPS_FREEZE=true

# Onboarding Dry-Run (auto-enabled when freezes are on)
DRY_RUN_ONBOARDING=true
```

---

## Integration Phases

### Phase A: Auth & Roles (Read-Only) ✅

**Goal:** Consolidate auth helpers, provide unified session API

#### Deliverables

1. **`lib/auth/session.ts`**
   - Export `getServerSession()`: async function returning session + user with roles
   - Export `getUserWithRoles()`: async function returning User with typed roles array
   - Export `hasRole(user, roles[])`: boolean check
   - Export `requireRole(roles[])`: throws/redirects if unauthorized
   - Reuse existing `lib/auth-helpers.ts` functions under the hood

2. **User Context Enhancement**
   - Ensure `lib/auth-context.tsx` exports typed `User` with `roles: string[]`
   - Add `useUser()` hook as alias to `useAuth()` for consistency

#### Affected Files

- **New:** `lib/auth/session.ts`
- **Updated:** `lib/auth-context.tsx` (add `useUser` export)

#### Acceptance Criteria

- ✅ `getServerSession()` works in API routes and server components
- ✅ `hasRole(user, ['supplier', 'admin'])` correctly validates roles
- ✅ `requireRole(['influencer'])` throws 403 when unauthorized
- ✅ All existing auth flows continue to work (no regressions)

---

### Phase B: Domain Types (Read-Only) ✅

**Goal:** Single source of truth for Product, Shop, User, Feed

#### Deliverables

1. **`types/domain.ts`**
   ```typescript
   export type Product = {
     id: string
     title: string
     price: number
     images: string[]  // primary_image = images[0]; NEVER set primary_image manually
     category: string
     brand?: string
     short_description?: string
     in_stock: boolean
     stock_count: number
     active: boolean
     commission: number
     supplier_id: string
     created_at: string
   }

   export type ShopFeedItem = {
     id: string
     title: string
     price: number
     images: string[]  // Consistent: images[0] is primary
     category: string
     brand?: string
     short_description?: string
     in_stock: boolean
     stock_count: number
   }

   export type Shop = {
     id: string
     handle: string
     name: string
     influencer_id: string
     products: string[] | Array<{ product_id: string; custom_title?: string; sale_price?: number }>
     active: boolean
     created_at: string
   }

   export type UserProfile = {
     id: string
     email?: string
     name: string
     roles: string[]  // ['ADMIN', 'SUPPLIER', 'INFLUENCER', 'CUSTOMER']
     avatar?: string
     verified?: boolean
     created_at: string
     updated_at: string
   }

   export type OnboardingState = {
     user_id: string
     status: 'draft' | 'submitted' | 'completed'
     target_role?: 'supplier' | 'influencer' | 'admin'
     current_step: number
   }
   ```

2. **Migration Strategy**
   - Import `types/domain.ts` in new code
   - Gradually update `lib/types.ts` imports to use `types/domain.ts`
   - Do NOT remove `lib/types.ts` yet (breaking change risk)

#### Affected Files

- **New:** `types/domain.ts`
- **Updated:** (future) API routes, components as needed

#### Acceptance Criteria

- ✅ `types/domain.ts` exports all core types
- ✅ No circular dependencies
- ✅ Types align with DB schema (products, shops, profiles tables)

---

### Phase C: Feed Standardization (Read-Only) ✅

**Goal:** Consistent feed shape for main shop and influencer shops

#### Deliverables

1. **Main Shop Feed** (`/api/main-shop/feed/route.ts`)
   - Return `ShopFeedItem[]` with `images: string[]` (map `primary_image` to `images[0]`)
   - Keep pagination, filters, sorting

2. **Influencer Shop Feed** (NEW: `/api/influencer/[handle]/feed/route.ts`)
   - Return same `ShopFeedItem[]` shape
   - Fetch curated product IDs from `shops.products`
   - Join with `products` table
   - Apply influencer customizations (custom_title, sale_price)

3. **Update Consumers**
   - Shop listing pages consume unified feed APIs
   - Product cards expect `images[0]` as primary image

#### Affected Files

- **Updated:** `app/api/main-shop/feed/route.ts` (map primary_image → images)
- **New:** `app/api/influencer/[handle]/feed/route.ts`
- **Updated:** Shop listing components to use new feed endpoints

#### Acceptance Criteria

- ✅ Main shop feed returns `{ ok: true, data: { items: ShopFeedItem[], page, total, hasMore } }`
- ✅ Influencer feed returns same shape
- ✅ UI shows correct products with images[0] as primary
- ✅ No visual regressions in shop pages

---

### Phase D: Onboarding Dry-Run (Conditional Write) ⚠️

**Goal:** Onboarding works in read-only mode under freeze, shows "would redirect"

#### Deliverables

1. **Dry-Run Logic** in `/api/onboarding/submit/route.ts`
   ```typescript
   const isDryRun =
     process.env.DRY_RUN_ONBOARDING === 'true' ||
     process.env.CORE_FREEZE === 'true'

   if (isDryRun) {
     // Validate docs and role
     const targetRole = dbRole // supplier | influencer | admin
     const redirectPath = targetRole === 'influencer'
       ? '/dashboard/influencer'
       : '/dashboard/supplier'

     return NextResponse.json({
       ok: true,
       dryRun: true,
       message: `DRY RUN: Would update role to ${targetRole} and redirect to ${redirectPath}`,
       role: targetRole,
       redirectPath
     })
   }

   // Normal flow: update role, mark onboarding complete, redirect
   ```

2. **Onboarding Banner** (`components/onboarding/DryRunBanner.tsx`)
   - Show at top of `/auth/onboarding` when `NEXT_PUBLIC_CORE_FREEZE=true`
   - "⚠️ Onboarding in DRY-RUN mode. No data will be saved."

#### Affected Files

- **Updated:** `app/api/onboarding/submit/route.ts`
- **New:** `components/onboarding/DryRunBanner.tsx`
- **Updated:** `app/auth/onboarding/page.tsx` (show banner)

#### Acceptance Criteria

- ✅ With `DRY_RUN_ONBOARDING=true`, submit returns `{ dryRun: true, role, redirectPath }`
- ✅ No DB writes occur
- ✅ Banner visible on onboarding page
- ✅ With freeze OFF, normal submit flow works

---

### Phase E: Freeze Coverage Verification (Read-Only) ✅

**Goal:** Confirm middleware blocks all shop write routes

#### Deliverables

1. **Middleware Audit**
   - Review `middleware.ts` SHOP_WRITE_PATTERNS
   - Ensure `/api/products`, `/api/shop`, `/api/influencer-shop`, `/api/influencer/shop` are covered
   - Do NOT alter CORE_FREEZE paths (already working)

2. **Documentation Update**
   - Add comments in `middleware.ts` explaining freeze logic
   - Document which endpoints are frozen under which flags

#### Affected Files

- **Updated:** `middleware.ts` (comments only, no logic changes)

#### Acceptance Criteria

- ✅ All shop write endpoints return 423 when `SHOPS_FREEZE=true`
- ✅ All onboarding/dashboard writes return 423 when `CORE_FREEZE=true`
- ✅ GET requests pass through

---

### Phase F: Test & Helper Scripts 🛠️

**Goal:** Automated freeze verification and unfreeze rituals

#### Deliverables

1. **`scripts/test-shops-freeze.mjs`**
   ```javascript
   // Load .env.local
   // Hit GET /api/main-shop/feed → expect 200
   // Hit GET /api/influencer/shop → expect 200
   // Hit POST /api/products → expect 423 (frozen) or 2xx (unfrozen)
   // Print summary + exit code
   ```

2. **`scripts/toggle-local-unfreeze.ps1`** (PowerShell)
   ```powershell
   # Save current env
   # Set CORE_FREEZE=false, SHOPS_FREEZE=false
   # Print big red warning
   # Start pnpm dev
   # On exit (Ctrl+C), restore env
   # Print "Frozen again"
   ```

3. **`scripts/integration-smoke.ps1`**
   ```powershell
   # Run matrix of curl checks:
   #   - Main shop feed (GET → 200)
   #   - Influencer shop (GET → 200)
   #   - Product create (POST → 423 if frozen, 2xx if unfrozen)
   #   - Onboarding submit (POST → dry-run response if frozen)
   # Print green/red summary
   ```

#### Affected Files

- **New:** `scripts/test-shops-freeze.mjs`
- **New:** `scripts/toggle-local-unfreeze.ps1`
- **New:** `scripts/integration-smoke.ps1`

#### Acceptance Criteria

- ✅ `pnpm test:shops-freeze` runs and reports freeze status
- ✅ `toggle-local-unfreeze.ps1` temporarily unfreezes, starts dev, restores on exit
- ✅ `integration-smoke.ps1` prints green/red matrix

---

### Phase G: Google Translate Widget 🌐

**Goal:** Simple widget integration without i18n complexity

#### Deliverables

1. **Load in Layout** (`app/layout.tsx`)
   ```tsx
   import GoogleTranslate from '@/components/global/GoogleTranslate'
   import Script from 'next/script'

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           <GoogleTranslate />
           {/* ... */}
         </body>
       </html>
     )
   }
   ```

2. **CSP Update** (if applicable in `next.config.mjs`)
   ```javascript
   // Allow translate.google.com, translate.googleapis.com
   ```

3. **Test Widget**
   - Load app, verify widget hidden but functional
   - Use `window.setTranslateLanguage('ko')` to switch languages
   - Confirm page translates

#### Affected Files

- **Updated:** `app/layout.tsx`
- **Updated:** `next.config.mjs` (CSP headers if present)
- **Existing:** `components/global/GoogleTranslate.tsx` (already complete)

#### Acceptance Criteria

- ✅ Google Translate script loads without errors
- ✅ `window.setTranslateLanguage('ko')` translates page
- ✅ Widget UI hidden, only programmatic control
- ✅ No CSP violations

---

### Phase H: Package Scripts & Docs 📦

**Goal:** Ship freeze scripts and update README

#### Deliverables

1. **Update `package.json`**
   ```json
   {
     "scripts": {
       "freeze:all:on": "cross-env CORE_FREEZE=true NEXT_PUBLIC_CORE_FREEZE=true SHOPS_FREEZE=true NEXT_PUBLIC_SHOPS_FREEZE=true next dev",
       "freeze:all:build": "cross-env CORE_FREEZE=true NEXT_PUBLIC_CORE_FREEZE=true SHOPS_FREEZE=true NEXT_PUBLIC_SHOPS_FREEZE=true next build && next start",
       "test:shops-freeze": "node scripts/test-shops-freeze.mjs"
     }
   }
   ```
   *(Note: `shops:freeze:on` and `shops:freeze:build` already exist)*

2. **Update `README.md`**
   - Add "Freeze Management" section
   - Document freeze scripts: `pnpm freeze:all:on`, `pnpm test:shops-freeze`
   - Document unfreeze ritual: `pwsh ./scripts/toggle-local-unfreeze.ps1`
   - Add disaster recovery section (git tag, DB snapshot restore)

3. **Create Runbook** (append to this doc)

#### Affected Files

- **Updated:** `package.json`
- **Updated:** `README.md`
- **Updated:** `docs/integration-plan.md` (this file)

#### Acceptance Criteria

- ✅ `pnpm freeze:all:on` starts dev with all freezes on
- ✅ README documents freeze workflow
- ✅ Runbook includes disaster recovery steps

---

## Phased Rollout Plan

```
Week 1: Phases A-B (Auth + Types) → Review + Merge
Week 2: Phases C-D (Feeds + Dry-Run) → Review + Merge
Week 3: Phases E-F (Freeze Verification + Scripts) → Review + Merge
Week 4: Phases G-H (Google Translate + Docs) → Final Review + Ship
```

Each phase = 1 PR with clear acceptance tests.

---

## Risk Matrix

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking shop UIs | **CRITICAL** | All work done with freezes ON; visual regression tests before merge |
| Data corruption | **CRITICAL** | Dry-run mode enforced; DB snapshots before unfreeze sessions |
| Type breaking changes | **HIGH** | Gradual migration; keep `lib/types.ts` as fallback |
| Google Translate CSP errors | **MEDIUM** | Test in dev first; add CSP exceptions as needed |
| Onboarding regression | **HIGH** | Existing onboarding tests + dry-run verification |
| Middleware freeze bypass | **MEDIUM** | Automated freeze tests in CI/CD |

---

## Rollback Strategy

### Immediate Rollback (< 5 minutes)

1. **Git Revert**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Environment Variable Rollback**
   ```bash
   # Set freezes ON immediately
   export CORE_FREEZE=true
   export SHOPS_FREEZE=true
   # Restart app
   ```

3. **Database Snapshot Restore** (if data corruption)
   - Use Supabase dashboard → Database → Backups
   - Restore to last known good snapshot (daily backups)

### Full Recovery (< 30 minutes)

1. **Git Tag** (before integration)
   ```bash
   git tag pre-integration-v1.0
   git push origin pre-integration-v1.0
   ```

2. **Rollback to Tag**
   ```bash
   git checkout pre-integration-v1.0
   git push origin main --force  # ⚠️ Coordinate with team
   ```

3. **Re-Mirror Images** (if shop images broken)
   - Run `scripts/bulk-upload-images.mjs` to restore product images

4. **Notification**
   - Alert team via Slack/email
   - Document incident in `docs/incidents/YYYY-MM-DD-integration-rollback.md`

---

## Acceptance Checklist (Pre-Merge)

### With Freezes ON

- [ ] All reads return 200 (main shop feed, influencer shop, products list)
- [ ] All writes blocked (423) via middleware
- [ ] Onboarding dry-run shows correct "would redirect to /dashboard/{role}"
- [ ] Shop UIs unchanged visually (screenshot diff checks)
- [ ] Google Translate widget loads and functions (ko, en, zh-CN)

### With Local Unfreeze

- [ ] Supplier product update succeeds → reflected in main shop feed
- [ ] Influencer curation (add/remove product) succeeds → reflected in influencer feed
- [ ] Onboarding submit persists role → redirects to correct dashboard
- [ ] No console errors or warnings

### Automated Tests

- [ ] `pnpm test:shops-freeze` → green report
- [ ] `pwsh ./scripts/integration-smoke.ps1` → all checks pass
- [ ] E2E tests pass (auth, onboarding, shop navigation)

### Documentation

- [ ] README updated with freeze management
- [ ] This integration plan has runbook section
- [ ] Disaster recovery steps tested (dry run OK)

---

## Runbook: Freeze Management

### Daily Development (Freezes ON)

```bash
# Start dev with all freezes active
pnpm freeze:all:on

# Verify freeze status
pnpm test:shops-freeze
```

### Controlled Unfreeze (Local Testing)

```bash
# Temporary unfreeze for write operations
pwsh ./scripts/toggle-local-unfreeze.ps1

# ⚠️ BIG RED WARNING displayed
# Freezes auto-restore on exit (Ctrl+C)
```

### Manual Freeze Toggle

**Unfreeze:**
```bash
# .env.local
CORE_FREEZE=false
NEXT_PUBLIC_CORE_FREEZE=false
SHOPS_FREEZE=false
NEXT_PUBLIC_SHOPS_FREEZE=false
```

When you need to exercise write flows locally, confirm the Supabase flag mirrors the app env:

```sql
-- Run in Supabase SQL editor
update app.flags set enabled = false where name = 'shops_freeze';
select name, enabled from app.flags order by name;
```

**Re-Freeze:**
```bash
# .env.local
CORE_FREEZE=true
NEXT_PUBLIC_CORE_FREEZE=true
SHOPS_FREEZE=true
NEXT_PUBLIC_SHOPS_FREEZE=true
```

### Production Freeze (Emergency)

```bash
# In Vercel dashboard → Environment Variables
# Set for Production environment:
CORE_FREEZE=true
SHOPS_FREEZE=true

# Redeploy to apply
```

### Disaster Recovery

1. **Stop all writes immediately**
   ```bash
   # Set all freezes to true in .env.local and Vercel
   ```

2. **Assess damage**
   ```bash
   # Check DB via Supabase dashboard
   # Run scripts/verify-db.mjs
   ```

3. **Restore from snapshot**
   - Supabase → Database → Backups → Restore
   - Choose snapshot from before incident

4. **Restore images (if needed)**
   ```bash
   node scripts/bulk-upload-images.mjs
   ```

5. **Verify recovery**
   ```bash
   pnpm test:shops-freeze
   pwsh ./scripts/integration-smoke.ps1
   ```

> TODO: remove `/api/debug/freezes` before production merge, or wrap the handler to return 404 when `process.env.NODE_ENV === 'production'`.

6. **Document incident**
   - Create `docs/incidents/YYYY-MM-DD-description.md`
   - Include timeline, root cause, resolution

---

## Dependencies

### External

- Supabase: Auth, database, storage
- Stripe: Payments (not affected by integration)
- Google Translate: Widget (no API key required for basic widget)

### Internal

- Next.js 15 App Router
- TypeScript 5
- Zustand (client state)
- React Hook Form (forms)
- Zod (validation)

---

## Contact & Support

- **Integration Lead:** [Your Name]
- **Slack Channel:** #onelink-integration
- **Emergency Contact:** [On-call rotation]

---

## Appendix A: File Inventory

### New Files

```
lib/auth/session.ts
types/domain.ts
app/api/influencer/[handle]/feed/route.ts
components/onboarding/DryRunBanner.tsx
scripts/test-shops-freeze.mjs
scripts/toggle-local-unfreeze.ps1
scripts/integration-smoke.ps1
docs/integration-plan.md (this file)
```

### Modified Files

```
lib/auth-context.tsx (add useUser export)
app/api/main-shop/feed/route.ts (map images)
app/api/onboarding/submit/route.ts (dry-run logic)
app/auth/onboarding/page.tsx (show banner)
app/layout.tsx (load GoogleTranslate)
middleware.ts (comments only)
package.json (add freeze scripts)
README.md (freeze management docs)
.env.local (add freeze flags)
next.config.mjs (CSP headers if needed)
```

### Preserved (No Changes)

```
All shop UI components (MainShopCard, ProductCard, etc.)
All dashboard pages (supplier, influencer, admin)
Database schema (no migrations)
Existing onboarding steps (no UX changes)
```

---

## Appendix B: Environment Variables Reference

| Variable | Default | Purpose |
|----------|---------|---------|
| `CORE_FREEZE` | `true` | Block writes to onboarding/dashboards |
| `NEXT_PUBLIC_CORE_FREEZE` | `true` | Client-side freeze indicator |
| `SHOPS_FREEZE` | `true` | Block writes to shops/products |
| `NEXT_PUBLIC_SHOPS_FREEZE` | `true` | Client-side shop freeze indicator |
| `DRY_RUN_ONBOARDING` | `true` | Enable onboarding dry-run mode |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-08 | Initial integration plan created |

---

**End of Document**
