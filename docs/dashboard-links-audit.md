# Dashboard Links Audit

Scope: Admin, Supplier, and Influencer dashboards. This report lists all navigation UI elements, their destinations, existence, and role correctness, and flags issues with recommendations.

---

## 1) Admin Dashboard (`app/admin/dashboard/page.tsx` → `/admin/dashboard`)

### Current Links

| Button/Link | Destination | Destination Exists? | Correct Role? | Notes |
|---|---|---|---|---|
| View All Users | `/admin/dashboard` | Yes (self) | Yes | Placeholder (no dedicated users page found) |
| Manage Roles | `/admin/dashboard` | Yes (self) | Yes | Placeholder |
| User Analytics | `/admin/dashboard` | Yes (self) | Yes | Placeholder |
| Manage Products | `/dashboard/supplier/products` | Yes | Yes (admin allowed) | Uses supplier dashboard route; middleware allows admin to access any dashboard |
| Review Shops | `/shops` | Yes | Public | Public directory of shops |
| Content Moderation | `/admin/dashboard` | Yes (self) | Yes | Placeholder |
| View Orders | `/dashboard/supplier/orders` | Yes | Yes (admin allowed) | Uses supplier dashboard route |
| Payment Reports | `/dashboard/supplier/orders` | Yes | Yes (admin allowed) | Placeholder piggybacking on orders list |
| Commission Tracking | `/dashboard/supplier/commissions` | Yes | Yes (admin allowed) | Uses supplier dashboard route |
| Platform Settings | `/dashboard/supplier/settings` | Yes | Yes (admin allowed) | Uses supplier route |
| Security Settings | `/dashboard/supplier/settings` | Yes | Yes (admin allowed) | Uses supplier route |
| System Logs | `/admin/dashboard` | Yes (self) | Yes | Placeholder |

### Issues Found

- **[admin→supplier coupling]** Several admin quick actions route into supplier dashboard pages instead of admin-specific views.
- **[placeholders]** Many buttons point to `/admin/dashboard` (self), indicating missing pages: Users, Roles, Analytics, Content Moderation, System Logs.

### Recommendations

- **[admin routes]** Create admin-specific pages under `app/admin/`:
  - `app/admin/users/`, `app/admin/roles/`, `app/admin/analytics/`, `app/admin/moderation/`, `app/admin/logs/`.
- **[decouple]** Repoint admin quick actions to these admin routes when implemented to avoid cross-role coupling.
- **[interim]** If admin is intended to oversee supplier flows, keep current links but document this behavior.

---

## 2) Supplier Dashboard (`app/dashboard/supplier/page.tsx` → `/dashboard/supplier`)

### Current Links

| Button/Link | Destination | Destination Exists? | Correct Role? | Notes |
|---|---|---|---|---|
| Add Product (top button) | `/dashboard/supplier/products/new` | Yes | Supplier/Admin | Works; write actions subject to SHOPS_FREEZE |
| QA: Add Product | `/dashboard/supplier/products/new` | Yes | Supplier/Admin | Works |
| QA: View Analytics | `/dashboard/supplier/analytics` | Yes | Supplier/Admin | Works |
| QA: Manage Inventory | `/dashboard/supplier/products` | Yes | Supplier/Admin | Works |
| QA: Settings | `/dashboard/supplier/settings` | Yes | Supplier/Admin | Works |

Non-links (informational only): KPI card icons, “Top Performing Products” rows, “Recent Orders” rows.

### Issues Found

- None observed in navigation. All linked actions resolve to existing pages and fit role boundaries (admins can access any dashboard per middleware).

### Recommendations

- Optionally add links from KPI cards to relevant pages (e.g., Products, Orders, Commissions) if desired UX.

---

## 3) Influencer Dashboard (`app/dashboard/influencer/page.tsx` → `/dashboard/influencer`)

### Current Links

| Button/Link | Destination | Destination Exists? | Correct Role? | Notes |
|---|---|---|---|---|
| QA: Manage My Shop | `/dashboard/influencer/shop` | Yes | Influencer/Admin | Works |
| QA: Preview My Shop | `/shop/[handle]` | Yes (via `app/shops/`) | Public | Hidden unless `shopHandle` exists |
| QA: View Analytics | `/dashboard/influencer/analytics` | Yes | Influencer/Admin | Works |

Additional influencer routes available by direct navigation (not linked on the dashboard page):

| Route | Exists? | Notes |
|---|---|---|
| `/dashboard/influencer/products` | Yes | Present, not linked from dashboard |
| `/dashboard/influencer/earnings` | Yes | Present, not linked from dashboard |
| `/dashboard/influencer/settings` | Yes | Present, not linked from dashboard |

### Issues Found

- None critical. Some useful subpages exist but are not linked from the dashboard quick actions.

### Recommendations

- Consider adding quick actions for `Products`, `Earnings`, and `Settings` for quicker access.

---

## Role Boundary Summary (from `middleware.ts`)

- Admin: can access any `/dashboard/*` route. Admin-only check for `/admin/*`.
- Supplier: can access `/dashboard/supplier/*`. Middleware redirects to correct dashboard if mismatched.
- Influencer: can access `/dashboard/influencer/*`. Middleware redirects to correct dashboard if mismatched.
- Public pages like `/shops` are open.

Implication: Admin buttons pointing to supplier routes are allowed by middleware. This is acceptable if intended; otherwise, create admin-native pages and update links.

---

## Overall Issues & Recommendations

- **[A1] Admin buttons use supplier routes**
  - Impact: Cross-role coupling; navigates to supplier UI patterns.
  - Recommendation: Implement admin-native pages under `app/admin/*` and repoint links.

- **[A2] Admin placeholders**
  - Impact: Buttons loop to the same page without distinctive functionality.
  - Recommendation: Scaffold `users/`, `roles/`, `analytics/`, `moderation/`, and `logs/` pages.

- **[S1] Supplier UX enhancements (optional)**
  - Recommendation: Add optional deep-links from KPI cards to relevant sections.

- **[I1] Influencer quick actions coverage (optional)**
  - Recommendation: Add buttons for `products`, `earnings`, and `settings` to the dashboard quick actions.

---

## Artifacts & References

- Admin: `app/admin/dashboard/page.tsx`
- Supplier: `app/dashboard/supplier/page.tsx`
- Influencer: `app/dashboard/influencer/page.tsx`
- Related routes used in links:
  - `app/shops/`
  - `app/dashboard/supplier/products/`, `.../products/new/`, `.../orders/`, `.../commissions/`, `.../settings/`, `.../analytics/`
  - `app/dashboard/influencer/shop/`, `.../analytics/`, `.../products/`, `.../earnings/`, `.../settings/`
- Role enforcement: `middleware.ts`
