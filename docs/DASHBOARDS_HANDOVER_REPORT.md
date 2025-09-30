## Comprehensive Handover — Dashboards, Admin Pages, and Product Management

Updated: 2025-09-29

### Scope

- Admin console (`/app/admin/dashboard/page.tsx`)
- Unified dashboard shell (`/app/dashboard/layout.tsx`)
- Supplier dashboard and products (`/app/dashboard/supplier/**`)
- Influencer dashboard (`/app/dashboard/influencer/**`)
- Access control and gating (`/middleware.ts`, `lib/auth-helpers.ts`, selected API routes)

---

### High-level Findings

- **Admin Dashboard** exists and is role-protected server-side. Shows stats and placeholder tabs for products, orders, commissions, disputes. Product tab UI is mostly static.
- **Supplier Dashboard** pages exist: overview, products (CRUD UI), orders (test stub), analytics, commissions, settings. Products page includes Import/Export UI wired to API.
- **Influencer Dashboard** exists with basic UI (overview, My Shop page). My Shop builder present but may not be fully integrated.
- **Access control** is enforced via `middleware.ts` and specific API routes. Admin can access any dashboard URL, but API handlers may still apply role checks (e.g., supplier-only endpoints), which can cause 403s when testing as admin depending on route logic.
- **Verification banners** are rendered via `VerificationBannerWrapper`, referencing verification state; onboarding KYC/KYB integration is partially implemented per `ONBOARDING_WORKFLOW_FIX.md`.

---

### Access & Gating Summary

- `middleware.ts` public routes include: `/influencers`, `/brands`, `/dashboard/supplier`, `/dashboard/influencer`, `/admin/dashboard`, and product/shop APIs for public reads.
- Dashboard route protection:
  - Admins: can access any `/dashboard/*` page.
  - Non-admins: redirected to their own dashboard or home if role mismatch.
- API route protection includes:
  - Admin-only: `/api/admin/*`
  - Supplier write ops: `/api/products/*` require `supplier` or `admin`.
  - Influencer write ops: `/api/shops/*` require `influencer` or `admin`.
- Some dashboard data APIs (e.g., supplier dashboard data) may still check for supplier role only, which can block admin testing for those API-driven widgets.

Key snippet (dashboard access):

```90:113:middleware.ts
// Dashboard route protection
if (pathname.startsWith("/dashboard/")) {
  const dashboardRole = pathname.split("/")[2];
  if (userRole !== "admin" && userRole !== dashboardRole) {
    const redirectPath = userRole === "customer" ? "/" : `/dashboard/${userRole}`;
    return NextResponse.redirect(new URL(redirectPath, req.url));
  }
}
```

---

### Admin Console (`/admin/dashboard`)

- Server-side role check using `profiles.role === ADMIN` (redirects to `/admin/login` if unauthorized).
- Displays total users, products, orders, shops via aggregated Supabase queries.
- Tabs: Verifications, Products, Orders, Commissions, Disputes.
  - Products tab indicates "Product management interface would be implemented here" — mostly placeholder UI.

Reference:

```27:36:app/admin/dashboard/page.tsx
if (!userData || userData.role !== UserRole.ADMIN) {
  redirect("/admin/login?error=Unauthorized access");
}
```

---

### Supplier Dashboard & Product Management

- Pages:
  - `overview`: `/dashboard/supplier/page.tsx`
  - `products`: `/dashboard/supplier/products/page.tsx` with table, region filter, import/export, add product.
  - `products/new`: create form page.
  - `products/[id]`: edit page (`EditProductClient.tsx`).
  - `orders/test-order`: stub route.
- Import/Export:
  - Import `POST /api/products/import` — supports dry-run validation, CSV headers: `sku,title,description,image_urls,base_price,commission_pct,regions,inventory,active`.
  - Export `GET /api/products/export` — CSV with template-compatible headers and filters.

References:

```51:66:app/api/products/import/route.ts
// POST /api/products/import - Import products from CSV (suppliers/admins only)
export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser(supabase);
  if (!user || !hasRole(user, [UserRole.SUPPLIER, UserRole.ADMIN])) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 403 });
  }
}
```

```16:35:app/api/products/export/route.ts
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(supabase);
  if (!hasRole(user, [UserRole.SUPPLIER, UserRole.ADMIN])) {
    return NextResponse.json({ ok: false, error: "Insufficient permissions" }, { status: 403 });
  }
}
```

UI trigger points:

```152:167:app/dashboard/supplier/products/page.tsx
<Button variant="outline" onClick={() => setShowImportDialog(true)}>
  Import
</Button>
<Button variant="outline" onClick={() => setShowExportDrawer(true)}>
  Export
</Button>
```

---

### Influencer Dashboard

- Basic dashboard at `/dashboard/influencer/page.tsx` shows static metrics.
- `My Shop` builder at `/dashboard/influencer/shop/page.tsx` exists; integration with real data may be partial.
- Dashboard layout renders `VerificationBannerWrapper`, hinting KYC gating UX, driven by user verification status.

Layout reference:

```162:167:app/dashboard/layout.tsx
<VerificationBannerWrapper
  userRole={user.role === "supplier" ? "brand" : "influencer"}
  verificationStatus={user.verificationStatus}
/>
```

---

### Known Issues Observed

- Some pages render but underlying API widgets 403 when testing as admin due to supplier-only checks in certain API handlers.
- Admin product management tab is UI-only; lacks real product CRUD integration.
- Onboarding KYC/KYB upload not fully integrated with storage/API per `ONBOARDING_WORKFLOW_FIX.md`.
- Supplier products page relies on role being `supplier` for client fetch; admin may need explicit support paths for viewing/managing all suppliers’ products.

---

### Recommendations (no code changes yet)

- Unify role checks: allow admin in all supplier/influencer APIs where read/manage is intended.
- Add admin-scoped views for supplier products (filter by supplier, global search) to the admin console.
- Complete onboarding integration: use `DocumentUploader` in KYC/KYB steps, wire to storage/API.
- Improve verification banner logic to reflect actual backend verification state and to provide actionable CTAs for incomplete steps.
- Expand automated tests for access edge cases: admin viewing supplier pages, supplier without verification, influencer shop creation flows.

---

### Quick QA Checklist (for later re-runs)

- Access
  - Admin can open `/admin/dashboard` and all `/dashboard/*` pages without redirect loops.
  - Admin can call supplier-dedicated APIs for read/management where applicable.
- Supplier
  - Products list loads with filters; CRUD works.
  - Import dry-run detects errors; commit inserts valid rows.
  - Export returns CSV filtered by region/status.
- Influencer
  - Dashboard loads; Shop builder page renders; basic actions work.
- Onboarding/Verification
  - Influencer and supplier flows show document uploader; submissions persist; banner reflects status.

---

### Field Verification — Playwright MCP (2025-09-29)

Observed via real browser checks:

- Admin sign-in
  - Navigated to `\/sign-in`, entered admin test credentials, and successfully authenticated.
  - Redirected to `\/admin\/dashboard` with stats cards visible.

- Admin access to other dashboards
  - Opened `\/dashboard\/supplier` and `\/dashboard\/supplier\/products` while still authenticated as admin. Pages rendered without redirect or 403; supplier layout and verification banner were visible.
  - Opened `\/dashboard\/influencer`; page rendered dashboard content and quick actions.

- Shops directory
  - `\/shops` loaded a list of shops. Console showed some asset 400\/404 warnings but UI rendered.

- Discrepancy against prior manual note
  - Prior manual observation claimed admin was limited on supplier pages. In our run, admin access to supplier and influencer dashboards was allowed and pages rendered. This aligns with `middleware.ts` which permits admins to access any `\/dashboard\/*` route.

- Notable limitations observed
  - Supplier products view displayed a verification-in-progress banner; the products table content was not populated during this run. Likely dependent on seed data or verification\/role gating in client fetch or APIs.
  - Console errors: some static assets and third-party scripts reported 404\/warnings; did not block primary flows.

Pages exercised

- `\/sign-in`, `\/admin\/dashboard`, `\/dashboard\/supplier`, `\/dashboard\/supplier\/products`, `\/dashboard\/influencer`, `\/shops`

---

### Additional Manual Observations (2025-09-29)

While logged in as admin and browsing supplier dashboards directly:

- `\/dashboard\/supplier` (Overview)
  - UI renders, but the primary dashboard widget reports: "Supplier access required" and offers a Retry button. This confirms the supplier-only API gate even when the page shell is accessible to admin.

- `\/dashboard\/supplier\/orders`
  - Returns `404 This page could not be found.` (no route implemented under `orders` except `orders\/test-order`).

- `\/dashboard\/supplier\/analytics`
  - Returns `404 This page could not be found.` (route not implemented).

- `\/dashboard\/supplier\/products`
  - Page renders the supplier shell and verification banner; table content not populated for admin session during this session. Likely blocked by supplier-only data fetch or missing seed data.

Conclusion: Admin can open supplier routes (per middleware), but most supplier data endpoints and several pages are either supplier-only or not implemented (404). This matches `REGRESSION_HANDOVER_NOTES.md` intent (supplier-only data) and clarifies that the limitation is at the API\/page implementation layer rather than route access.
