# Supabase Data Usage Analysis Report

This report details how Supabase data is utilized across the `vo-onelink-google` application, analyzes query implementations, and provides SQL commands for verification.

---

### **1. Required Database Tables**

Based on the codebase analysis, the following tables are essential for the application's functionality. Their existence and structure are critical.

| Table | Purpose | Used In |
| :--- | :--- | :--- |
| `auth.users` | Core user authentication. | Implicitly used by all Supabase auth operations. |
| `profiles` | Extends `auth.users` with role, name, avatar, etc. | Sign-in, sign-up, admin checks, onboarding. |
| `products` | Master list of all products from suppliers. | Shop pages, product detail pages, supplier dashboards. |
| `shops` | Defines an influencer's storefront. | Shop pages, product detail pages. |
| `influencer_shop_products` | Links products to an influencer's shop with custom pricing. | Shop pages, product detail pages. |
| `orders` | Records customer purchases. | Checkout, order success, admin console. |
| `commissions` | Tracks earnings for influencers from sales. | Admin console, influencer dashboard (future). |
| `verification_requests` | Manages KYC/KYB submissions. | Onboarding, admin console. |
| `documents` | Stores uploaded KYC/KYB files. | Onboarding, admin console. |

---

### **2. Page-by-Page Data Usage Analysis**

This section breaks down the data requirements and implementation status for each route that interacts with Supabase.

| Route / Component | Tables Queried | Query Correctness | Empty State Handling | Error Handling | Pagination | Analysis & Recommendations |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **/admin/dashboard** | `profiles`, `products`, `orders`, `shops` | ✅ | ✅ (Shows `0`) | ✅ (Uses `Promise.allSettled` to isolate query failures) | ⛔️ | **Good.** Queries are safe and handle individual failures. No pagination is needed for these simple counts. |
| **/admin/login** | `profiles` | ✅ | N/A | ✅ (Redirects with an error query parameter) | N/A | **Good.** Server action correctly queries the `profiles` table to verify the admin role after authentication. |
| **/auth/onboarding** | (Via API) `profiles`, `verification_requests`, `documents` | ✅ | ✅ (Handled by form steps) | ✅ (Uses `try/catch` and toasts for API failures) | N/A | **Good.** The client-side form correctly calls the backend APIs. The APIs themselves are responsible for the actual database interaction. |
| **/dashboard/supplier** | (Via API) `products`, `orders` | ✅ | ✅ (Shows loading skeleton, then error message with retry button) | ✅ (Catches fetch errors and displays a toast and error UI) | ⛔️ | **Good.** This page correctly fetches data from its dedicated API route and handles loading/error states well. Pagination is not implemented for top products/recent orders lists. |
| **/dashboard/supplier/products** | (Via API) `products` | ✅ | ✅ (Data table shows "No results.") | ✅ (Catches fetch errors and displays a toast) | ✅ | **Excellent.** This page correctly fetches data from `/api/products`. The `DataTable` component handles empty states, and the page implements pagination. |
| **/shop** | `products` | ⚠️ | ✅ (Shows a "No products found" message) | ✅ (Catches fetch errors) | ⛔️ | **Caution.** The page fetches **all** products directly from the database on the client-side. This is not scalable. **Recommendation:** Refactor to use the `/api/products` endpoint which supports pagination and filtering. |
| **/shop/[handle]** | (Via API) `shops`, `products`, `influencer_shop_products`, `profiles` | ✅ | ✅ (Handled by `notFound()`) | ✅ (Server-side fetch includes `try/catch` and `notFound()`) | ⛔️ | **Good.** The server component correctly fetches data from its API route. The API route itself joins multiple tables to build the shop view. No pagination is implemented for the product list. |
| **/shop/[handle]/product/[id]** | `shops`, `products`, `influencer_shop_products`, `profiles` | ✅ | ✅ (Handled by `notFound()`) | ✅ (Handles `notFound()` for invalid IDs) | N/A | **Excellent.** This server component performs efficient, properly-typed Supabase queries with joins to gather all necessary data. It's a great example of server-side data fetching. |
| **/test-products** | `products` | ✅ | ✅ (Shows total count) | ✅ (Displays error message) | ⛔️ | **Good for its purpose.** This is a simple test page that correctly queries and displays raw product data. Not for production use. |

---

### **3. SQL Verification Commands**

Run these SQL commands in your Supabase SQL Editor to verify that the required tables exist and to inspect their structure. This helps confirm that the application's queries will match the database schema.

```sql
-- SQL Commands for Table Verification

-- Check for the 'profiles' table and its columns (should extend auth.users)
SELECT id, name, role, avatar_url, verified FROM public.profiles LIMIT 5;

-- Check for the 'products' table
SELECT id, title, price, in_stock, stock_count, category, supplier_id FROM public.products LIMIT 5;

-- Check for the 'shops' table
SELECT id, handle, name, influencer_id FROM public.shops LIMIT 5;

-- Check for the 'influencer_shop_products' join table
SELECT influencer_id, product_id, custom_title, sale_price FROM public.influencer_shop_products LIMIT 5;

-- Check for the 'orders' table
SELECT id, user_id, total, status, created_at FROM public.orders LIMIT 5;

-- Check for the 'commissions' table
SELECT id, order_id, influencer_id, amount, status FROM public.commissions LIMIT 5;

-- Check for the 'verification_requests' table
SELECT id, user_id, status, created_at FROM public.verification_requests LIMIT 5;

-- Check for the 'documents' table (part of verification)
-- Note: This table might just store metadata, with files in Supabase Storage.
SELECT id, request_id, file_path, document_type FROM public.documents LIMIT 5;

-- Verify that RLS (Row Level Security) is enabled on sensitive tables
SELECT relname AS table_name, relrowsecurity AS rls_enabled
FROM pg_class
WHERE relkind = 'r'
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND relname IN ('products', 'profiles', 'orders', 'commissions', 'shops');

```

---

### **4. Summary & Recommendations**

1.  **High-Priority Fix:** The main shop page (`/shop`) fetches all products from the database without pagination. This will cause significant performance issues as the number of products grows. It should be refactored to use a paginated API endpoint, similar to how `/dashboard/supplier/products` is implemented.
2.  **Add Pagination:** The influencer shop page (`/shop/[handle]`) does not paginate its product list. This should be added to handle influencers with many products.
3.  **Connect Mock Data:** The admin console (`/dashboard/admin`) and influencer dashboard (`/dashboard/influencer`) are well-designed but currently use mock data. The next step should be to create and connect them to real API endpoints.
4.  **Schema Verification:** The provided SQL commands should be run to ensure the database schema matches the application's expectations, especially for table and column names (e.g., `price` vs. `basePrice`, `in_stock` vs. `inStock`).
