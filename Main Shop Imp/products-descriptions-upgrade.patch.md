*** /dev/null
--- b/sql/migrations/2025-10-products-descriptions.sql
@@
+-- Add short and long descriptions commonly used by ecommerce PDPs and catalog cards
+ALTER TABLE public.products
+  ADD COLUMN IF NOT EXISTS short_description text,
+  ADD COLUMN IF NOT EXISTS description text;

*** a/types/catalog.ts
--- b/types/catalog.ts
@@
 export interface MainShopProduct {
   id: string;
   title: string;
   price: number;
   primary_image: string | null;
   active: boolean;
   in_stock: boolean;
   stock_count: number;
   category?: string | null;
   brand?: string | null;
   created_at: string;
+  /** Short one-liner used on cards and SEO snippets (≈120–160 chars) */
+  short_description?: string | null;
+  /** Full PDP content (plain text for now; can be Markdown later) */
+  description?: string | null;
 }

*** a/app/api/main-shop/feed/route.ts
--- b/app/api/main-shop/feed/route.ts
@@
-    let query = supabase
-      .from("products")
-      .select(
-        "id,title,price,primary_image,active,in_stock,stock_count,category,brand,created_at",
-        { count: "exact" }
-      )
+    let query = supabase
+      .from("products")
+      .select(
+        "id,title,price,primary_image,active,in_stock,stock_count,category,brand,short_description,created_at",
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
       brand: p.brand,
+      short_description: p.short_description ?? null,
       created_at: p.created_at,
     }));

*** a/components/shop/MainShopCard.tsx
--- b/components/shop/MainShopCard.tsx
@@
   return (
     <Link
       data-testid="product-card"
       href={`/product/${p.id}`}
       className="block rounded-2xl border p-3 hover:shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2"
       aria-label={`View ${p.title}`}
     >
       <div className="aspect-[4/3] relative overflow-hidden rounded-xl">
         <Image
           src={p.primary_image || "/images/fallback.jpg"}
           alt={p.title}
           fill
           className="object-cover"
           sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
         />
       </div>
       <div className="mt-3">
         <h3 className="text-base font-medium line-clamp-2">{p.title}</h3>
         <div className="mt-1 text-sm opacity-80">{p.brand || p.category || "—"}</div>
+        {p.short_description ? (
+          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
+            {p.short_description}
+          </p>
+        ) : null}
         <div className="mt-2 text-lg font-semibold">{fmt.format(p.price ?? 0)}</div>
       </div>
     </Link>
   );
 }

*** /dev/null
--- b/components/product/ProductDescription.tsx
@@
+"use client";
+/**
+ * Lightweight renderer for long product description.
+ * Uses plain text with preserved line breaks; swap to Markdown later if needed.
+ */
+export default function ProductDescription({ description }: { description?: string | null }) {
+  if (!description) return null;
+  return (
+    <section className="prose max-w-none mt-6 whitespace-pre-line">
+      {description}
+    </section>
+  );
+}

*** /dev/null
--- b/components/forms/ProductDescriptionsFields.tsx
@@
+"use client";
+import * as React from "react";
+
+type RHFRegister = (name: string) => any;
+type RHFSetValue = (name: string, value: any, opts?: any) => void;
+type RHFWatch = (name: string) => any;
+
+/**
+ * Drop-in form block for supplier product create/edit:
+ * - Works with or without react-hook-form (RHF). If RHF is not used, fallback to controlled props.
+ */
+export default function ProductDescriptionsFields(props: {
+  // RHF hooks (optional)
+  register?: RHFRegister;
+  setValue?: RHFSetValue;
+  watch?: RHFWatch;
+  // Controlled fallbacks (optional)
+  shortValue?: string;
+  longValue?: string;
+  onShortChange?: (v: string) => void;
+  onLongChange?: (v: string) => void;
+}) {
+  const { register, setValue, watch, shortValue, longValue, onShortChange, onLongChange } = props;
+  const shortLen = (watch?.("short_description")?.length ?? shortValue?.length ?? 0) as number;
+
+  return (
+    <div className="flex flex-col gap-6">
+      {/* SHORT DESCRIPTION */}
+      <div className="space-y-2">
+        <label htmlFor="short_description" className="text-sm font-medium">
+          Short Description <span className="opacity-60">(ideal 120–160 chars)</span>
+        </label>
+        <textarea
+          id="short_description"
+          maxLength={160}
+          rows={3}
+          className="w-full rounded-xl border px-3 py-2"
+          placeholder="A concise one-liner used on cards and SEO snippets."
+          {...(register ? register("short_description") : {})}
+          value={register ? undefined : shortValue ?? ""}
+          onChange={(e) => {
+            register ? setValue?.("short_description", e.target.value) : onShortChange?.(e.target.value);
+          }}
+        />
+        <div className="text-xs opacity-70">{shortLen}/160</div>
+      </div>
+
+      {/* LONG DESCRIPTION */}
+      <div className="space-y-2">
+        <label htmlFor="description" className="text-sm font-medium">
+          Long Description <span className="opacity-60">(recommended 300–800 words)</span>
+        </label>
+        <textarea
+          id="description"
+          rows={8}
+          className="w-full rounded-xl border px-3 py-2"
+          placeholder="Features, materials, sizing, care, what's included, warranty, etc."
+          {...(register ? register("description") : {})}
+          value={register ? undefined : longValue ?? ""}
+          onChange={(e) => {
+            register ? setValue?.("description", e.target.value) : onLongChange?.(e.target.value);
+          }}
+        />
+        <div className="text-xs opacity-70">
+          Tip: Use short paragraphs, bullets, and line breaks for readability.
+        </div>
+      </div>
+    </div>
+  );
+}

*** /dev/null
--- b/docs/products-descriptions.md
@@
+# Product Descriptions (Short & Long)
+
+This repo now supports:
+
+- **`products.short_description`** — a 120–160 char one-liner shown on catalog cards and useful for SEO snippets.
+- **`products.description`** — full PDP copy; currently rendered as plain text with preserved line breaks.
+
+## Where used
+
+- **Feed API** (`/api/main-shop/feed`) returns `short_description` in each item.
+- **Cards** (`components/shop/MainShopCard.tsx`) show `short_description` if present.
+- **PDP** can render long text via `components/product/ProductDescription.tsx`.
+- **Supplier Forms** can include both fields via `components/forms/ProductDescriptionsFields.tsx`
+  (works with or without react-hook-form).
+
+## Migrations
+
+Run the SQL in `sql/migrations/2025-10-products-descriptions.sql` (Supabase SQL or your migration runner).
+
+## Wiring PDP
+
+In your product page (e.g., `app/product/[id]/page.tsx`), fetch `description` and render:
+
+```tsx
+import ProductDescription from "@/components/product/ProductDescription";
+// ...
+<ProductDescription description={product.description} />
+```
+
+## Supplier forms
+
+Example (RHF):
+```tsx
+import ProductDescriptionsFields from "@/components/forms/ProductDescriptionsFields";
+// ...
+<ProductDescriptionsFields register={register} setValue={setValue} watch={watch} />
+```
+
+Example (controlled):
+```tsx
+const [shortDesc, setShortDesc] = useState("");
+const [longDesc, setLongDesc] = useState("");
+// ...
+<ProductDescriptionsFields
+  shortValue={shortDesc}
+  longValue={longDesc}
+  onShortChange={setShortDesc}
+  onLongChange={setLongDesc}
+/>
+```
