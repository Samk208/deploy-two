import MainShopClient from "@/app/main-shop/MainShopClient";
import type { FeedResponse } from "@/types/catalog";

export const revalidate = 0;

export const metadata = {
  title: "Shop All Products | OneLink",
  description: "Browse our complete catalog of in-stock products.",
  alternates: { canonical: "/shop" },
};

/**
 * Fetch feed from API endpoint instead of direct DB access
 * This ensures we test the actual feed API and maintain consistency
 */
async function fetchFeed(
  searchParams: Record<string, string | string[] | undefined>
): Promise<FeedResponse> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    // Build query string from search params
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
    if (searchParams.brand && typeof searchParams.brand === "string") {
      params.set("brand", searchParams.brand);
    }
    if (searchParams.minPrice && typeof searchParams.minPrice === "string") {
      params.set("minPrice", searchParams.minPrice);
    }
    if (searchParams.maxPrice && typeof searchParams.maxPrice === "string") {
      params.set("maxPrice", searchParams.maxPrice);
    }
    params.set("inStockOnly", String(searchParams.inStockOnly ?? "true"));

    const url = `${base}/api/main-shop/feed?${params.toString()}`;
    const res = await fetch(url, { 
      cache: "no-store",
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    if (!res.ok) {
      console.error("[shop/page] API error:", res.status, res.statusText);
      return { items: [], page: 1, limit: 24, total: 0, hasMore: false };
    }

    const json = await res.json();
    
    if (json.ok && json.data) {
      return json.data;
    }

    console.error("[shop/page] Invalid API response:", json);
    return { items: [], page: 1, limit: 24, total: 0, hasMore: false };
  } catch (err) {
    console.error("[shop/page] fetch error:", err);
    return { items: [], page: 1, limit: 24, total: 0, hasMore: false };
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const data = await fetchFeed(sp);
  return <MainShopClient initial={data} />;
}
