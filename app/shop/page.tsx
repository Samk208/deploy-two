import MainShopClient from "@/app/main-shop/MainShopClient";
import type { FeedResponse } from "@/types/catalog";

export const revalidate = 0;

export const metadata = {
  title: "Shop All Products | OneLink",
  description: "Browse our complete catalog of in-stock products.",
  alternates: { canonical: "/shop" },
};

async function fetchFeed(searchParams: Record<string, string | string[] | undefined>): Promise<FeedResponse> {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === "string") usp.set(k, v);
  }
  const res = await fetch(`/api/main-shop/feed?${usp.toString()}`, { cache: "no-store" });
  const json = await res.json();
  return json?.data ?? { items: [], page: 1, limit: 24, total: 0, hasMore: false };
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const data = await fetchFeed(sp);
  return <MainShopClient initial={data} />;
}
