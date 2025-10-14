import { Skeleton } from "@/components/ui/skeleton";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { InfluencerShopClient } from "./InfluencerShopClient";

// Fetch influencer shop data from the feed API endpoint
async function fetchShopData(
  handle: string,
  searchParams: Record<string, string | string[] | undefined>
) {
  // Build an absolute endpoint for server-side fetch
  let base = process.env.SHOP_SERVICE_URL || process.env.BASE_URL || "";

  if (!base) {
    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host");
    const proto =
      h.get("x-forwarded-proto") ||
      (process.env.NODE_ENV === "production" ? "https" : "http");
    if (host) base = `${proto}://${host}`;
  }

  if (!base) {
    const port = process.env.PORT || "3000";
    base = `http://localhost:${port}`;
  }

  // Build query params for feed endpoint
  const params = new URLSearchParams();
  params.set("page", String(searchParams.page || "1"));
  params.set("limit", String(searchParams.limit || "24"));

  if (searchParams.q && typeof searchParams.q === "string") {
    params.set("q", searchParams.q);
  }
  if (searchParams.sort && typeof searchParams.sort === "string") {
    params.set("sort", searchParams.sort);
  }
  if (searchParams.category && typeof searchParams.category === "string") {
    params.set("category", searchParams.category);
  }
  if (searchParams.minPrice && typeof searchParams.minPrice === "string") {
    params.set("minPrice", searchParams.minPrice);
  }
  if (searchParams.maxPrice && typeof searchParams.maxPrice === "string") {
    params.set("maxPrice", searchParams.maxPrice);
  }
  params.set("inStockOnly", String(searchParams.inStockOnly ?? "true"));

  const endpoint = new URL(
    `/api/influencer/${handle}/feed?${params.toString()}`,
    base
  ).toString();

  let res: Response;
  try {
    res = await fetch(endpoint, {
      cache: "no-store",
    });
  } catch (err) {
    console.error(
      `Failed to fetch shop data for handle="${handle}" from ${endpoint}:`,
      err
    );
    throw err;
  }

  if (!res.ok) {
    console.error(`Feed API returned ${res.status} for handle="${handle}"`);
    return null;
  }

  const json = await res.json();
  if (!json?.ok || !json?.data) {
    console.error("Invalid feed API response:", json);
    return null;
  }

  // Also fetch shop metadata from /api/shop/[handle] for influencer info
  const shopEndpoint = new URL(`/api/shop/${handle}`, base).toString();
  let shopRes: Response | undefined;
  try {
    shopRes = await fetch(shopEndpoint, { cache: "no-store" });
  } catch (err) {
    console.error("Failed to fetch shop metadata:", err);
    // Continue with feed data only
  }

  let influencer = {
    handle,
    name: handle,
    bio: "",
    avatar: "/brand-manager-avatar.png",
    banner: "/fashion-banner.png",
    followers: "0",
    verified: false,
    socialLinks: {},
  };

  if (shopRes && shopRes.ok) {
    const shopJson = await shopRes.json();
    if (shopJson?.ok && shopJson?.data?.influencer) {
      const inf = shopJson.data.influencer;
      influencer = {
        handle: inf.handle || handle,
        name: inf.name || handle,
        bio: inf.bio || "",
        avatar: inf.avatar || "/brand-manager-avatar.png",
        banner: inf.banner || "/fashion-banner.png",
        followers: inf.followers || "0",
        verified: !!inf.verified,
        socialLinks: inf.socialLinks || {},
      };
    }
  }

  // Feed API response structure
  interface FeedItem {
    id: string;
    title: string;
    price?: number | null;
    sale_price?: number | null;
    brand?: string | null;
    images: string[];
    custom_title?: string | null;
    category?: string | null;
    short_description?: string | null;
    in_stock?: boolean | null;
    stock_count?: number | null;
    created_at?: string | null;
  }

  const feedItems = (json.data.items ?? []) as FeedItem[];

  // Map feed items to client component format
  const products = feedItems.map((item) => ({
    id: String(item.id),
    title: item.custom_title || item.title || "Untitled",
    price: item.sale_price ?? item.price ?? 0, // Use sale_price if available
    originalPrice:
      item.sale_price !== null && item.sale_price !== undefined && item.price
        ? item.price
        : undefined,
    image: item.images?.[0] || "/placeholder-product.png",
    images:
      item.images && item.images.length > 0
        ? item.images
        : ["/placeholder-product.png"],
    badges: item.sale_price ? ["Sale"] : [],
    category: item.category || "General",
    region: "Global",
    inStock: item.in_stock ?? true,
    stockCount: item.stock_count ?? 0,
    rating: 4.5,
    reviews: 0,
  }));

  const pagination = {
    page: json.data.page ?? 1,
    limit: json.data.limit ?? 24,
    total: json.data.total ?? 0,
    hasMore: json.data.hasMore ?? false,
  };

  return { influencer, products, pagination };
}

function InfluencerShopSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="relative">
        <Skeleton className="h-64 w-full" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="container mx-auto">
            <div className="flex items-end gap-4">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <Skeleton className="h-48 w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function InfluencerShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { handle } = await params;
  const sp = (await searchParams) ?? {};

  const data = await fetchShopData(handle, sp);
  if (!data) return notFound();

  return (
    <Suspense fallback={<InfluencerShopSkeleton />}>
      <InfluencerShopClient
        influencer={data.influencer}
        products={data.products}
        handle={handle}
        pagination={data.pagination}
      />
    </Suspense>
  );
}
