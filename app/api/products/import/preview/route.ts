import { getCurrentUser, hasRole } from "@/lib/auth-helpers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureTypedClient } from "@/lib/supabase/types";
import { UserRole } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { z } from "zod";

// GET /api/products/import/preview?data=<base64-utf8-csv>
// Read-only CSV validation preview to work during SHOPS_FREEZE
const querySchema = z.object({ data: z.string().min(1) });

export async function GET(request: NextRequest) {
  try {
    const supabase = ensureTypedClient(
      await createServerSupabaseClient(request)
    );
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

    const url = new URL(request.url);
    const encoded = url.searchParams.get("data") || "";
    const parsedQ = querySchema.safeParse({ data: encoded });
    if (!parsedQ.success) {
      return NextResponse.json(
        { ok: false, message: "Missing data parameter" },
        { status: 400 }
      );
    }

    // Decode and parse
    const csvText = Buffer.from(parsedQ.data.data, "base64").toString("utf8");
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    }) as Papa.ParseResult<any>;
    if (parsed.errors && parsed.errors.length > 0) {
      return NextResponse.json(
        { ok: false, message: "Failed to parse CSV" },
        { status: 422 }
      );
    }

    const expectedHeaders = [
      "sku",
      "title",
      "description",
      "image_urls",
      "base_price",
      "commission_pct",
      "regions",
      "inventory",
      "active",
    ];
    const actualHeaders = (parsed.meta.fields || []).map((h: string) =>
      String(h).trim().toLowerCase()
    );
    const missingHeaders = expectedHeaders.filter(
      (h) => !actualHeaders.includes(h)
    );
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          message: `Missing required headers: ${missingHeaders.join(", ")}`,
        },
        { status: 422 }
      );
    }

    // Return a light summary for preview table
    const preview = (parsed.data as any[]).slice(0, 200).map((row, idx) => ({
      row: idx + 1,
      title: String(row.title ?? ""),
      price: row.base_price ? Number(row.base_price) : null,
      stock: row.inventory ? Number(row.inventory) : null,
      category: String(row.category ?? ""),
    }));

    return NextResponse.json({
      ok: true,
      data: { total: parsed.data.length, preview },
    });
  } catch (err) {
    console.error("Import preview error:", err);
    return NextResponse.json(
      { ok: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
