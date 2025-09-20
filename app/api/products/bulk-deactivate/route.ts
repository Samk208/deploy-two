import { type NextRequest, NextResponse } from "next/server"

// Mock product data (same as in other files)
const mockProducts = [
  {
    id: "1",
    title: "Sustainable Cotton Tee",
    description: "Made from 100% organic cotton, this comfortable tee is perfect for everyday wear.",
    price: 45,
    originalPrice: 60,
    basePrice: 37.5,
    image: "/cotton-tee.png",
    images: ["/cotton-tee.png", "/cotton-tee-back.png", "/cotton-tee-detail.png"],
    category: "Clothing",
    regions: ["Global", "KR", "JP"],
    stock: 15,
    status: "active",
    commission: 20,
    sales: 124,
    revenue: 5580,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
  },
  {
    id: "2",
    title: "Minimalist Gold Necklace",
    description: "Elegant 14k gold-plated necklace with a minimalist design.",
    price: 89,
    basePrice: 71.2,
    image: "/gold-necklace.png",
    images: ["/gold-necklace.png"],
    category: "Jewelry",
    regions: ["KR"],
    stock: 3,
    status: "active",
    commission: 25,
    sales: 67,
    revenue: 5963,
    createdAt: "2024-01-10T09:15:00Z",
    updatedAt: "2024-01-18T16:45:00Z",
  },
]

// POST /api/products/bulk-deactivate - Bulk deactivate products
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productIds } = body

    // Validate input
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ success: false, error: "Product IDs array is required" }, { status: 400 })
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Find and update products
    const updatedProducts = []
    const notFoundIds = []

    for (const productId of productIds) {
      const productIndex = mockProducts.findIndex((p) => p.id === productId)

      if (productIndex === -1) {
        notFoundIds.push(productId)
        continue
      }

      // Deactivate product
      mockProducts[productIndex] = {
        ...mockProducts[productIndex],
        status: "inactive",
        updatedAt: new Date().toISOString(),
      }

      updatedProducts.push(mockProducts[productIndex])
    }

    // Return results
    const response: any = {
      success: true,
      data: {
        deactivated: updatedProducts,
        deactivatedCount: updatedProducts.length,
        totalRequested: productIds.length,
      },
      message: `Successfully deactivated ${updatedProducts.length} product${updatedProducts.length !== 1 ? "s" : ""}`,
    }

    if (notFoundIds.length > 0) {
      response.warnings = {
        notFound: notFoundIds,
        message: `${notFoundIds.length} product${notFoundIds.length !== 1 ? "s" : ""} not found`,
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to deactivate products" }, { status: 500 })
  }
}
