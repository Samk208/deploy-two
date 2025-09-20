import { NextResponse } from "next/server";

export async function GET() {
  try {
    // CSV template with headers EXPECTED by /api/products/import
    // Keep this in lockstep with expectedHeaders in the import route
    // Per testing requirements, the template should contain ONLY headers (no sample rows)
    const templateData = `sku,title,description,image_urls,base_price,commission_pct,regions,inventory,active`;

    const headers = new Headers();
    headers.set("Content-Type", "text/csv");
    headers.set(
      "Content-Disposition",
      'attachment; filename="product-import-template.csv"'
    );
    headers.set("Cache-Control", "no-cache");

    return new NextResponse(templateData, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Template download error:", error);
    return NextResponse.json(
      { error: "Failed to download template" },
      { status: 500 }
    );
  }
}
