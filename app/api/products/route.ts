import { getCurrentUser, hasRole } from "@/lib/auth-helpers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureTypedClient } from "@/lib/supabase/types";
import { UserRole } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { executeProductQuery } from "@/lib/supabase/products";
export const runtime = "nodejs";

// Unified products listing API, supporting both public shop and supplier/admin lists.
// Backward-compatible response keys are included.
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    // Parse and validate page
    const rawPage = url.searchParams.get("page");
    const parsedPage = parseInt(rawPage ?? "", 10);
    const safePage = Number.isFinite(parsedPage) && !Number.isNaN(parsedPage) ? parsedPage : 1;
    const page = Math.max(1, safePage);

    // Parse and validate pageSize / limit
    const pageSizeParam =
      url.searchParams.get("pageSize") || url.searchParams.get("limit") || "12";
    const parsedPageSize = parseInt(pageSizeParam, 10);
    const defaultPageSize = 12;
    const safePageSize = Number.isFinite(parsedPageSize) && !Number.isNaN(parsedPageSize)
      ? parsedPageSize
      : defaultPageSize;
    const pageSize = Math.min(100, Math.max(1, safePageSize));
    const owner = url.searchParams.get("owner"); // 'supplier' | 'admin' | null
    const region =
      url.searchParams.get("region") || url.searchParams.get("regions") || "";
    const q = (
      url.searchParams.get("q") ||
      url.searchParams.get("search") ||
      ""
    ).trim();
    const category = url.searchParams.get("category") || "";

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const supabase = ensureTypedClient(
      await createServerSupabaseClient(request)
    );

    // Base query
    let query = supabase.from("products").select("*", { count: "exact" });

    // Visibility rules:
    // - Public (no owner): only active and in-stock products for the shop
    // - Supplier/Admin views: show all products for the owner
    const user = await getCurrentUser(supabase).catch((err) => {
      console.error("getCurrentUser failed:", err);
      return null;
    });
    if (!owner) {
      // Enforce: active = true AND (in_stock = true OR stock_count > 0)
      // Using explicit grouped OR to avoid accidental top-level OR semantics
      query = query.or(
        "and(active.eq.true,in_stock.eq.true),and(active.eq.true,stock_count.gt.0)"
      );
    } else if (owner === "supplier") {
      if (!user) {
        return NextResponse.json(
          { ok: false, message: "Unauthenticated" },
          { status: 401 }
        );
      }
      // Suppliers see only their own products
      query = query.eq("supplier_id", user.id);
    } else if (owner === "admin") {
      if (!user || !hasRole(user, [UserRole.ADMIN])) {
        return NextResponse.json(
          { ok: false, message: "Admin required" },
          { status: 403 }
        );
      }
      // Admin sees everything (no additional filter)
    }

    if (category) query = query.eq("category", category);
    if (region && region !== "ALL") {
      // Region is stored as array; use overlaps to match any
      query = query.overlaps("region", [region]);
    }
    if (q) {
      // Search by title, description, or sku with sanitized ILIKE pattern
      // Prevent wildcard/OR injection: escape % and _ and strip commas which are OR separators in PostgREST
      const trimmed = q.slice(0, 200);
      const escaped = trimmed
        .replaceAll('%', '\\%')
        .replaceAll('_', '\\_')
        .replaceAll(',', ' ')
        .trim();
      const pattern = `%${escaped}%`;
      // Note: Supabase client will URL-encode the filter string; we only ensure safe content here
      query = query.or(
        `title.ilike.${pattern},description.ilike.${pattern},sku.ilike.${pattern}`
      );
    }

    const { data, error, count } = await executeProductQuery(query as any, from, to);
    if (error) {
      console.error("Products API error:", error);
      return NextResponse.json(
        { ok: false, message: "Failed to fetch products" },
        { status: 500 }
      );
    }

    // Backward compatibility fields for existing clients
    const resp = {
      ok: true,
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      // legacy keys
      products: data || [],
      totalCount: count || 0,
      hasMore:
        (data?.length || 0) === pageSize && from + pageSize < (count || 0),
      limit: pageSize,
    };
    return NextResponse.json(resp);
  } catch (error) {
    console.error("API /api/products failure:", error);
    return NextResponse.json(
      { ok: false, message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
