import { permanentRedirect } from "next/navigation";

export const revalidate = 0;

export interface MainShopProduct {
  id: string;
  title: string | null;
  price: number | null;
  primary_image: string | null;
  active: boolean | null;
  in_stock: boolean | null;
  stock_count: number | null;
  created_at: string | null;
}

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string };

export const metadata = {
  title: "Shop All Products | OneLink",
  description: "Browse our complete catalog of in-stock products.",
};

async function getFeed(page = 1) {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = `${base}/api/main-shop/feed?page=${page}&limit=48`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [] as MainShopProduct[];
    const json = (await res.json()) as ApiResponse<{ items: MainShopProduct[] }>;
    if (json && (json as any).ok === true) {
      return (json as { ok: true; data: { items: MainShopProduct[] } }).data.items ?? [];
    }
    return [] as MainShopProduct[];
  } catch (err) {
    console.error("[main-shop] feed error:", err);
    return [] as MainShopProduct[];
  }
}

export default async function MainShopPage() {
  permanentRedirect("/shop");
}
