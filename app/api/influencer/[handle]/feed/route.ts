import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type FeedItem = {
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
};

type FeedResponse =
  | { ok: true; data: { items: FeedItem[]; page: number; limit: number; total: number; hasMore: boolean } }
  | { ok: false; error: string };

type Sort = "new" | "price-asc" | "price-desc";

/**
 * GET /api/influencer/[handle]/feed
 * Reads curated products via influencer_shop_products join table and merges overrides.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ handle: string }> }
) {
  try {
    const params = await ctx.params;

    const handle = (params?.handle ?? "").trim();
    if (!handle) {
      return NextResponse.json<FeedResponse>({ ok: false, error: "Missing handle" }, { status: 400 });
    }

    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const limit = Math.max(1, Math.min(48, Number(url.searchParams.get("limit") ?? "24")));
    const q = (url.searchParams.get("q") ?? "").trim();
    const sort = (url.searchParams.get("sort") ?? "new") as Sort;
    const category = (url.searchParams.get("category") ?? "").trim() || undefined;
    const minPriceParam = url.searchParams.get("minPrice");
    const maxPriceParam = url.searchParams.get("maxPrice");
    const minPrice = minPriceParam ? Number(minPriceParam) : undefined;
    const maxPrice = maxPriceParam ? Number(maxPriceParam) : undefined;
    const inStockOnly = (url.searchParams.get("inStockOnly") ?? "true") === "true";

    const supabase = getSupabaseAdmin?.();
    if (!supabase) {
      return NextResponse.json<FeedResponse>(
        { ok: false, error: "Supabase admin client unavailable" },
        { status: 500 }
      );
    }

    // 1) Resolve shop by handle → get influencer_id
    const { data: shop, error: shopErr } = await supabase
      .from("shops")
      .select("id, handle, influencer_id, active")
      .eq("handle", handle)
      .maybeSingle();

    if (shopErr) {
      console.error("Shop lookup error:", shopErr);
    }
    if (!shop || shop.active === false) {
      return NextResponse.json<FeedResponse>(
        { ok: true, data: { items: [], page, limit, total: 0, hasMore: false } },
        { status: 200 }
      );
    }

    // 2) Curated rows for this influencer (published + ordered)
    const { data: curated, error: curErr } = await supabase
      .from("influencer_shop_products")
      .select("product_id, display_order, sale_price, custom_title, published")
      .eq("influencer_id", shop.influencer_id)
      .eq("published", true)
      .order("display_order", { ascending: true, nullsFirst: true });

    if (curErr) {
      console.error("Curated list error:", curErr);
      return NextResponse.json<FeedResponse>({ ok: false, error: "Failed to fetch curated products" }, { status: 500 });
    }
    if (!curated || curated.length === 0) {
      return NextResponse.json<FeedResponse>(
        { ok: true, data: { items: [], page, limit, total: 0, hasMore: false } },
        { status: 200 }
      );
    }

    const curatedOrder = curated.map((c) => c.product_id).filter(Boolean) as string[];
    if (curatedOrder.length === 0) {
      return NextResponse.json<FeedResponse>(
        { ok: true, data: { items: [], page, limit, total: 0, hasMore: false } },
        { status: 200 }
      );
    }

    // 3) Fetch product details; apply filters
    let query = supabase
      .from("products")
      .select(
        "id, title, price, images, brand, category, short_description, in_stock, stock_count, active, created_at"
      )
      .in("id", curatedOrder)
      .eq("active", true);

    if (inStockOnly) query = query.eq("in_stock", true).gt("stock_count", 0);
    if (q) query = query.ilike("title", `%${q}%`);
    if (category) query = query.eq("category", category);
    if (typeof minPrice === "number") query = query.gte("price", minPrice);
    if (typeof maxPrice === "number") query = query.lte("price", maxPrice);

    if (sort === "price-asc") query = query.order("price", { ascending: true });
    else if (sort === "price-desc") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const { data: products, error: prodErr } = await query;
    if (prodErr) {
      console.error("Products fetch error:", prodErr);
      return NextResponse.json<FeedResponse>({ ok: false, error: "Failed to fetch products" }, { status: 500 });
    }

    const productById = new Map<string, any>((products ?? []).map((p) => [String(p.id), p]));
    const overrideById = new Map<string, { sale_price?: number | null; custom_title?: string | null }>();
    for (const c of curated) {
      overrideById.set(String(c.product_id), {
        sale_price: c.sale_price ?? null,
        custom_title: c.custom_title ?? null,
      });
    }

    const ordered = curatedOrder
      .map((id) => {
        const p = productById.get(id);
        if (!p) return null;
        const o = overrideById.get(id);
        const item: FeedItem = {
          id: p.id,
          title: o?.custom_title ?? p.title,
          price: p.price ?? null,
          sale_price: o?.sale_price ?? null,
          brand: p.brand ?? null,
          images: Array.isArray(p.images) ? p.images : p.images ? [p.images] : [],
          category: p.category ?? null,
          short_description: p.short_description ?? null,
          in_stock: p.in_stock ?? null,
          stock_count: p.stock_count ?? null,
          created_at: p.created_at ?? null,
        };
        return item;
      })
      .filter(Boolean) as FeedItem[];

    const total = ordered.length;
    const from = (page - 1) * limit;
    const to = Math.min(from + limit, total);
    const items = ordered.slice(from, to);
    const hasMore = to < total;

    return NextResponse.json<FeedResponse>(
      { ok: true, data: { items, page, limit, total, hasMore } },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("[api/influencer/[handle]/feed] error:", e?.message || e);
    return NextResponse.json<FeedResponse>({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}
