# Dashboard Build - Handover Notes

Last updated: 2025-10-01

## Scope
- Supplier dashboard backend/API and UI status
- Influencer dashboard UI status and gaps
- Existing commissions/orders plumbing to avoid duplication
- What’s left to build (supplier + influencer), with concrete next steps

---

## Supplier Dashboard

### Implemented
- API endpoint: `app/api/dashboard/supplier/route.ts`
  - AuthZ: requires `supplier` role
  - Data sources:
    - `products` scoped by `supplier_id`
    - `commissions` joined to `orders` for supplier-scoped revenue/sales
  - Metrics returned (`SupplierDashboardData`):
    - `stats`: totalProducts, totalRevenue, totalSales, activeOrders, commissionEarned, influencerPartners
    - `todayStats`, `thisMonthStats`
    - `topProducts` (fallback aggregation from commissions)
    - `recentOrders`
  - Recent fixes:
    - Added `product_id` in commissions select for product-level grouping
    - Corrected `created_at` handling (no default to now; invalid timestamps ignored for time aggregates)
    - Implemented fallback `topProducts` by grouping commissions by product and title
- UI page: `app/dashboard/supplier/page.tsx`
  - Renders KPIs, Today’s Performance, Top Products, Recent Orders
  - Consumes `/api/dashboard/supplier`
- Commissions page route present (per tests):
  - `tests/e2e/dashboard/supplier-dashboard.spec.ts` expects `/dashboard/supplier/commissions` to load
- Orders/Analytics routes currently unimplemented (404 by design in tests)

### Related Backend (used by supplier dashboard)
- Commissions API: `app/api/commissions/route.ts`
  - List with filters; role-aware (admin, influencer, supplier)
  - Create commission (admin-only path)
- Orders API: `app/api/orders/[id]/route.ts`
  - Fetch single order (role-aware), update status (admin)
- Stripe Webhook: `app/api/webhooks/stripe/route.ts`
  - Creates `orders` and inserts supplier commissions per order item

### Database & RLS (Supabase)
- Tables present: `products`, `orders`, `commissions`, etc.
- RLS enabled on all; supplier scoping via `products.supplier_id`; commissions/ orders have appropriate policies.
- See `supabase/migrations/20250102_initial_schema.sql` and `supabase/setup-auth-compatible.sql`.
- Notes doc: `docs/wonlink-supplier-rls-policies-sql.sql` explains RLS rationale.

### Gaps / Next Steps (Supplier)
1) Orders index page
- Route: `app/dashboard/supplier/orders/page.tsx`
- Data: start with `/api/commissions` grouped by order, or create `/api/orders?supplierId=...` list if needed
- Columns: order id, date, total, status, items count, commission earned

2) Commissions page (if missing UI)
- Route: `app/dashboard/supplier/commissions/page.tsx`
- Data: `GET /api/commissions?status=&limit=&offset=` (supplier-scoped)

3) Analytics page
- Route: `app/dashboard/supplier/analytics/page.tsx`
- Start by visualizing aggregates already provided by `/api/dashboard/supplier`
- Optional backend: create `/api/dashboard/supplier/analytics` for timeseries

4) Recent Orders details
- Link to `/api/orders/[id]` backed details page `app/dashboard/supplier/orders/[id]/page.tsx`

5) Tests
- Update or add Playwright specs for orders index and analytics once pages exist

---

## Influencer Dashboard

### Implemented
- UI route shells:
  - `app/dashboard/influencer/page.tsx` (static UI placeholders)
  - `app/dashboard/influencer/shop/page.tsx`
- E2E access test: `tests/e2e/dashboard/influencer-dashboard.spec.ts`

### Not Implemented (Backend)
- No `app/api/dashboard/influencer` endpoint yet
- No influencer commissions summary endpoint

### Next Steps (Influencer)
1) Backend endpoint
- Route: `app/api/dashboard/influencer/route.ts`
- Auth: `influencer` role
- Data: commissions where `influencer_id = user.id`, shop performance, timeseries (optional)

2) UI pages
- `app/dashboard/influencer/analytics/page.tsx` (charts/timeseries)
- Commissions list for influencers (reuse `/api/commissions` with role filter)

3) Tests
- Expand Playwright tests to verify KPIs and charts

---

## Existing Commission System (Avoid Duplicates)
- Table `commissions` exists with RLS and indexes
- Write-path: Stripe webhook logs supplier and optional influencer commission per order item
- Read-paths:
  - `/api/commissions` supports list, filters, role-based access
  - `/api/dashboard/supplier` aggregates supplier view via commissions + orders join
- Recommendation: build UI on top of existing routes first; only add new endpoints when additional aggregations are required

---

## Risks & Considerations
- RLS: keep supplier/influencer scoping through `commissions` and `products.supplier_id`
- Time calculations: ensure invalid `created_at` values are excluded from time windows
- Performance: commission joins limited to recent N rows; consider pagination/cursors for larger datasets

---

## Actionable Backlog
- Supplier Orders page (index) consuming commissions aggregation
- Supplier Analytics page using supplier dashboard aggregates (and optional timeseries API)
- Influencer dashboard API endpoint and analytics UI
- Add end-to-end tests for new pages
