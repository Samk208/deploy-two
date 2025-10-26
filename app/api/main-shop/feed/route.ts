/**
 * Fix: Ensure the shop grid receives a non-empty images array.
 * - Select 'images' (array) in addition to 'primary_image'.
 * - Map: images = p.images if non-empty, else [p.primary_image] if present, else ["/placeholder.jpg"].
 * This resolves the “image grid stays blank until click” issue by giving the client a stable image list at SSR.
 */
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Sort = "new" | "price-asc" | "price-desc";

// Simple backoff helper
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientError(e: unknown): boolean {
  const msg = String((e as any)?.message || e || "");
  // Common transient signals from fetch/undici/Supabase REST
  return (
    msg.includes("fetch failed") ||
    msg.includes("ECONNRESET") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("network timeout") ||
    msg.includes("ENOTFOUND")
  );
}

// Helper to build the base filtered query to avoid duplication
function buildBaseQuery(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  opts: {
    q: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly: boolean;
  }
) {
  if (!supabase) throw new Error("Missing Supabase env");

  let query = supabase
    .from("products")
    .select(
      "id,title,price,primary_image,images,active,in_stock,stock_count,category,brand,short_description,created_at",
      { count: "exact" }
    )
    .eq("active", true)
    .gt("stock_count", 0)
    .is("deleted_at", null);

  if (opts.inStockOnly) query = query.eq("in_stock", true);
  if (opts.q) query = query.ilike("title", `%${opts.q}%`);
  if (opts.category) query = query.eq("category", opts.category);
  if (typeof opts.minPrice === "number")
    query = query.gte("price", opts.minPrice);
  if (typeof opts.maxPrice === "number")
    query = query.lte("price", opts.maxPrice);

  return query;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const limit = Math.max(
      1,
      Math.min(48, Number(url.searchParams.get("limit") ?? "24"))
    );
    const q = (url.searchParams.get("q") ?? "").trim();
    const sort = (url.searchParams.get("sort") ?? "new") as Sort;
    const category =
      (url.searchParams.get("category") ?? "").trim() || undefined;
    const minPriceParam = url.searchParams.get("minPrice");
    const maxPriceParam = url.searchParams.get("maxPrice");
    const minPrice =
      minPriceParam !== null && minPriceParam !== ""
        ? Number(minPriceParam)
        : undefined;
    const maxPrice =
      maxPriceParam !== null && maxPriceParam !== ""
        ? Number(maxPriceParam)
        : undefined;
    const inStockOnly =
      (url.searchParams.get("inStockOnly") ?? "true") === "true";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = getSupabaseAdmin();

    // If running against local Supabase with new-style keys (sb_ prefix), the
    // Supabase JS client will include an Authorization header that PostgREST
    // rejects with PGRST301 (expects JWT). In that specific local case, query
    // PostgREST directly with the apikey header only (no Authorization).
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const isLocalSupabase = /127\.0\.0\.1|localhost/.test(supabaseUrl);
    const isSbKey = /^sb_/.test(supabaseService);

    // Execute with small retry to smooth transient network failures
    const MAX_RETRIES = 3;
    const BASE_DELAY_MS = 200;

    let data: any[] | null = null;
    let count: number | null = null;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Fallback for local sb_* keys: use direct PostgREST fetch with apikey only
        if (isLocalSupabase && isSbKey) {
          const base = new URL(
            supabaseUrl.replace(/\/$/, "") + "/rest/v1/products"
          );
          const params = base.searchParams;
          params.set(
            "select",
            "id,title,price,primary_image,active,in_stock,stock_count,category,brand,short_description,created_at"
          );
          params.set("active", "eq.true");
          params.set("stock_count", "gt.0");
          params.set("deleted_at", "is.null");
          if (inStockOnly) params.set("in_stock", "eq.true");
          if (q) params.set("title", `ilike.%25${encodeURIComponent(q)}%25`);
          if (category)
            params.set("category", `eq.${encodeURIComponent(category)}`);
          if (sort === "price-asc") params.set("order", "price.asc");
          else if (sort === "price-desc") params.set("order", "price.desc");
          else params.set("order", "created_at.desc");
          params.set("offset", String(from));
          params.set("limit", String(limit));

          const resp = await fetch(base.toString(), {
            headers: {
              apikey: supabaseService || "",
              Prefer: "count=exact",
            },
            cache: "no-store",
          });
          if (!resp.ok) {
            const errText = await resp.text().catch(() => "");
            throw new Error(
              `PostgREST ${resp.status}: ${errText || resp.statusText}`
            );
          }
          const json = await resp.json();
          data = Array.isArray(json) ? json : [];
          const contentRange =
            resp.headers.get("content-range") ||
            resp.headers.get("Content-Range");
          if (contentRange && /\/(\d+)$/i.test(contentRange)) {
            count = Number(contentRange.match(/\/(\d+)$/)![1]);
          } else {
            count = data.length;
          }
        } else {
          // Build fresh query each attempt (query builders are immutable-ish but re-create to be safe)
          let qBuilder = buildBaseQuery(supabase, {
            q,
            category,
            minPrice,
            maxPrice,
            inStockOnly,
          });

          if (sort === "price-asc")
            qBuilder = qBuilder.order("price", { ascending: true });
          else if (sort === "price-desc")
            qBuilder = qBuilder.order("price", { ascending: false });
          else qBuilder = qBuilder.order("created_at", { ascending: false });

          const res = await (qBuilder as any).range(from, to);
          if (res.error) throw res.error;
          data = res.data ?? [];
          count = (res.count ?? 0) as number;
        }
        lastError = null;
        break;
      } catch (e) {
        lastError = e;
        if (attempt >= MAX_RETRIES || !isTransientError(e)) {
          throw e;
        }
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }

    // Map to ShopFeedItem format, ensuring a non-empty images array
    const items = (data || []).map((p: any) => {
      const cleanedArray = Array.isArray(p.images)
        ? p.images.filter((s: any) => typeof s === "string" && s.trim() !== "")
        : [];
      const images = cleanedArray.length
        ? cleanedArray
        : typeof p.primary_image === "string" && p.primary_image.trim() !== ""
          ? [p.primary_image]
          : ["/placeholder.jpg"];
      return {
        id: p.id,
        title: p.title,
        price: p.price,
        images,
        category: p.category,
        brand: p.brand,
        short_description: p.short_description ?? null,
        in_stock: p.in_stock,
        stock_count: p.stock_count,
        created_at: p.created_at,
      };
    });

    const total = count || 0;
    const hasMore = page * limit < total;

    return NextResponse.json(
      { ok: true, data: { items, page, limit, total, hasMore } },
      { status: 200 }
    );
  } catch (e) {
    console.error("[api/main-shop/feed] error:", e);
    return NextResponse.json(
      { ok: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
