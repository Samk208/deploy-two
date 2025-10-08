import MainShopClient from "@/app/main-shop/MainShopClient";
import type { FeedResponse, MainShopProduct } from "@/types/catalog";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const revalidate = 0;

export const metadata = {
  title: "Shop All Products | OneLink",
  description: "Browse our complete catalog of in-stock products.",
  alternates: { canonical: "/shop" },
};

async function fetchFeed(searchParams: Record<string, string | string[] | undefined>): Promise<FeedResponse> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { items: [], page: 1, limit: 24, total: 0, hasMore: false };
  }

  // Parse query params
  const page = Math.max(1, Number(searchParams.page ?? "1"));
  const limit = Math.max(1, Math.min(48, Number(searchParams.limit ?? "24")));
  const q = (typeof searchParams.q === "string" ? searchParams.q : "").trim();
  const sort = (searchParams.sort as string) ?? "new";
  const category = (typeof searchParams.category === "string" ? searchParams.category : "").trim() || undefined;
  const brand = (typeof searchParams.brand === "string" ? searchParams.brand : "").trim() || undefined;
  const minPriceParam = searchParams.minPrice;
  const maxPriceParam = searchParams.maxPrice;
  const minPrice = typeof minPriceParam === "string" && minPriceParam !== "" ? Number(minPriceParam) : undefined;
  const maxPrice = typeof maxPriceParam === "string" && maxPriceParam !== "" ? Number(maxPriceParam) : undefined;
  const inStockOnly = (searchParams.inStockOnly ?? "true") === "true";

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Build query - NOW INCLUDING brand, short_description, primary_image
  let query = supabase
    .from("products")
    .select(
      "id,title,price,images,primary_image,active,in_stock,stock_count,category,brand,short_description,created_at",
      { count: "exact" }
    )
    .eq("active", true)
    .gt("stock_count", 0);

  if (inStockOnly) query = query.eq("in_stock", true);
  if (q) query = query.ilike("title", `%${q}%`);
  if (category) query = query.eq("category", category);
  if (brand) query = query.eq("brand", brand);  // NEW: Brand filtering
  if (typeof minPrice === "number") query = query.gte("price", minPrice);
  if (typeof maxPrice === "number") query = query.lte("price", maxPrice);

  // Sorting
  if (sort === "price-asc") query = query.order("price", { ascending: true });
  else if (sort === "price-desc") query = query.order("price", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  // Pagination with count
  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("[shop/page] error:", error);
    console.error("[shop/page] error details:", JSON.stringify(error, null, 2));
    return { items: [], page: 1, limit: 24, total: 0, hasMore: false };
  }

  const items: MainShopProduct[] = (data ?? []).map((p: any) => ({
    id: p.id,
    title: p.title,
    price: p.price,
    primary_image: p.primary_image ?? p.images?.[0] ?? null,  // Use primary_image first, fallback to images[0]
    active: p.active,
    in_stock: p.in_stock,
    stock_count: p.stock_count,
    category: p.category ?? null,
    brand: p.brand ?? null,  // ✅ Now using real brand data
    short_description: p.short_description ?? null,  // ✅ Now using real description
    created_at: p.created_at,
  }));

  const total = count ?? 0;
  const hasMore = page * limit < total;

  return { items, page, limit, total, hasMore };
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const data = await fetchFeed(sp);
  return <MainShopClient initial={data} />;
}
