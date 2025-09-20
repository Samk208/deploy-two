import { getCurrentUser, hasRole } from "@/lib/auth-helpers";
import {
  createServerSupabaseClient,
  type Inserts,
} from "@/lib/supabase/server";
import {
  ensureTypedClient,
  type TypedSupabaseClient,
} from "@/lib/supabase/types";
import { UserRole, type ApiResponse } from "@/lib/types";
import { NextResponse, type NextRequest } from "next/server";
import Papa from "papaparse";
import { z } from "zod";

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    errors: Record<string, string>;
    data?: any;
  }>;
  dryRun: boolean;
}

// Validation schema for import request
const importRequestSchema = z.object({
  dryRun: z.boolean().default(false),
  data: z.array(z.string()).min(1), // raw CSV lines, including header
});

// Allowed regions
const ALLOWED_REGIONS = ["Global", "KR", "JP", "CN"] as const;

// Product validation schema aligned with template headers
const productImportSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  images: z.array(z.string().url("Invalid image URL")),
  price: z.number().min(0, "Base price must be ≥ 0"),
  commission_pct: z
    .number()
    .min(0, "Commission must be between 0 and 95")
    .max(95, "Commission must be between 0 and 95"),
  regions: z.array(z.enum(ALLOWED_REGIONS)),
  stock: z.number().int().min(0, "Inventory must be ≥ 0"),
  active: z.boolean().default(false),
});

// POST /api/products/import - Import products from CSV (suppliers/admins only)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase: TypedSupabaseClient = ensureTypedClient(
      await createServerSupabaseClient(request)
    );
    const user = await getCurrentUser(supabase);
    if (!user || !hasRole(user, [UserRole.SUPPLIER, UserRole.ADMIN])) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = importRequestSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((error) => {
        errors[error.path[0] as string] = error.message;
      });

      return NextResponse.json(
        { ok: false, message: "Invalid import data", errors },
        { status: 400 }
      );
    }

    const { data, dryRun = false } = validation.data;

    // Join lines back to text and parse with a robust CSV parser
    const csvText = data.join("\n");
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

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      dryRun,
    };
    // Pre-calc duplicate SKUs in file
    const fileSkus = parsed.data
      .map((r: any) => String(r.sku ?? "").trim())
      .filter(Boolean);
    const fileSkuCounts = new Map<string, number>();
    for (const s of fileSkus)
      fileSkuCounts.set(s, (fileSkuCounts.get(s) || 0) + 1);

    // Check duplicates in DB
    let existingSkuSet = new Set<string>();
    if (fileSkus.length > 0) {
      const { data: existing, error: existingErr } = await supabase
        .from("products")
        .select("sku")
        .eq("supplier_id", user.id)
        .in("sku", Array.from(new Set(fileSkus)));

      if (!existingErr && Array.isArray(existing)) {
        existingSkuSet = new Set(
          existing.map((e: any) => e.sku).filter(Boolean)
        );
      }
    }

    // Process each data row
    for (let i = 0; i < parsed.data.length; i++) {
      const raw = parsed.data[i] as Record<string, any>;
      const rowNumber = i + 1; // match client preview indexing

      try {
        // Normalize fields
        const sku = String(raw.sku ?? "").trim();
        const title = String(raw.title ?? "").trim();
        const description = String(raw.description ?? "").trim();
        const imageUrlsRaw = String(raw.image_urls ?? "").trim();
        const basePriceRaw = String(raw.base_price ?? "").trim();
        const commissionRaw = String(raw.commission_pct ?? "").trim();
        const regionsRaw = String(raw.regions ?? "").trim();
        const inventoryRaw = String(raw.inventory ?? "").trim();
        const activeRaw = String(raw.active ?? "")
          .trim()
          .toLowerCase();

        const images = imageUrlsRaw
          ? imageUrlsRaw
              .split("|")
              .map((u: string) => u.trim())
              .filter(Boolean)
          : [];
        const price = basePriceRaw ? Number(basePriceRaw) : NaN;
        const commission_pct = commissionRaw ? Number(commissionRaw) : NaN;
        const regions = regionsRaw
          ? regionsRaw
              .split(/[,;]+/)
              .map((r) => r.trim())
              .filter(Boolean)
              .map((r) =>
                r.toUpperCase() === "GLOBAL" ? "Global" : r.toUpperCase()
              )
          : [];
        const stock = inventoryRaw ? Number(inventoryRaw) : NaN;
        const active = ["true", "1", "yes"].includes(activeRaw);

        // Validate
        const validated = productImportSchema.safeParse({
          sku,
          title,
          description,
          images,
          price,
          commission_pct,
          regions,
          stock,
          active,
        });

        const rowErrors: Record<string, string> = {};

        if (!validated.success) {
          validated.error.errors.forEach((err) => {
            const field = String(err.path[0] ?? "unknown");
            rowErrors[field] = err.message;
          });
        }

        // Duplicate checks
        if (!sku) {
          rowErrors["sku"] = rowErrors["sku"] || "SKU is required";
        } else {
          if (fileSkuCounts.get(sku)! > 1) {
            rowErrors["sku"] = "Duplicate SKU in file";
          }
          if (existingSkuSet.has(sku)) {
            rowErrors["sku"] = "This SKU already exists";
          }
        }

        if (Object.keys(rowErrors).length > 0) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            errors: rowErrors,
            data: { sku, title },
          });
          continue;
        }

        // If not dry run, insert into DB
        if (!dryRun) {
          type ProductInsert = Inserts<"products">;
          const nowIso = new Date().toISOString();
          const insertData: ProductInsert = {
            supplier_id: user.id,
            title,
            description: description || "",
            images,
            price,
            category: "general",
            region: regions as any,
            stock_count: stock,
            in_stock: stock > 0,
            commission: commission_pct,
            active,
            created_at: nowIso,
            updated_at: nowIso,
            sku,
            original_price: null,
          } as any;

          const { error: insertError } = await supabase
            .from("products")
            .insert(insertData)
            .select("id")
            .maybeSingle();

          if (insertError) {
            result.failed++;
            result.errors.push({
              row: rowNumber,
              errors: { database: "Failed to insert product" },
              data: { sku, title },
            });
            continue;
          }
        }

        result.success++;
      } catch (err) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          errors: { parsing: "Failed to process row" },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      data: result,
      message: dryRun
        ? `Dry run completed: ${result.success} valid, ${result.failed} invalid rows`
        : `Import completed: ${result.success} products imported, ${result.failed} failed`,
    } as ApiResponse<ImportResult>);
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json(
      { ok: false, message: "Something went wrong during import" },
      { status: 500 }
    );
  }
}
