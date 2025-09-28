# Database Findings & Key Data Summary

**Date:** September 25, 2025

This document summarizes the key findings, schema discoveries, and important data points uncovered during our diagnostic analysis of the Supabase database.

---

### **1. Key Schema Discoveries**

Our iterative testing revealed the precise relationship structure between key tables:

- **`shops` to `users`:** The `shops` table links to the `auth.users` table via the `influencer_id` column.
  - `JOIN auth.users u ON shops.influencer_id = u.id`

- **`shops` to `profiles`:** The `shops` table links to the `profiles` table via the `influencer_id` on `shops` and the `id` on `profiles`.
  - `JOIN profiles p ON shops.influencer_id = p.id`

- **`influencer_shop_products` (The Join Table):** This table connects products to influencers (and by extension, their shops) using `influencer_id` and `product_id`.
  - `JOIN influencer_shop_products isp ON shops.influencer_id = isp.influencer_id`
  - `JOIN products p ON isp.product_id = p.id`

- **`products` to `suppliers`:** The `products` table links to a supplier (which is a user) via the `supplier_id` column.
  - `JOIN auth.users u ON products.supplier_id = u.id`

---

### **2. Key Data Points & IDs**

These are the specific IDs and handles we identified and used during testing:

- **Sample User ID:** `8be11b62-7de0-4519-a634-f47d461d7103`
- **Sample Product ID:** `723c0f9b-3edc-41ee-8aca-429d384b85dc`

- **List of All Shop Handles:**
  - `main`
  - `example-handle`
  - `influencer-alex`
  - `style-forward` (Used for 404 error testing)
  - `tech-trends`

- **List of All Supplier IDs:**
  - `04801774-40ba-47d8-9b27-858e84aae0f9` (Name: 'Admin User')

---

### **3. Summary of Findings**

- **Row Level Security (RLS) Status:** **HEALTHY**. Our simulation test confirmed that RLS policies are configured correctly and allow authenticated users to read from the `products` table.

- **Data Consistency Status:** **HEALTHY**. The "Checkout Data Consistency Check" returned no rows, confirming that there are no inconsistencies between `in_stock` status and `stock_count`, and no active products have invalid financial data (price or commission).

- **Duplicate Data Status:** **HEALTHY**. The "Consolidated Duplicate Data Check" returned no rows, confirming there are no duplicate product titles, SKUs, or image sets.

- **Identified Data Integrity Issue:** The query to list all shops revealed that most shops have a `null` `influencer_handle`. This indicates that the `influencer_id` in the `shops` table does not have a corresponding entry in the `profiles` table. While not a cause of the critical bugs, this is an issue that should be addressed to ensure all shop owners have a public profile.
