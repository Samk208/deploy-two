import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { FeedResponse, ShopFeedItem } from "@/types/domain";

export const dynamic = "force-dynamic";

type Sort = "new" | "price-asc" | "price-desc";

/**
 * GET /api/influencer/[handle]/feed
 *
 * Returns curated products for a specific influencer's shop.
 * Uses same ShopFeedItem format as main shop feed for consistency.
 *
 * Query params:
 * - page: number (default 1)
 * - limit: number (default 24, max 48)
 * - q: search query
 * - sort: "new" | "price-asc" | "price-desc"
 * - category: filter by category
 * - minPrice, maxPrice: price range
 * - inStockOnly: boolean (default true)
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;
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

    const supabase = getSupabaseAdmin();

    // 1. Fetch influencer's shop by handle
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("id, influencer_id, products, active")
      .eq("handle", handle)
      .eq("active", true)
      .maybeSingle();

    if (shopError || !shop) {
      return NextResponse.json(
        { ok: false, error: "Shop not found or inactive" },
        { status: 404 }
      );
    }

    // 2. Extract product IDs and customizations from shop.products
    type ProductOverride = {
      product_id: string;
      custom_title?: string;
      sale_price?: number;
      published?: boolean;
    };

    let productIds: string[] = [];
    const customizationsMap = new Map<string, ProductOverride>();

    if (shop.products && Array.isArray(shop.products)) {
      const first = shop.products[0];
      if (typeof first === "string") {
        // Simple string array
        productIds = shop.products as string[];
      } else if (first && typeof first === "object") {
        // Array of customization objects
        const arr = shop.products as ProductOverride[];
        for (const item of arr) {
          // Only include published products (default to true if not specified)
          if (item.published !== false) {
            productIds.push(item.product_id);
            customizationsMap.set(item.product_id, item);
          }
        }
      }
    }

    if (productIds.length === 0) {
      // Empty shop
      return NextResponse.json({
        ok: true,
        data: { items: [], page, limit, total: 0, hasMore: false },
      });
    }

    // 3. Build product query with filters
    let query = supabase
      .from("products")
      .select("id, title, price, primary_image, category, brand, short_description, in_stock, stock_count, created_at", { count: "exact" })
      .in("id", productIds)
      .eq("active", true);

    if (inStockOnly) query = query.eq("in_stock", true).gt("stock_count", 0);
    if (q) query = query.ilike("title", `%${q}%`);
    if (category) query = query.eq("category", category);
    if (typeof minPrice === "number") query = query.gte("price", minPrice);
    if (typeof maxPrice === "number") query = query.lte("price", maxPrice);

    // 4. Apply sorting
    if (sort === "price-asc") query = query.order("price", { ascending: true });
    else if (sort === "price-desc") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    // 5. Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    // 6. Map to ShopFeedItem format with influencer customizations
    const items: ShopFeedItem[] = (data ?? []).map((p: any) => {
      const customization = customizationsMap.get(p.id);
      const displayTitle = customization?.custom_title || p.title;
      const displayPrice = customization?.sale_price ?? p.price;

      return {
        id: p.id,
        title: displayTitle,
        price: displayPrice,
        images: p.primary_image ? [p.primary_image] : [],  // Consistent: images[0] is primary
        category: p.category,
        brand: p.brand,
        short_description: p.short_description ?? null,
        in_stock: p.in_stock,
        stock_count: p.stock_count,
        created_at: p.created_at,
      };
    });

    const total = count ?? 0;
    const hasMore = page * limit < total;

    const response: FeedResponse = {
      ok: true,
      data: { items, page, limit, total, hasMore },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (e) {
    console.error("[api/influencer/[handle]/feed] error:", e);
    return NextResponse.json(
      { ok: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
