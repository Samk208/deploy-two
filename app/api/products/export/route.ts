import { getCurrentUser, hasRole } from "@/lib/auth-helpers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/types";
import { stringify } from "csv-stringify/sync";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Simple validation schema for export parameters
const productQuerySchema = z.object({
  category: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  search: z.string().optional(),
  regions: z.string().optional(), // comma-separated list
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request);

    // Get current user and check permissions
    const user = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!hasRole(user, [UserRole.SUPPLIER, UserRole.ADMIN])) {
      return NextResponse.json(
        { ok: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryData = {
      category: searchParams.get("category") || undefined,
      status:
        (searchParams.get("status") as "active" | "inactive" | null) ||
        undefined,
      search: searchParams.get("search") || undefined,
      regions: searchParams.get("regions") || undefined,
    };

    const validation = productQuerySchema.safeParse(queryData);
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { category, status, search, regions } = validation.data;

    // Build query
    let query = supabase.from("products").select("*");

    // Apply filters
    if (category) {
      query = query.eq("category", category);
    }
    if (status) {
      query = query.eq("active", status === "active");
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (regions) {
      const regionList = regions
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
      if (regionList.length > 0) {
        // Match products that are available in ANY of the selected regions.
        // Supabase (Postgres) supports array overlap via the "overlaps" filter,
        // which checks that arrays share at least one common element.
        query = query.overlaps("region", regionList);
      }
    }

    // For suppliers, only show their own products
    if (user.role === UserRole.SUPPLIER) {
      query = query.eq("supplier_id", user.id);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error("Products export error:", error);
      return NextResponse.json(
        { ok: false, error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    // Convert to CSV with template-compatible headers
    const rows = (products || []).map((p: any) => ({
      sku: p.sku ?? "",
      title: p.title ?? "",
      description: p.description ?? "",
      image_urls: Array.isArray(p.images)
        ? (p.images as string[]).join("|")
        : "",
      base_price: p.price ?? 0,
      commission_pct: typeof p.commission === "number" ? p.commission : 0,
      regions: Array.isArray(p.region) ? (p.region as string[]).join(",") : "",
      inventory: p.stock_count ?? 0,
      active: !!p.active,
    }));

    const csvData = stringify(rows, {
      header: true,
      columns: [
        "sku",
        "title",
        "description",
        "image_urls",
        "base_price",
        "commission_pct",
        "regions",
        "inventory",
        "active",
      ],
    });

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="products-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { ok: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}
