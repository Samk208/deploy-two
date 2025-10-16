import { getCurrentUser, hasRole } from "@/lib/auth-helpers";
import { executeProductQuery } from "@/lib/supabase/products";
import type { Inserts } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureTypedClient } from "@/lib/supabase/types";
import { UserRole } from "@/lib/types";
import { createProductSchema } from "@/lib/validators";
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

// Unified products listing API, supporting both public shop and supplier/admin lists.
// Backward-compatible response keys are included.
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    // Parse and validate page
    const rawPage = url.searchParams.get("page");
    const parsedPage = parseInt(rawPage ?? "", 10);
    const safePage =
      Number.isFinite(parsedPage) && !Number.isNaN(parsedPage) ? parsedPage : 1;
    const page = Math.max(1, safePage);

    // Parse and validate pageSize / limit
    const pageSizeParam =
      url.searchParams.get("pageSize") || url.searchParams.get("limit") || "12";
    const parsedPageSize = parseInt(pageSizeParam, 10);
    const defaultPageSize = 12;
    const safePageSize =
      Number.isFinite(parsedPageSize) && !Number.isNaN(parsedPageSize)
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

    // Simplified query without foreign key join
    // The profiles join was causing issues, so we'll fetch products only
    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .is("deleted_at", null);

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
        .replaceAll("%", "\\%")
        .replaceAll("_", "\\_")
        .replaceAll(",", " ")
        .trim();
      const pattern = `%${escaped}%`;
      // Note: Supabase client will URL-encode the filter string; we only ensure safe content here
      query = query.or(
        `title.ilike.${pattern},description.ilike.${pattern},sku.ilike.${pattern}`
      );
    }

    const { data, error, count } = await executeProductQuery(
      query as any,
      from,
      to
    );
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

// POST /api/products - Create a new product (suppliers and admins)
export async function POST(request: NextRequest) {
  try {
    const supabase = ensureTypedClient(
      await createServerSupabaseClient(request)
    );

    // AuthZ: require supplier or admin
    const user = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Authentication required" },
        { status: 401 }
      );
    }
    if (!hasRole(user, [UserRole.SUPPLIER, UserRole.ADMIN])) {
      return NextResponse.json(
        { ok: false, message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Parse and validate body
    const body = await request.json().catch(() => ({}));
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid product data",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // Normalize region to DB expectations (DB stores region as array of strings)
    // Note: The validator currently uses ['KR','JP','CN','GLOBAL'] caps; DB uses e.g. 'Global'.
    const normalizedRegion = (data.region || []).map((r) =>
      r === "GLOBAL" ? "Global" : r
    );

    // Optional SKU uniqueness per supplier
    if (data.sku) {
      const { data: existingSku } = await supabase
        .from("products")
        .select("id")
        .eq("supplier_id", user.id)
        .eq("sku", data.sku)
        .maybeSingle();
      if (existingSku) {
        return NextResponse.json(
          {
            ok: false,
            message: "Product with this SKU already exists",
            fieldErrors: { sku: ["SKU must be unique per supplier"] },
          },
          { status: 409 }
        );
      }
    }

    // Build insert payload
    type ProductInsert = Inserts<"products">;
    const now = new Date().toISOString();
    const insertData: ProductInsert = {
      supplier_id: user.id,
      title: data.title,
      description: data.description,
      images: data.images as any,
      price: data.price,
      original_price: data.originalPrice ?? null,
      category: data.category,
      region: normalizedRegion as any,
      stock_count: data.stockCount,
      in_stock: data.stockCount > 0,
      commission: data.commission,
      active: true,
      sku: data.sku ?? null,
      created_at: now,
      updated_at: now,
    } as any;

    const { data: created, error } = await supabase
      .from("products")
      .insert(insertData)
      .select("id")
      .maybeSingle();

    if (error || !created) {
      return NextResponse.json(
        { ok: false, message: "Failed to create product" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: { id: (created as any).id },
        message: "Product created",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/products error:", err);
    return NextResponse.json(
      { ok: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
