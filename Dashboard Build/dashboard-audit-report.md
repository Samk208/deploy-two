# One-Link Dashboards & Product Management — Comprehensive Overview

This report summarizes the current state of the influencer and supplier dashboards, the product management system, connected APIs, and recommended improvements. File and route references are included for clarity.

## Influencer Dashboard

- **Overview**
  - URL: `/dashboard/influencer`
  - File: `app/dashboard/influencer/page.tsx`
  - Status: Implemented; working UI shell.
  - Notes: Resolves real shop handle via `createServerSupabaseClient()` and renders “Preview My Shop” only when a handle exists.
  - Links: Manage My Shop → `/dashboard/influencer/shop`; Preview My Shop → `/shop/[handle]`

- **My Shop (Builder)**
  - URL: `/dashboard/influencer/shop`
  - File: `app/dashboard/influencer/shop/page.tsx`
  - Status: Implemented; working.
  - Features: Filter/search, add/remove products, custom title/price/description, drag-and-drop reorder, quick analytics.
  - APIs: `app/api/influencer/shop/route.ts`, `app/api/influencer/shop/[id]/route.ts`

- **Curated Products**
  - URL: `/dashboard/influencer/products`
  - File: `app/dashboard/influencer/products/page.tsx`
  - Status: Implemented placeholder (scaffold).

- **Analytics**
  - URL: `/dashboard/influencer/analytics`
  - File: `app/dashboard/influencer/analytics/page.tsx`
  - Status: Implemented placeholder (scaffold).

- **Earnings**
  - URL: `/dashboard/influencer/earnings`
  - File: `app/dashboard/influencer/earnings/page.tsx`
  - Status: Implemented placeholder (scaffold).

- **Settings**
  - URL: `/dashboard/influencer/settings`
  - File: `app/dashboard/influencer/settings/page.tsx`
  - Status: Implemented placeholder (scaffold).

- **Public Shops**
  - Directory: `/shops` → `app/shops/page.tsx` (public listing)
  - Single Shop: `/shop/[handle]` → `app/shop/[handle]/page.tsx`
  - Data for shop SSR: `app/api/shop/[handle]/route.ts`

## Supplier Dashboard

- **Overview**
  - URL: `/dashboard/supplier`
  - File: `app/dashboard/supplier/page.tsx`
  - Status: Implemented; working.
  - Data: `GET /api/dashboard/supplier` → `app/api/dashboard/supplier/route.ts`

- **Products**
  - Index: `/dashboard/supplier/products` → `app/dashboard/supplier/products/page.tsx`
  - New: `/dashboard/supplier/products/new` → `app/dashboard/supplier/products/new/page.tsx`
  - Edit: `/dashboard/supplier/products/[id]` → `app/dashboard/supplier/products/[id]/EditProductClient.tsx`
  - Status: Implemented; working end-to-end.

- **Orders**
  - URL: `/dashboard/supplier/orders` → `app/dashboard/supplier/orders/page.tsx`
  - Status: Implemented; MVP/basic UI.
  - APIs: `app/api/commissions/route.ts` (supplier-scoped lists), `app/api/orders/[id]/route.ts`.

- **Analytics**
  - URL: `/dashboard/supplier/analytics` → `app/dashboard/supplier/analytics/page.tsx`
  - Status: Implemented; MVP/basic (can reuse `/api/dashboard/supplier`).

- **Commissions**
  - URL: `/dashboard/supplier/commissions` → `app/dashboard/supplier/commissions/page.tsx`
  - Status: Implemented; working via `app/api/commissions/route.ts`.

- **Settings**
  - URL: `/dashboard/supplier/settings` → `app/dashboard/supplier/settings/page.tsx`
  - Status: Implemented placeholder (prevents 404).

## Product Management System

- **Entities**: `products`, `influencer_shop_products`, `orders`, `commissions` (webhooks from Stripe create/attach rows).
- **Uploads**
  - Canonical helper: `lib/storage/upload.ts` (validates type/size, converts to WebP when possible, returns `{ key, url }`).
  - Integrated in: `app/dashboard/supplier/products/[id]/EditProductClient.tsx`.
  - Legacy `lib/storage.ts:uploadProductImage()` is deprecated.
- **APIs**
  - Products CRUD: `app/api/products/*`
  - Commissions: `app/api/commissions/route.ts`
  - Orders details: `app/api/orders/[id]/route.ts`
  - Stripe webhook: `app/api/webhooks/stripe/route.ts`

## Access Control & Layout

- **Middleware**: `middleware.ts` enforces role access using `profiles.role`. Non-admins redirected to their correct dashboard.
- **Dashboard Layout**: `app/dashboard/layout.tsx` now resolves the real role and influencer shop handle server-side and renders correct nav and “View Shop” link.

## What Works Today

- Influencer overview and My Shop builder fully functional.
- Public directory `/shops` and individual shops `/shop/[handle]` work.
- Supplier Overview, Products (index/new/edit), Commissions working.
- Supplier Orders and Analytics exist with MVP UIs.
- Product image uploads use canonical helper and persist correctly.

## Improvements & Nice-to-Haves

- **Influencer**
  - Add `app/api/dashboard/influencer/route.ts` for KPIs/timeseries (earnings, clicks, conversion) by `influencer_id`.
  - Implement Curated Products index (publish state, filters, bulk actions using shop APIs).
  - Earnings page: period aggregation, payout statuses, CSV export.
  - Settings: profile/shop settings (avatar, banner, bio, socials, handle management with uniqueness check).

- **Supplier**
  - Orders page: add list endpoint (aggregate by order or explicit `/api/orders` list) with pagination, search, status filters.
  - Analytics: charts (revenue, orders, units, top influencers); add `/api/dashboard/supplier/analytics` if needed.
  - Settings content: company profile, payment info, notifications.

- **Product System**
  - Multi-image reorder/delete UI persisted via `PUT /api/products/[id]` (optimistic UI).
  - Bulk ops: CSV import/export; mass price updates.
  - Storage RLS: ensure only suppliers can write to `products/{productId}/…` they own.
  - Private buckets: switch to signed URLs for reads if made private.
  - Variants: optional size/color with inventory.

- **Architecture & UX**
  - Route groups: `app/dashboard/(supplier)/layout.tsx` and `app/dashboard/(influencer)/layout.tsx` for cleaner separation.
  - Pagination & caching: add to heavy lists; use `revalidate` where safe.
  - Error handling: standard toasts, retries; central server logging.
  - Observability: Sentry for client/server traces.
  - Tests: expand Playwright tests for new influencer pages and supplier orders/analytics.

- **Security & Performance**
  - Input validation in `lib/validators.ts` for dashboard filters/pagination.
  - DB indexes for common queries (e.g., `commissions(influencer_id, product_id, created_at)`, `orders(supplier_id, created_at)`).
  - Materialized views for monthly summaries/top products if scale grows.

## Key File/Route Index

- Layout/Role: `app/dashboard/layout.tsx`, `middleware.ts`
- Influencer: `app/dashboard/influencer/{page.tsx, shop/page.tsx, products/page.tsx, analytics/page.tsx, earnings/page.tsx, settings/page.tsx}`
- Supplier: `app/dashboard/supplier/{page.tsx, products/page.tsx, products/new/page.tsx, products/[id]/EditProductClient.tsx, orders/page.tsx, analytics/page.tsx, commissions/page.tsx, settings/page.tsx}`
- Public shops: `app/shops/page.tsx`, `app/shop/[handle]/page.tsx`, `app/api/shop/[handle]/route.ts`
- APIs: `app/api/dashboard/supplier/route.ts`, `app/api/influencer/shop/route.ts`, `app/api/influencer/shop/[id]/route.ts`, `app/api/commissions/route.ts`, `app/api/orders/[id]/route.ts`, `app/api/webhooks/stripe/route.ts`
- Upload helper: `lib/storage/upload.ts`
