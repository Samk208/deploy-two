import { getCurrentUser, hasRole } from "@/lib/auth-helpers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureTypedClient } from "@/lib/supabase/types";
import { UserRole } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

// Unified products listing API, supporting both public shop and supplier/admin lists.
// Backward-compatible response keys are included.
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const pageSizeParam =
      url.searchParams.get("pageSize") || url.searchParams.get("limit") || "12";
    const pageSize = Math.min(100, Math.max(1, parseInt(pageSizeParam)));
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
      query = query.eq("active", true).or("in_stock.eq.true,stock_count.gt.0");
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
      // Search by title, description, or sku
      query = query.or(
        `title.ilike.%${q}%,description.ilike.%${q}%,sku.ilike.%${q}%`
      );
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;
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
