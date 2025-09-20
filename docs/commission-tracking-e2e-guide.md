# Commission Tracking: End-to-End Implementation & Verification Guide

This document explains how influencer attribution flows through checkout to create commission records, what we changed, how to verify your database state, and how to run an end‑to‑end test safely without disrupting the existing purchase flow.


## Summary
- The working checkout, payment (Stripe), and order creation flows remain unchanged.
- We added minimal, backward‑compatible glue to propagate influencer/shop attribution and effective sale prices to the Stripe session metadata.
- The Stripe webhook (`checkout.session.completed`) consumes that metadata to create supplier and (when applicable) influencer commission rows in `public.commissions`.


## Key Files Touched
- `app/api/checkout/route.ts`
  - Adds optional metadata to Stripe session: `influencer_id` and `custom_prices`.
  - Infers influencer context from (in order): `items[].influencerId`, `items[].shopHandle`, Referer header `/shop/[handle]`, or `influencer_shop_products` (single influencer across all items).
  - If influencer is known but the client didn’t supply `effectivePrice`, it fetches `sale_price` from `influencer_shop_products`.
- `lib/store/cart.ts`
  - `CartItem` now supports optional attribution fields: `shopHandle`, `influencerHandle`, `influencerId`, `effectivePrice` (all optional, non‑breaking).
- `lib/validators.ts`
  - `checkoutSchema.items[]` now accepts optional `influencerId`, `shopHandle`, `effectivePrice`, and `price` (non‑breaking).
- `app/api/shop/[handle]/route.ts`
  - The shop API response now includes the influencer `id` in the payload (useful for future client attribution while adding to cart).
- Webhook: `app/api/webhooks/stripe/route.ts` (reference only; not changed in this pass)
  - Expects `session.metadata.influencer_id` and JSON `session.metadata.custom_prices`.
  - Creates commissions after an order is created.


## Commission Rules (Current Behavior)
- Supplier commission: always created. Amount = `base_price * quantity * commission%/100`.
- Influencer commission: created only when `effectiveSalePrice > basePrice`.
  - Amount = `(effectiveSalePrice - basePrice) * quantity`.
  - If your influencer links are **discounts** (sale price < base price), no influencer commission is created by design; only the supplier commission is created.


## Database Prerequisites (Supabase)
Ensure the following tables contain usable data:
- `shops`: shop row with `handle` for the influencer.
- `influencer_shop_products`: published links tying `influencer_id` to `product_id`, with `sale_price`.
- `products`: active, in_stock products with a `commission` rate and `supplier_id` set.
- `profiles`: optional brand profiles (best practice). Commissions reference `products.supplier_id` which points to `auth.users`.


## Quick Verification Queries
Use these in the Supabase SQL Editor.

1) Shops and owners
```sql
select
  s.id            as shop_id,
  s.handle        as shop_handle,
  s.name          as shop_name,
  s.influencer_id,
  p.name          as influencer_name,
  p.verified      as influencer_verified
from shops s
join profiles p on p.id = s.influencer_id
order by s.handle;
```

2) Sellable products with commission
```sql
select
  id             as product_id,
  title,
  price          as base_price,
  commission,
  in_stock,
  active,
  stock_count,
  supplier_id
from products
where active = true and in_stock = true
order by created_at desc
limit 50;
```

3) Influencer links with sale prices for a given handle
```sql
with chosen_shop as (
  select influencer_id
  from shops
  where handle = 'tech-trends'   -- change handle as needed
  limit 1
)
select
  isp.product_id,
  p.title,
  p.price  as base_price,
  isp.sale_price,
  isp.published
from influencer_shop_products isp
join chosen_shop cs on cs.influencer_id = isp.influencer_id
join products p on p.id = isp.product_id
order by isp.created_at desc;
```

4) Ensure a brand profile exists for each supplier (optional best practice)
```sql
-- Create brand profiles for all supplier auth.users referenced by products that don't yet have profiles
create extension if not exists pgcrypto;

with distinct_suppliers as (
  select distinct supplier_id
  from products
  where supplier_id is not null
),
missing_profiles as (
  select ds.supplier_id
  from distinct_suppliers ds
  left join profiles p on p.id = ds.supplier_id
  where p.id is null
)
insert into profiles (id, name, role, verified)
select mp.supplier_id, 'Auto-Created Supplier', 'brand', true
from missing_profiles mp
on conflict (id) do update
  set role = 'brand',
      verified = true,
      name = coalesce(profiles.name, 'Auto-Created Supplier');

select id, name, role, verified
from profiles
where id in (select distinct supplier_id from products)
order by created_at asc
limit 50;
```


## Running a Safe E2E Test (Local)
1) Environment
- `.env.local`:
  - `NEXT_PUBLIC_APP_URL=http://localhost:3000`
  - `STRIPE_SECRET_KEY=sk_test_...`
  - `STRIPE_WEBHOOK_SECRET=whsec_...` (from Stripe CLI below)
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

2) Start dev server
```bash
pnpm dev
```

3) Stripe CLI webhook forwarding (new terminal)
```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```
- Copy the printed `whsec_...` value into `.env.local` as `STRIPE_WEBHOOK_SECRET`.
- Restart `pnpm dev` if you changed it.

4) Choose test path
- Path A (Supplier commission only): use a product with `sale_price < base_price`.
- Path B (Supplier + Influencer commissions): temporarily set ONE product so `sale_price > base_price` in `influencer_shop_products`.

Example to enable Path B for Tech Trends (Portable Bluetooth Speaker):
```sql
with shop as (
  select influencer_id from shops where handle = 'tech-trends' limit 1
)
update influencer_shop_products isp
set sale_price = 89.99    -- base was 79.99; now > base to trigger influencer commission
from shop
where isp.influencer_id = shop.influencer_id
  and isp.product_id = '59d65425-3e16-4d8b-a07f-bd2cea5c5f6e';
```

5) Perform checkout
- Visit: `http://localhost:3000/shop/tech-trends` (or chosen handle).
- Add a linked product to cart and proceed through checkout.
- Pay with Stripe test card `4242 4242 4242 4242`.

6) Verify DB results after webhook
```sql
-- Latest orders
select id, customer_id, total, status, created_at
from orders
order by created_at desc
limit 5;

-- Replace ORDER_ID with the newest order id
select
  c.order_id,
  c.product_id,
  p.title,
  c.supplier_id,
  c.influencer_id,
  c.amount,
  c.rate,
  c.status,
  c.created_at
from commissions c
left join products p on p.id = c.product_id
where c.order_id = 'ORDER_ID'
order by c.created_at;
```

**Expected:**
- Supplier commission always exists per item: `base_price × qty × commission%/100`.
- Influencer commission exists when `sale_price > base_price`: `(sale_price - base_price) × qty`.
- `status = 'pending'` on creation.

7) Optional rollback after Path B test (restore discount)
```sql
with shop as (
  select influencer_id from shops where handle = 'tech-trends' limit 1
)
update influencer_shop_products isp
set sale_price = 75.99   -- prior discounted price
from shop
where isp.influencer_id = shop.influencer_id
  and isp.product_id = '59d65425-3e16-4d8b-a07f-bd2cea5c5f6e';
```


## Troubleshooting
- **No influencer commission created:**
  - Confirm `sale_price > base_price` for at least one item in `influencer_shop_products` for the chosen influencer.
  - Confirm Stripe session metadata has `influencer_id` and `custom_prices` (server infers and populates these in `app/api/checkout/route.ts`).
- **No supplier commission created:**
  - Ensure `products.commission` is set (> 0). Supplier commission always runs.
- **Webhook errors:**
  - Ensure `STRIPE_WEBHOOK_SECRET` matches the value from the current `stripe listen` session.
  - Check server logs in terminal for any parsing/metadata errors.


## Audit Trail & Logging
- The webhook logs order creation and commission creation events on the server.
- The checkout API includes `orderData` (items, total, addresses) and optional influencer metadata in the Stripe session for later auditing.


## Security & Best Practices
- Do not include any secrets in client code.
- Continue using RLS with `auth.uid()` protections as set up in `supabase/setup-auth-compatible.sql`.
- Keep brand/supplier profiles in `profiles` for consistent admin UX (queries, dashboards), although commissions only require `products.supplier_id`.


## Status: What’s Implemented
- ✅ Non‑breaking attribution path and metadata propagation.
- ✅ Webhook creates commissions post‑payment.
- ✅ SQL and instructions to verify and seed missing profiles.
- ✅ Clear test plans for both supplier‑only and influencer+supplier commission outcomes.


## Appendix: Metadata Contract
- `metadata.influencer_id`: UUID of the influencer derived by the checkout API.
- `metadata.custom_prices`: JSON object `{ [productId: string]: number }` for effective sale prices.

These are consumed in `app/api/webhooks/stripe/route.ts` to compute commission rows reliably.
