# Dashboard Handover Note

This note explains how the three dashboards work, how access/links are enforced, where code lives, and how to test safely with freezes.

## Access Control and Freezes

- **[Role-based routing]**
  - File: `middleware.ts`
  - Behavior:
    - Admin can access any `/dashboard/*` route; non-admins are redirected to their role dashboard (e.g., `/dashboard/supplier`, `/dashboard/influencer`).
    - Admin-only routes are under `/admin/*`.
- **[Freeze flags]**
  - Server flags: `CORE_FREEZE`, `SHOPS_FREEZE`
  - Client flags: `NEXT_PUBLIC_CORE_FREEZE`, `NEXT_PUBLIC_SHOPS_FREEZE`
  - Enforced in `middleware.ts`:
    - Core freeze blocks writes to onboarding, dashboards, role APIs.
    - Shops freeze blocks product/shop writes.
  - UI banners:
    - `components/FreezeBanner.tsx` (core)
    - `components/ShopFreezeBanner.tsx` (shops)
  - Runtime check: `GET /api/debug/freezes` (`app/api/debug/freezes/route.ts`)

---

## Admin Dashboard

- **[Primary page]**
  - File: `app/admin/dashboard/page.tsx`
  - Purpose: Admin overview and quick actions.
- **[Navigation]**
  - Component: `components/admin/admin-nav.tsx`
  - Links: `/admin/dashboard`, `/admin/users`, `/admin/products`, `/admin/orders`, `/admin/settings` (some may be placeholders unless implemented).
- **[Permissions]**
  - Enforced via `middleware.ts` (admin-only under `/admin/*`).
- **[Known behavior]**
  - Admin is allowed to view supplier dashboards; this is intentional for oversight.

---

## Supplier Dashboard

- **[Landing page]**
  - File: `app/dashboard/supplier/page.tsx`
  - Features:
    - KPI cards, Today’s Performance, Top Products, Recent Orders.
    - Quick Actions row with clear navigation:
      - Add Product → `/dashboard/supplier/products/new`
      - View Analytics → `/dashboard/supplier/analytics`
      - Manage Inventory → `/dashboard/supplier/products`
      - Settings → `/dashboard/supplier/settings`
  - Note: Buttons are wrapped with `Link` to ensure icons/text navigate reliably.

- **[Products list]**
  - File: `app/dashboard/supplier/products/page.tsx`
  - Behavior:
    - Fetches via `getProducts()` in `@/lib/api/client`.
    - Determines `owner` by role:
      - Admin → `owner="admin"` (sees all products)
      - Supplier → `owner="supplier"` (sees own products)
    - Shows robust empty state; avoids blank screen.
    - Respects freezes (read-only under freeze).
  - Supporting files:
    - Table: `app/dashboard/supplier/products/data-table.tsx`
    - Columns: `app/dashboard/supplier/products/columns.tsx`
    - Import/Export UI: `app/dashboard/supplier/products/components/*`

- **[Products new/edit]**
  - New product: `app/dashboard/supplier/products/new/page.tsx`
  - Edit product: `app/dashboard/supplier/products/[id]/*`
  - Writes are blocked if freezes are on; GET renders are fine.

- **[Orders]**
  - File: `app/dashboard/supplier/orders/page.tsx`
  - Uses React Query SSR prefetch from `/api/dashboard/supplier`.
  - UI-only admin banner shown when viewer is admin.

- **[Commissions]**
  - File: `app/dashboard/supplier/commissions/page.tsx`
  - Prefetches `/api/commissions` with default filters `{ owner: "supplier", status: "pending" }`.
  - UI-only admin banner when viewer is admin.

- **[Analytics]**
  - File: `app/dashboard/supplier/analytics/page.tsx`
  - Read-only analytics view (admin typically won’t use).

- **[Settings]**
  - File: `app/dashboard/supplier/settings/page.tsx`
  - Placeholder page.
  - UI-only admin banner when viewer is admin.

---

## Influencer Dashboard

- **[Landing page]**
  - File: `app/dashboard/influencer/page.tsx`
  - Quick Actions:
    - Manage My Shop → `/dashboard/influencer/shop`
    - Preview My Shop → `/shop/[handle]` (shown when `shopHandle` exists)
    - View Analytics → `/dashboard/influencer/analytics`
  - Additional routes (direct nav, not linked by default):
    - `/dashboard/influencer/products`
    - `/dashboard/influencer/earnings`
    - `/dashboard/influencer/settings`

- **[Key subpages]**
  - Shop management: `app/dashboard/influencer/shop/page.tsx`
  - Analytics: `app/dashboard/influencer/analytics/page.tsx`
  - Products: `app/dashboard/influencer/products/page.tsx`
  - Earnings: `app/dashboard/influencer/earnings/page.tsx`
  - Settings: `app/dashboard/influencer/settings/page.tsx`

---

## APIs and Data Sources

- **[Supplier dashboard data]**
  - Route: `/api/dashboard/supplier` (queried from `app/dashboard/supplier/orders/page.tsx` for prefetch; also used by dashboard fetch in `supplier/page.tsx`).
- **[Products API]**
  - File: `app/api/products/route.ts`
  - Owner behavior:
    - `owner=supplier`: filters `supplier_id = session.user.id`
    - `owner=admin`: admin-visible query for all
    - No changes needed for reads; writes blocked by freeze.
- **[Commissions API]**
  - File: `app/api/commissions/*` (queried from commissions page with filters)
- **[Public shop feeds]**
  - Main shop: `app/api/main-shop/route.ts`
  - Influencer shop feed: `app/api/influencer/[handle]/feed/route.ts`
  - Both are read-only and not affected by dashboard freezes.

---

## Testing Guide (Safe)

- **[Verify freezes]**
  - `GET /api/debug/freezes` should return all flags `"true"` while fixing.
  - Banners:
    - Core banner on dashboards (`components/FreezeBanner.tsx`)
    - Shop banner on product-related UIs (`components/ShopFreezeBanner.tsx`)
- **[Admin navigation]**
  - `/admin/dashboard` works.
  - Admin can access `/dashboard/supplier/*` and `/dashboard/influencer/*` (oversight).
  - Admin-view banners appear on supplier `orders/commissions/settings`.
- **[Supplier navigation]**
  - `/dashboard/supplier` Quick Actions:
    - Add Product → `/dashboard/supplier/products/new`
    - View Analytics → `/dashboard/supplier/analytics`
    - Manage Inventory → `/dashboard/supplier/products`
    - Settings → `/dashboard/supplier/settings`
  - Products List:
    - Supplier sees only their own products.
    - Admin sees full catalog.
- **[Influencer navigation]**
  - `/dashboard/influencer` Quick Actions as above.
  - Preview My Shop visible only if `shopHandle` exists.

---

## Known UX Notes

- **[Supplier KPI icons]**
  - KPI icons are decorative in `app/dashboard/supplier/page.tsx` and not intended to navigate. Use Quick Actions for navigation.
- **[Header menu]**
  - `components/layout/header.tsx` controls avatar menu and “Dashboard” link. Sign-out flow may require auth reactivity improvements to update immediately in UI.

---

## Suggested Future Work

- **[Admin-native pages]**
  - If desired, build admin-owned views under `app/admin/`:
    - `users/`, `roles/`, `analytics/`, `moderation/`, `logs/`, `products/`, `orders/`, `settings/`
  - Repoint admin quick actions away from supplier routes once implemented.
- **[Influencer dashboard]**
  - Add quick action buttons for `products`, `earnings`, and `settings`.
- **[Supplier KPI deep-links]**
  - Optional: turn KPI cards into links (e.g., “Total Products” → `/dashboard/supplier/products`).

---

# Status

- Role and freeze controls documented; relevant files and routes mapped.
- Supplier dashboard actions and products list behavior clarified for both roles.
- Admin banners present where needed for supplier pages.
