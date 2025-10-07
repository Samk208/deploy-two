import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Sort = "new" | "price-asc" | "price-desc";

// Helper to build the base filtered query to avoid duplication
function buildBaseQuery(supabase: ReturnType<typeof getSupabaseAdmin>, opts: {
  q: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly: boolean;
}) {
  if (!supabase) throw new Error("Missing Supabase env");

  let query = supabase
    .from("products")
    .select(
      "id,title,price,primary_image,active,in_stock,stock_count,category,brand,short_description,created_at",
      { count: "exact" }
    )
    .eq("active", true)
    .gt("stock_count", 0);

  if (opts.inStockOnly) query = query.eq("in_stock", true);
  if (opts.q) query = query.ilike("title", `%${opts.q}%`);
  if (opts.category) query = query.eq("category", opts.category);
  if (typeof opts.minPrice === "number") query = query.gte("price", opts.minPrice);
  if (typeof opts.maxPrice === "number") query = query.lte("price", opts.maxPrice);

  return query;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const limit = Math.max(1, Math.min(48, Number(url.searchParams.get("limit") ?? "24")));
    const q = (url.searchParams.get("q") ?? "").trim();
    const sort = (url.searchParams.get("sort") ?? "new") as Sort;
    const category = (url.searchParams.get("category") ?? "").trim() || undefined;
    const minPriceParam = url.searchParams.get("minPrice");
    const maxPriceParam = url.searchParams.get("maxPrice");
    const minPrice = minPriceParam !== null && minPriceParam !== "" ? Number(minPriceParam) : undefined;
    const maxPrice = maxPriceParam !== null && maxPriceParam !== "" ? Number(maxPriceParam) : undefined;
    const inStockOnly = (url.searchParams.get("inStockOnly") ?? "true") === "true";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = getSupabaseAdmin();

    // Build base where clause
    let query = buildBaseQuery(supabase, {
      q,
      category,
      minPrice,
      maxPrice,
      inStockOnly,
    });

    // Sorting
    if (sort === "price-asc") query = query.order("price", { ascending: true });
    else if (sort === "price-desc") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    // Pagination with count
    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    const items = (data ?? []).map((p: any) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      primary_image: p.primary_image,
      active: p.active,
      in_stock: p.in_stock,
      stock_count: p.stock_count,
      category: p.category,
      brand: p.brand,
      short_description: p.short_description ?? null,
      created_at: p.created_at,
    }));

    const total = count ?? 0;
    const hasMore = page * limit < total;

    return NextResponse.json({ ok: true, data: { items, page, limit, total, hasMore } }, { status: 200 });
  } catch (e) {
    console.error("[api/main-shop/feed] error:", e);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}
