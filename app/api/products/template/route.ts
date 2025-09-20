import { NextResponse } from "next/server"

export async function GET() {
  try {
    // CSV template with headers and example row
    const templateData = `id,title,description,price,original_price,category,regions,stock,status,commission_pct,sales,revenue,created_at,updated_at
,"Example Product","Product description here",29.99,39.99,"Clothing","Global;KR",50,"active",20,0,0,"2024-01-01","2024-01-01"`

    const headers = new Headers()
    headers.set("Content-Type", "text/csv")
    headers.set("Content-Disposition", 'attachment; filename="product-import-template.csv"')
    headers.set("Cache-Control", "no-cache")

    return new NextResponse(templateData, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("Template download error:", error)
    return NextResponse.json({ error: "Failed to download template" }, { status: 500 })
  }
}
