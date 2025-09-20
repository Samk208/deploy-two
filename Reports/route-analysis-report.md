# Codebase Route Analysis Report

This report provides a comprehensive analysis of the Next.js routes in the `vo-onelink-google` project, based on the build output and direct code examination.

### Methodology

To generate this report, the following actions were performed:
1.  **File Inventory:** Scanned the entire `app/` directory to locate all page components (`page.tsx`), API routes (`route.ts`), and loading/error boundary files (`loading.tsx`, `error.tsx`).
2.  **Code Analysis:** Read the content of each page component to understand its functionality, data dependencies, and UI structure.
3.  **Data Dependency Mapping:** Searched for Supabase client initializations (`createServerSupabaseClient`, `createClientSupabaseClient`) and direct API calls (`fetch`) to determine which routes require database interaction.
4.  **Navigation Analysis:** Scanned for usages of Next.js `<Link>` components and `href` attributes to map out how pages are connected through the UI.
5.  **State Handling:** Checked for the existence of `loading.tsx` files to confirm loading state handling and noted where skeleton loaders or other loading indicators are used. No `error.tsx` files were found, indicating that error handling relies on component-level logic or Next.js defaults.

---

## Route Analysis Report

### **STATIC ROUTES (○)**

These routes are pre-rendered at build time and do not require server-side computation for each request. They are generally fast but may fetch client-side data.

#### **Marketing & Informational Pages**

| Route | Renders? | Supabase Data? | Duplicates? | In Nav? | Loading/Error States? | Analysis |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`/`** (Home) | ✅ | No | No | ✅ | N/A | **Exists & Renders.** This is the main landing page. It's fully static and links to `/sign-up`, `/demo`, `/influencers`, `/brands`, and `/shop`. No Supabase data is fetched. |
| **`/brands`** | ✅ | No | No | ✅ | N/A | **Exists & Renders.** A static marketing page targeted at suppliers, explaining the benefits of the platform. It links to `/sign-up` and `/demo`. |
| **`/influencers`** | ✅ | No | No | ✅ | N/A | **Exists & Renders.** A static marketing page for influencers, detailing how they can earn money. It links to `/sign-up` and `/demo`. |
| **`/privacy`** | ✅ | No | No | ✅ | N/A | **Exists & Renders.** A static page displaying the privacy policy. It contains placeholder text. |
| **`/terms`** | ✅ | No | No | ✅ | N/A | **Exists & Renders.** A static page for terms of service. It contains placeholder text. |

#### **Authentication & Onboarding**

| Route | Renders? | Supabase Data? | Duplicates? | In Nav? | Loading/Error States? | Analysis |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`/auth/onboarding`** | ✅ | Yes (Client) | Yes | ✅ | ✅ | **Exists & Renders.** A multi-step onboarding form for new influencers and brands. It uses client-side `fetch` to communicate with `/api/onboarding/*` endpoints and saves progress to `localStorage`. A `loading.tsx` file exists. **Functionality is duplicated** by `/demo/onboarding`. |
| **`/demo/onboarding`** | ✅ | No | Yes | ✅ | ✅ | **Exists & Renders.** A demo version of the onboarding flow that does not save data to the backend. It reuses the same components as the real onboarding page. This is a functional duplicate of `/auth/onboarding`. |
| **`/(auth)/reset`** | ✅ | Yes (Client) | No | ✅ | ✅ | **Exists & Renders.** The "Forgot Password" page. It uses the Supabase client SDK to trigger a password reset email. It handles its own loading and success states. |
| **`/(auth)/sign-in`** | ✅ | Yes (Client) | No | ✅ | ✅ | **Exists & Renders.** The main sign-in page for all user roles. It communicates with `/api/auth/sign-in` and redirects users based on their role. |
| **`/(auth)/sign-up`** | ✅ | Yes (Client) | No | ✅ | ✅ | **Exists & Renders.** The main sign-up page. It features an enhanced role selection UI and posts data to `/api/auth/sign-up`. It correctly redirects influencers and suppliers to the onboarding flow. |
| **`/(auth)/update-password`**| ✅ | Yes (Client) | No | No | ✅ | **Exists & Renders.** The page where users can set a new password after following a reset link. It uses the Supabase client SDK to update the user's password. |

#### **Core Application Pages**

| Route | Renders? | Supabase Data? | Duplicates? | In Nav? | Loading/Error States? | Analysis |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`/admin/dashboard`** | ✅ | Yes (Server) | Yes | ⛔️ | ✅ | **Exists & Renders.** A server component that fetches admin stats directly from Supabase. **This appears to be a legacy or duplicate admin dashboard.** The primary, more feature-rich admin dashboard is at `/dashboard/admin`. It is not linked from the main navigation. |
| **`/dashboard/admin`** | ✅ | No (Client) | Yes | ✅ | ✅ | **Exists & Renders.** A comprehensive, client-rendered admin console with mock data. It features tabs for verifications, orders, commissions, and disputes. **This is a functional duplicate of `/admin/dashboard`** but is more advanced. |
| **`/dashboard/influencer`** | ✅ | No (Client) | No | ✅ | ✅ | **Exists & Renders.** A static dashboard page for influencers, displaying mock data for stats and quick actions. It links to the shop builder (`/dashboard/influencer/shop`). |
| **`/dashboard/influencer/shop`**| ✅ | Yes (Client) | No | ✅ | ✅ | **Exists & Renders.** The shop builder UI for influencers. It fetches available products and shop products from `/api/influencer/shop` and allows for creating, updating, and deleting product links. |
| **`/dashboard/supplier`** | ✅ | Yes (Client) | No | ✅ | ✅ | **Exists & Renders.** The main dashboard for suppliers. It fetches statistics from the `/api/dashboard/supplier` endpoint and displays KPIs, top products, and recent orders. |
| **`/dashboard/supplier/products`**| ✅ | Yes (Client) | No | ✅ | ✅ | **Exists & Renders.** A page for suppliers to view their products in a data table. It fetches data from `/api/products` and includes functionality for import/export. |
| **`/dashboard/supplier/products/new`**| ✅ | No (Client) | No | ✅ | ✅ | **Exists & Renders.** A client-side form for creating a new product. It does not appear to post data to any API endpoint yet and uses mock API calls. |
| **`/cart`** | ✅ | No (Client) | No | ✅ | ✅ | **Exists & Renders.** The shopping cart page. It uses a client-side state management solution (`useCartStore`) to display cart items. It does not fetch data from Supabase. |
| **`/checkout`** | ✅ | No (Client) | No | ✅ | ✅ | **Exists & Renders.** The checkout page, which dynamically loads the `CheckoutPageComponent`. It is set to `ssr: false`, ensuring it only renders on the client. |
| **`/order/success`** | ✅ | No (Client) | No | No | ✅ | **Exists & Renders.** A confirmation page shown after a successful order. It currently displays mock order data. It is not directly linked in the navigation. |
| **`/shop`** | ✅ | Yes (Client) | No | ✅ | ✅ | **Exists & Renders.** The main shopping page for customers. It fetches all products directly from the `products` table in Supabase for demonstration purposes and includes advanced client-side filtering. |
| **`/shops`** | ✅ | No (Client) | No | ✅ | ✅ | **Exists & Renders.** A page for browsing different influencer shops. It uses mock data to display a list of shops with filtering and sorting capabilities. |
| **`/test-products`** | ✅ | Yes (Client) | No | ⛔️ | ✅ | **Exists & Renders.** A development/test page that directly fetches and displays raw data from the `products` table in Supabase. It is not part of the main application flow. |

---

### **DYNAMIC ROUTES (ƒ)**

These routes are rendered on the server for each request, allowing them to display dynamic data that may change frequently.

| Route | Renders? | Supabase Data? | Duplicates? | In Nav? | Loading/Error States? | Analysis |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`/admin/login`** | ✅ | Yes (Server) | No | ⛔️ | ✅ | **Exists & Renders.** A server-side form for admin login. It posts credentials to a server action, validates the user's role against the `profiles` table, and redirects to `/admin/dashboard` on success. |
| **`/dashboard/supplier/products/[id]`**| ✅ | No (Server) | No | ✅ | ✅ | **Exists & Renders.** The "Edit Product" page. It's a server component that currently uses mock product data but is structured to fetch real data based on the product `id`. |
| **`/shop/[handle]`** | ✅ | Yes (Server) | No | ✅ | ✅ | **Exists & Renders.** An individual influencer's shop page. It fetches shop and product data from `/api/shop/[handle]` on the server before rendering. It gracefully handles `notFound()` if the handle is invalid. |
| **`/shop/[handle]/product/[id]`**| ✅ | Yes (Server) | No | ✅ | ✅ | **Exists & Renders.** The product detail page. It performs a multi-step Supabase query on the server to fetch product, shop, and influencer details, ensuring data consistency. It also dynamically generates metadata for SEO. |

---

### **Summary & Key Observations**

1.  **Duplicate Admin Dashboards:** There are two admin dashboards: `/admin/dashboard` (server-rendered, basic) and `/dashboard/admin` (client-rendered, advanced, mock data). The functionality overlaps, and a decision should be made to consolidate them.
2.  **Mock Data vs. Real Data:** Several key pages, including the admin console (`/dashboard/admin`), influencer dashboard (`/dashboard/influencer`), and order success page (`/order/success`), are still using mock data. These will need to be connected to live API endpoints.
3.  **Onboarding Duplication:** The `/auth/onboarding` and `/demo/onboarding` routes are nearly identical. While useful for demonstration, the demo version could be removed or conditionally rendered to reduce code duplication.
4.  **Error Handling:** No root `error.tsx` files were found. While some pages use component-level error states (e.g., displaying an alert), implementing `error.tsx` files would provide more robust, application-wide error boundaries.
5.  **Supabase Usage:** The project effectively uses a mix of server-side Supabase queries (for dynamic pages like product details) and client-side API calls (for interactive dashboards), which is a good pattern. The `/shop` page fetches all products directly, which should be reviewed for performance as the product catalog grows.
6.  **Build Warnings:** The `next build` command produced warnings related to the use of Node.js APIs (`process.versions`) in `@supabase/realtime-js`, which is not supported in the Edge Runtime. This is triggered by an import chain starting in `lib/supabase/server.ts`. While the build succeeds, this indicates that any routes or middleware using this code may not be compatible with the Edge Runtime.
