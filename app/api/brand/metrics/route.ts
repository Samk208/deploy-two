import { type NextRequest, NextResponse } from "next/server"
import { format, subDays, eachDayOfInterval, parseISO } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    const { searchParams } = new URL(request.url)
    const fromParam = searchParams.get("from")
    const toParam = searchParams.get("to")

    if (!fromParam || !toParam) {
      return NextResponse.json({ error: "Missing date parameters" }, { status: 400 })
    }

    const fromDate = parseISO(fromParam)
    const toDate = parseISO(toParam)

    // Generate timeseries data for the date range
    const dateRange = eachDayOfInterval({ start: fromDate, end: toDate })
    const timeseries = {
      labels: dateRange.map((date) => format(date, "yyyy-MM-dd")),
      revenue: dateRange.map(() => Math.floor(Math.random() * 500000) + 100000), // 100K-600K KRW
      orders: dateRange.map(() => Math.floor(Math.random() * 50) + 5), // 5-55 orders
    }

    // Calculate totals from timeseries
    const totalRevenue = timeseries.revenue.reduce((sum, val) => sum + val, 0)
    const totalOrders = timeseries.orders.reduce((sum, val) => sum + val, 0)

    // Mock dashboard data
    const dashboardData = {
      totals: {
        sales_amount: totalRevenue,
        orders_count: totalOrders,
        settled_amount: Math.floor(totalRevenue * 0.85), // 85% settled
        influencer_rewards_paid: Math.floor(totalRevenue * 0.15), // 15% to influencers
        today_sales: timeseries.revenue[timeseries.revenue.length - 1] || 0,
        month_sales: Math.floor(totalRevenue * 1.2), // Slightly higher for monthly
        deltas: {
          sales_amount_pct: Math.floor(Math.random() * 40) - 10, // -10% to +30%
          orders_count_pct: Math.floor(Math.random() * 30) - 5, // -5% to +25%
          settled_pct: Math.floor(Math.random() * 20) + 5, // +5% to +25%
          rewards_pct: Math.floor(Math.random() * 25) - 5, // -5% to +20%
          today_sales_pct: Math.floor(Math.random() * 50) - 15, // -15% to +35%
          month_sales_pct: Math.floor(Math.random() * 35) + 5, // +5% to +40%
        },
      },
      timeseries,
      top_products: [
        {
          product_id: "1",
          title: "Premium Cotton T-Shirt",
          image: "/cotton-tee.png",
          units_sold: 156,
          gross_sales: 7020000, // 156 * 45,000 KRW
          influencer_rewards: 1404000, // 20% commission
          net_to_brand: 5616000,
        },
        {
          product_id: "2",
          title: "Organic Skincare Set",
          image: "/skincare-set.png",
          units_sold: 89,
          gross_sales: 10680000, // 89 * 120,000 KRW
          influencer_rewards: 3204000, // 30% commission
          net_to_brand: 7476000,
        },
        {
          product_id: "3",
          title: "Minimalist Gold Necklace",
          image: "/gold-necklace.png",
          units_sold: 67,
          gross_sales: 5963000, // 67 * 89,000 KRW
          influencer_rewards: 1490750, // 25% commission
          net_to_brand: 4472250,
        },
        {
          product_id: "4",
          title: "Wireless Earbuds Pro",
          image: "/wireless-earbuds.png",
          units_sold: 45,
          gross_sales: 8955000, // 45 * 199,000 KRW
          influencer_rewards: 1970100, // 22% commission
          net_to_brand: 6984900,
        },
        {
          product_id: "5",
          title: "Handcrafted Ceramic Mug",
          image: "/ceramic-mug.png",
          units_sold: 123,
          gross_sales: 3444000, // 123 * 28,000 KRW
          influencer_rewards: 620320, // 18% commission
          net_to_brand: 2823680,
        },
      ],
      settlements: {
        settled: Math.floor(totalRevenue * 0.85),
        pending: Math.floor(totalRevenue * 0.15),
      },
      recent_orders: [
        {
          order_id: "ORD-2024-001234",
          date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
          total: 199000,
          status: "paid" as const,
          customer_masked: "김**",
        },
        {
          order_id: "ORD-2024-001233",
          date: format(subDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
          total: 89000,
          status: "paid" as const,
          customer_masked: "이**",
        },
        {
          order_id: "ORD-2024-001232",
          date: format(subDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
          total: 120000,
          status: "pending" as const,
          customer_masked: "박**",
        },
        {
          order_id: "ORD-2024-001231",
          date: format(subDays(new Date(), 2), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
          total: 45000,
          status: "paid" as const,
          customer_masked: "최**",
        },
        {
          order_id: "ORD-2024-001230",
          date: format(subDays(new Date(), 3), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
          total: 28000,
          status: "refunded" as const,
          customer_masked: "정**",
        },
      ],
      alerts: [
        {
          id: "alert-1",
          type: "low_stock" as const,
          message: "Minimalist Gold Necklace has only 3 items left in stock",
          cta: {
            label: "Update Inventory",
            href: "/dashboard/supplier/products/2",
          },
        },
        {
          id: "alert-2",
          type: "verification" as const,
          message: "Your business verification is pending review",
          cta: {
            label: "View Status",
            href: "/dashboard/supplier/settings",
          },
        },
        {
          id: "alert-3",
          type: "payout" as const,
          message: "Failed payout of ₩1,250,000 - bank details need updating",
          cta: {
            label: "Update Banking",
            href: "/dashboard/supplier/settings/banking",
          },
        },
        {
          id: "alert-4",
          type: "general" as const,
          message: "New influencer @beauty_guru wants to feature your skincare products",
          cta: {
            label: "Review Request",
            href: "/dashboard/supplier/partnerships",
          },
        },
      ],
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error("Brand metrics API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Handle CORS for development
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
