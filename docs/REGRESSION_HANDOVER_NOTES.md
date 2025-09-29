## Regression Handover Notes — Supplier/Admin Dashboards & Product Import/Export

Updated: 2025-09-29

### Context

- Some dashboard pages return 404 or 403 for an admin account due to supplier-only gating.
- Admin sees a banner like “Verification in progress” and API responses such as “Supplier access required”.
- Product Import/Export features exist and are testable with proper role/verification.

### Supplier Gating Causing 403

The supplier dashboard API blocks non-supplier roles:

```ts
// app/api/dashboard/supplier/route.ts
if (!hasRole(user, [UserRole.SUPPLIER])) {
  return NextResponse.json(
    { ok: false, error: "Supplier access required" },
    { status: 403 }
  );
}
```

### Dev Bypass Options (use only in development)

- Switch to a supplier test account (recommended)
  - Set `profiles.role = 'supplier'` for a test user
  - Ensure a row in `verification_requests` exists and set `status = 'approved'`
- Temporarily allow admin for supplier endpoints
  - Change check to `hasRole(user, [UserRole.SUPPLIER, UserRole.ADMIN])` and guard with `if (process.env.NODE_ENV !== 'production')`
- Disable verification banner only by setting verification to approved (SQL below)

### What’s Built (Locations)

- Supplier Dashboard API: `GET /api/dashboard/supplier` (supplier only)
- Supplier Products UI: `/dashboard/supplier/products` (Import/Export controls)
- Product Import API: `POST /api/products/import` (admin or supplier)
- Product Export API: `GET /api/products/export?status=&category=&regions=` (admin or supplier)
- CSV Template: `GET /api/products/template`

### CSV Contract (aligned import/export)

- Headers: `sku,title,description,image_urls,base_price,commission_pct,regions,inventory,active`
- Regions allowed: Global, KR, JP, CN
- `image_urls`: pipe-separated; example: `https://...|https://...`

### Quick Test Recipes

- Export (admin or supplier)
  - UI: `/dashboard/supplier/products` → Export → choose filters → Export CSV
  - API: `/api/products/export?status=active`
- Import (admin or supplier)
  - UI: Import → upload CSV → Run Dry run → resolve errors → uncheck Dry run → Commit
  - API example:
    ```bash
    curl -X POST http://localhost:3000/api/products/import \
      -H "Content-Type: application/json" \
      -d '{"dryRun":true,"data":["sku,title,description,image_urls,base_price,commission_pct,regions,inventory,active","SKU001,Shirt,Desc,https://ex.mp/img.jpg,29.99,15,Global,100,true"]}'
    ```
  - CSV template: `/api/products/template`

### Regression Checklist (run after enabling supplier context)

- Auth & Access
  - Admin and supplier sign-in flows succeed
  - Supplier banner hides when `verification_requests.status = 'approved'`
- Supplier Dashboard
  - `/dashboard/supplier` renders without 403 as supplier
  - Stats (totals, today, month) and recent orders populate
- Products List
  - `/dashboard/supplier/products` renders
  - Region filter works; Apply reloads data
- Product CRUD
  - Create new product; appears in list
  - Edit price/title; persists on reload
  - Delete removes from list and DB
  - Image upload accepts png/jpg/webp
- Import
  - Template download works
  - Dry run surfaces header/field errors and duplicate SKU (file or DB)
  - Commit inserts rows; counts align with response
  - > 5MB CSV rejected (see `fileConfig.importCsv`)
- Export
  - Filters respected: status/category/regions (array overlap)
  - CSV headers match template; row count reasonable
- Permissions
  - Admin can import/export
  - Supplier export limited to own products (`supplier_id` filter)

### SQL Helpers (Supabase SQL editor)

- Promote a user to supplier

```sql
update profiles set role = 'supplier' where email = 'supplier@test.local';
```

- Approve verification (create if missing)

```sql
insert into verification_requests (user_id, status)
select id, 'approved' from profiles where email = 'supplier@test.local'
on conflict (user_id) do update set status = 'approved';
```

- Revert to pending (to re-test banner)

```sql
update verification_requests
set status = 'pending'
where user_id = (select id from profiles where email = 'supplier@test.local');
```

### Notes

- Import currently rejects existing SKUs (no upsert).
- Admin access to supplier dashboard is intentionally blocked; use a supplier account or dev bypass during testing.
