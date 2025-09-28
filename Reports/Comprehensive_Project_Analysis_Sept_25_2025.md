# Comprehensive Project Analysis - September 25, 2025

This document provides a detailed analysis of the `vo-onelink-google` project, covering its technology stack, database schema, image handling system, and file structure.

---

## 1. Tech Stack Inventory

The project is built on a modern, robust, and type-safe technology stack.

- **Core Framework:**
  - **Next.js:** `15.2.4` (utilizing the App Router)
  - **React:** `18.3.1`

- **Backend & Database:**
  - **Supabase:** Serves as the primary backend, providing database, authentication, and storage services. The project interacts with it directly via the `supabase-js` client library.
  - **ORM:** No traditional ORM (like Prisma or Drizzle) is used. Data access is managed through Supabase's client library and custom SQL functions.

- **Authentication:**
  - **Supabase Auth:** The project uses Supabase's built-in authentication for user management, leveraging JWTs for session handling.

- **UI & Styling:**
  - **UI Components:** **shadcn/ui** is used for the component library, built upon Radix UI primitives.
  - **Styling:** **Tailwind CSS** (`4.1.9`) is the utility-first CSS framework, configured with PostCSS.
  - **Icons:** `lucide-react` provides the icon set.

- **State Management:**
  - **Zustand:** A lightweight, hook-based state management library for managing global client-side state.

- **Form Handling & Validation:**
  - **React Hook Form:** For managing form state and submissions.
  - **Zod:** For type-safe schema definition and validation, integrated with React Hook Form.

- **Testing:**
  - **End-to-End (E2E):** **Playwright** is configured for comprehensive E2E testing.
  - **API Testing:** A multi-faceted API testing suite is in place, using **Newman** (Postman collections), **Artillery** (performance/load testing), and **Swagger CLI** (contract validation).

---

## 2. Database Schema Overview

The database is hosted on Supabase and is designed around a core e-commerce and influencer marketing model. The schema is managed via SQL migration files.

**Key Entities & Tables:**

- **`auth.users`**: Supabase's built-in table for user authentication data (email, password hash, etc.).
- **`profiles`**: A public table that extends `auth.users` with application-specific data like `name`, `role` ('influencer', 'supplier'), and `avatar_url`.
- **`products`**: The central table for all product information, including `title`, `description`, `price`, `images` (as a `TEXT[]` array of URLs), `category`, `stock_count`, and `supplier_id`.
- **`shops`**: Defines an influencer's personal storefront, containing `shop_name`, `shop_subdomain`, and an `owner_id` linking to an influencer's user ID.
- **`influencer_shop_products`**: A junction table that creates a many-to-many relationship between `shops` and `products`, allowing influencers to curate products for their shop.
- **`orders` & `commissions`**: Tables to manage customer purchases and track commissions owed to influencers for sales generated through their shops.

**Relationships & Connections:**

- The connection between an influencer and their shop is a direct link: `shops.owner_id` -> `auth.users.id`.
- An influencer curates their shop by adding entries to the `influencer_shop_products` table, which links their `shop_id` to a `product_id` from the main catalog.

---

## 3. Image Handling System

The project employs a highly efficient and secure system for managing images, leveraging both Supabase Storage and Next.js's built-in image optimization.

- **Storage Backend:**
  - All images are uploaded to **Supabase Storage**.
  - The storage is organized into logical buckets: `product-images` (public), `brand-logos` (public), `verification-documents` (private), and `digital-assets` (private).

- **URL Generation & Storage:**
  - The `uploadProductImage` function in `lib/storage.ts` uploads a file to the `product-images` bucket.
  - It then generates a permanent public URL using `getPublicUrl()`.
  - This public URL string is what is stored in the `products.images` array in the database.

- **Display & Optimization:**
  - The Next.js `<Image>` component is used to display images.
  - The `next.config.mjs` file is configured with `remotePatterns` that whitelist the Supabase Storage domain. This allows Next.js to:
    1.  Download the original image from Supabase at build-time or on-demand.
    2.  Automatically convert it to modern, optimized formats like **WebP** and **AVIF**.
    3.  Resize the image to appropriate dimensions for different devices.
    4.  Serve the optimized image from its own cache with aggressive caching headers, ensuring fast load times.

- **Security:**
  - Sensitive files (like KYC documents) are stored in private buckets. Access is granted only via temporary, secure **signed URLs**, which is a best practice for protecting private data.

---

## 4. Current File Structure

The project follows a well-organized structure based on Next.js App Router conventions and feature-based organization.

- **`app/`**: The core of the application, containing all pages and API routes.
  - `api/`: Location for all backend API endpoints (e.g., `app/api/products`).
  - `dashboard/`: Contains the protected routes for user-specific dashboards.
  - `shop/[handle]/`: Dynamic routes for displaying individual influencer shops.
  - `(auth)/`: A route group for authentication pages (login, sign-up, etc.) that share a common layout.
  - `layout.tsx`: The root layout for the entire application.
  - `page.tsx`: The homepage of the application.

- **`components/`**: Contains all reusable React components.
  - `ui/`: The unmodified, auto-generated components from the `shadcn/ui` library.
  - `shop/`, `dashboard/`, `admin/`: Feature-specific components used within those sections of the app.
  - `layout/`: High-level layout components like the main header, footer, and navigation.

- **`lib/`**: A folder for shared utilities, helper functions, and core logic.
  - `supabase/`: Contains the Supabase client initialization and generated TypeScript types for the database.
  - `storage.ts`: The central module for all file upload and storage-related logic.
  - `validators.ts`: Contains all Zod validation schemas used across the application.
  - `auth-helpers.ts`: Utility functions related to user authentication and session management.

- **Configuration Files:**
  - `next.config.mjs`: Main configuration for Next.js, including the crucial `images.remotePatterns` for image optimization.
  - `tailwind.config.ts` (inferred): Configuration for Tailwind CSS.
  - `tsconfig.json`: TypeScript compiler options.
  - `pnpm-lock.yaml`: Defines the exact versions of all project dependencies.
