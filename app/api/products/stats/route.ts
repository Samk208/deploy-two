import { type NextRequest, NextResponse } from "next/server"

// Mock product data for stats calculation
const mockProducts = [
  {
    id: "1",
    status: "active",
    stock: 15,
    sales: 124,
    revenue: 5580,
  },
  {
    id: "2",
    status: "active",
    stock: 3,
    sales: 67,
    revenue: 5963,
  },
  {
    id: "3",
    status: "active",
    stock: 8,
    sales: 203,
    revenue: 24360,
  },
  {
    id: "4",
    status: "inactive",
    stock: 0,
    sales: 89,
    revenue: 8455,
  },
  {
    id: "5",
    status: "active",
    stock: 12,
    sales: 45,
    revenue: 1260,
  },
  {
    id: "6",
    status: "active",
    stock: 7,
    sales: 156,
    revenue: 31044,
  },
]

// GET /api/products/stats - Get product statistics
export async function GET(request: NextRequest) {
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200))

    const stats = {
      totalProducts: mockProducts.length,
      activeProducts: mockProducts.filter((p) => p.status === "active").length,
      inactiveProducts: mockProducts.filter((p) => p.status === "inactive").length,
      lowStockProducts: mockProducts.filter((p) => p.stock <= 10 && p.status === "active").length,
      outOfStockProducts: mockProducts.filter((p) => p.stock === 0).length,
      totalSales: mockProducts.reduce((sum, p) => sum + p.sales, 0),
      totalRevenue: mockProducts.reduce((sum, p) => sum + p.revenue, 0),
      averageStock: Math.round(mockProducts.reduce((sum, p) => sum + p.stock, 0) / mockProducts.length),
    }

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch product statistics" }, { status: 500 })
  }
}
