import ProductImageGallery from "@/components/product/ProductImageGallery";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const admin = getSupabaseAdmin();

  if (!admin) {
    return {
      title: `Product | ${id} | OneLink`,
      description: "View product details.",
    };
  }

  const { data: p } = await admin
    .from("products")
    .select(
      "id, title, price, primary_image, brand, short_description, description"
    )
    .eq("id", id)
    .single();

  const title = p?.title ? `${p.title} | OneLink` : `Product | ${id} | OneLink`;
  const desc =
    p?.short_description ||
    p?.description?.slice(0, 160) ||
    `Buy ${p?.title || "product"} on OneLink.`;
  const image = p?.primary_image ?? "/images/fallback.jpg";
  const url = `${process.env.NEXT_PUBLIC_APP_URL || ""}/product/${id}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p?.title ?? "Product",
    description: desc,
    image,
    brand: p?.brand ? { "@type": "Brand", name: p.brand } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: p?.price ?? undefined,
      url,
    },
  } as const;

  return {
    title,
    description: desc,
    openGraph: { title, description: desc, images: [image], url },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [image],
    },
    other: { "script:ld+json": JSON.stringify(jsonLd) },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = getSupabaseAdmin();
  if (!admin) return <div className="p-6">Server not configured.</div>;

  const { data, error } = await admin
    .from("products")
    .select(
      "id, title, price, primary_image, images, description, short_description, brand, category, in_stock, stock_count, active, created_at"
    )
    .eq("id", id)
    .single();

  if (error || !data) return <div className="p-6">Product not found.</div>;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 grid gap-8 lg:grid-cols-2">
      {/* Image Gallery Section */}
      <div className="space-y-4">
        <ProductImageGallery
          images={data.images || []}
          title={data.title ?? "Product"}
          primaryImage={data.primary_image}
        />
      </div>

      {/* Product Info Section */}
      <div className="flex flex-col">
        {/* Title & Brand */}
        <div>
          <h1 className="text-3xl font-bold">{data.title ?? "Untitled"}</h1>
          {data.brand && (
            <p className="mt-1 text-sm text-muted-foreground">
              by {data.brand}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="mt-4">
          <p className="text-2xl font-semibold">
            {data.price != null
              ? `$${Number(data.price).toFixed(2)}`
              : "Price not available"}
          </p>
        </div>

        {/* Short Description */}
        {data.short_description && (
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            {data.short_description}
          </p>
        )}

        {/* Stock Status */}
        <div className="mt-6">
          {data.in_stock && (data.stock_count ?? 0) > 0 ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700">
              <span className="h-2 w-2 rounded-full bg-green-600"></span>
              In Stock ({data.stock_count} available)
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700">
              <span className="h-2 w-2 rounded-full bg-red-600"></span>
              Out of Stock
            </div>
          )}
        </div>

        {/* Full Description */}
        {data.description && (
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-lg font-semibold mb-3">Product Details</h2>
            <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
              {data.description}
            </div>
          </div>
        )}

        {/* Category */}
        {data.category && (
          <div className="mt-6 text-sm text-muted-foreground">
            Category: <span className="font-medium">{data.category}</span>
          </div>
        )}
      </div>
    </div>
  );
}
