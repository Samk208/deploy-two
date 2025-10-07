import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { Metadata } from "next";

async function getProduct(id: string) {
  try {
    const res = await fetch(`/api/products/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return (json && json.ok) ? json.data : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = await getProduct(id).catch(() => null);
  const title = p?.title ? `${p.title} | OneLink` : `Product | ${id} | OneLink`;
  const desc = p?.title ? `Buy ${p.title} on OneLink.` : "View product details.";
  const image = p?.primary_image ?? "/images/fallback.jpg";
  const url = `${process.env.NEXT_PUBLIC_APP_URL || ""}/product/${id}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p?.title ?? "Product",
    image,
    brand: p?.brand ?? undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: p?.price ?? undefined,
      availability: p?.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url,
    },
  } as const;

  return {
    title,
    description: desc,
    openGraph: { title, description: desc, images: [image], url },
    twitter: { card: "summary_large_image", title, description: desc, images: [image] },
    other: { "script:ld+json": JSON.stringify(jsonLd) },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = getSupabaseAdmin();
  if (!admin) return <div className="p-6">Server not configured.</div>;

  const { data, error } = await admin
    .from("products")
    .select("id, title, price, primary_image, images, description, in_stock, stock_count, active, created_at")
    .eq("id", id)
    .single();

  if (error || !data) return <div className="p-6">Product not found.</div>;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 grid gap-8 lg:grid-cols-2">
      <div>
        {data.primary_image ? (
          <img src={data.primary_image} alt={data.title ?? "Product"} className="w-full rounded-2xl object-cover" />
        ) : (
          <div className="aspect-square w-full rounded-2xl bg-neutral-200" />
        )}
      </div>
      <div>
        <h1 className="text-2xl font-semibold">{data.title ?? "Untitled"}</h1>
        <div className="mt-2 text-lg opacity-80">{data.price != null ? `$${Number(data.price).toFixed(2)}` : "—"}</div>
        <div className="mt-4 opacity-70">
          {data.description ?? "No description."}
        </div>
        <div className="mt-4 text-sm">
          {data.in_stock && (data.stock_count ?? 0) > 0 ? "In Stock" : "Out of Stock"}
        </div>
      </div>
    </div>
  );
}
