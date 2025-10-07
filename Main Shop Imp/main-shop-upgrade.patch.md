*** a/app/api/main-shop/feed/route.ts
--- b/app/api/main-shop/feed/route.ts
@@
-    let query = supabase
-      .from("products")
-      .select(
-        "id,title,price,primary_image,active,in_stock,stock_count,category,created_at",
-        { count: "exact" }
-      )
+    let query = supabase
+      .from("products")
+      .select(
+        "id,title,price,primary_image,active,in_stock,stock_count,category,brand,created_at",
+        { count: "exact" }
+      )
       .eq("active", true)
       .gt("stock_count", 0);
@@
-    const items = (data ?? []).map((p) => ({
+    const items = (data ?? []).map((p) => ({
       id: p.id,
       title: p.title,
       price: p.price,
       primary_image: p.primary_image,
       active: p.active,
       in_stock: p.in_stock,
       stock_count: p.stock_count,
       category: p.category,
+      brand: p.brand,
       created_at: p.created_at,
     }));

*** /dev/null
--- b/components/shop/MainShopCard.tsx
@@
+"use client";
+import Image from "next/image";
+import Link from "next/link";
+import type { MainShopProduct } from "@/types/catalog";
+
+const fmt = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" });
+
+export default function MainShopCard({ p }: { p: MainShopProduct }) {
+  return (
+    <Link
+      data-testid="product-card"
+      href={`/product/${p.id}`}
+      className="block rounded-2xl border p-3 hover:shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2"
+      aria-label={`View ${p.title}`}
+    >
+      <div className="aspect-[4/3] relative overflow-hidden rounded-xl">
+        <Image
+          src={p.primary_image || "/images/fallback.jpg"}
+          alt={p.title}
+          fill
+          className="object-cover"
+          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
+        />
+      </div>
+      <div className="mt-3">
+        <h3 className="text-base font-medium line-clamp-2">{p.title}</h3>
+        <div className="mt-1 text-sm opacity-80">{p.brand || p.category || "—"}</div>
+        <div className="mt-2 text-lg font-semibold">{fmt.format(p.price ?? 0)}</div>
+      </div>
+    </Link>
+  );
+}

*** a/app/main-shop/MainShopClient.tsx
--- b/app/main-shop/MainShopClient.tsx
@@
-import type { FeedResponse, MainShopProduct } from "@/types/catalog";
+import type { FeedResponse, MainShopProduct } from "@/types/catalog";
+import MainShopCard from "@/components/shop/MainShopCard";
@@
-      {items.length === 0 ? (
+      {items.length === 0 ? (
         <div data-testid="empty-state" className="rounded-2xl border p-8 text-center">
           No products yet — try clearing filters or adjusting the search.
         </div>
       ) : (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
-          {items.map((p: MainShopProduct) => (
-            <a
-              key={p.id}
-              href={`/product/${p.id}`}
-              className="block rounded-2xl border p-3 hover:shadow-sm transition"
-            >
-              <img
-                src={p.primary_image || "/images/fallback.jpg"}
-                alt={p.title}
-                className="w-full aspect-[4/3] object-cover rounded-xl"
-                loading="lazy"
-              />
-              <div className="mt-3">
-                <h3 className="text-base font-medium line-clamp-2">{p.title}</h3>
-                <div className="mt-1 text-sm opacity-80">{p.brand || p.category || "—"}</div>
-                <div className="mt-2 text-lg font-semibold">${(p.price ?? 0).toFixed(2)}</div>
-              </div>
-            </a>
-          ))}
+          {items.map((p: MainShopProduct) => <MainShopCard key={p.id} p={p} />)}
         </div>
       )}

*** a/components/shop/FilterBar.tsx
--- b/components/shop/FilterBar.tsx
@@
-        <input
+        <label className="sr-only" htmlFor="q">Search products</label>
+        <input
+          id="q"
+          aria-label="Search products"
           placeholder="Search products…"
           value={q}
           onChange={(e) => setQ(e.target.value)}
           className="w-full rounded-xl border px-3 py-2"
         />
-        <select
+        <label className="sr-only" htmlFor="sort">Sort</label>
+        <select
+          id="sort"
+          aria-label="Sort"
           className="rounded-xl border px-3 py-2"
           value={sort}
           onChange={(e) => setSort(e.target.value)}
         >
@@
-        <input className="rounded-xl border px-3 py-2" placeholder="Category" value={category} onChange={(e)=>setCategory(e.target.value)} />
-        <input className="rounded-xl border px-3 py-2" placeholder="Brand" value={brand} onChange={(e)=>setBrand(e.target.value)} />
-        <input className="rounded-xl border px-3 py-2" type="number" placeholder="Min $" value={minPrice} onChange={(e)=>setMinPrice(e.target.value)} />
-        <input className="rounded-xl border px-3 py-2" type="number" placeholder="Max $" value={maxPrice} onChange={(e)=>setMaxPrice(e.target.value)} />
-        <label className="inline-flex items-center gap-2 text-sm">
-          <input type="checkbox" checked={inStockOnly} onChange={(e)=>setInStockOnly(e.target.checked)} />
+        <label className="sr-only" htmlFor="category">Category</label>
+        <input id="category" aria-label="Category" className="rounded-xl border px-3 py-2" placeholder="Category" value={category} onChange={(e)=>setCategory(e.target.value)} />
+        <label className="sr-only" htmlFor="brand">Brand</label>
+        <input id="brand" aria-label="Brand" className="rounded-xl border px-3 py-2" placeholder="Brand" value={brand} onChange={(e)=>setBrand(e.target.value)} />
+        <label className="sr-only" htmlFor="minPrice">Minimum price</label>
+        <input id="minPrice" aria-label="Minimum price" className="rounded-xl border px-3 py-2" type="number" placeholder="Min $" value={minPrice} onChange={(e)=>setMinPrice(e.target.value)} />
+        <label className="sr-only" htmlFor="maxPrice">Maximum price</label>
+        <input id="maxPrice" aria-label="Maximum price" className="rounded-xl border px-3 py-2" type="number" placeholder="Max $" value={maxPrice} onChange={(e)=>setMaxPrice(e.target.value)} />
+        <label className="inline-flex items-center gap-2 text-sm" htmlFor="inStockOnly">
+          <input id="inStockOnly" type="checkbox" checked={inStockOnly} onChange={(e)=>setInStockOnly(e.target.checked)} />
           In stock
         </label>

*** /dev/null
--- b/components/shop/SkeletonGrid.tsx
@@
+export default function SkeletonGrid({ count = 9 }: { count?: number }) {
+  return (
+    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
+      {Array.from({ length: count }).map((_, i) => (
+        <div key={i} className="rounded-2xl border p-3 animate-pulse">
+          <div className="aspect-[4/3] rounded-xl bg-gray-200" />
+          <div className="mt-3 h-4 w-3/4 bg-gray-200 rounded" />
+          <div className="mt-2 h-4 w-1/2 bg-gray-200 rounded" />
+          <div className="mt-2 h-5 w-1/3 bg-gray-200 rounded" />
+        </div>
+      ))}
+    </div>
+  );
+}

*** /dev/null
--- b/app/shop/loading.tsx
@@
+import SkeletonGrid from "@/components/shop/SkeletonGrid";
+
+export default function Loading() {
+  return (
+    <div className="px-4 sm:px-6 lg:px-8">
+      <h1 className="text-2xl font-semibold mb-4">Shop</h1>
+      <SkeletonGrid />
+    </div>
+  );
+}

*** /dev/null
--- b/sql/migrations/2025-10-idx-products.sql
@@
+create index if not exists idx_products_active_instock_stock on public.products(active, in_stock, stock_count);
+create index if not exists idx_products_created_at on public.products(created_at desc);
+create index if not exists idx_products_price on public.products(price);
+create index if not exists idx_products_category on public.products(category);
+create index if not exists idx_products_brand on public.products(brand);
+create extension if not exists pg_trgm;
+create index if not exists idx_products_title_trgm on public.products using gin (title gin_trgm_ops);

*** /dev/null
--- b/tests/smoke/shop-filters-edges.spec.ts
@@
+import { test, expect } from "@playwright/test";
+
+test("filters edge cases", async ({ page }) => {
+  await page.goto("/shop");
+
+  // price range
+  await page.getByLabel("Minimum price").fill("10");
+  await page.getByLabel("Maximum price").fill("200");
+  await page.getByRole("button", { name: "Apply" }).click();
+  await expect(page).toHaveURL(/minPrice=10/);
+  await expect(page).toHaveURL(/maxPrice=200/);
+
+  // category/brand
+  await page.getByLabel("Category").fill("Audio");
+  await page.getByLabel("Brand").fill("Acme");
+  await page.getByRole("button", { name: "Apply" }).click();
+  await expect(page).toHaveURL(/category=Audio/);
+  await expect(page).toHaveURL(/brand=Acme/);
+
+  // in-stock toggle
+  const inStock = page.getByLabel("In stock");
+  await inStock.check();
+  await page.getByRole("button", { name: "Apply" }).click();
+  await expect(page).toHaveURL(/inStockOnly=true/);
+
+  // pagination
+  const nextBtn = page.getByRole("button", { name: "Next" });
+  if (await nextBtn.isEnabled()) {
+    await nextBtn.click();
+    await expect(page).toHaveURL(/page=\d+/);
+    await page.getByRole("button", { name: "Previous" }).click();
+    await expect(page).toHaveURL(/page=1/);
+  }
+});
