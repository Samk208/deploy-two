// Mock data handlers for development
// Set NEXT_PUBLIC_USE_MOCKS=true to use these instead of API calls

import { format, subDays, eachDayOfInterval } from "date-fns"

export const generateMockDashboardData = (fromDate: Date, toDate: Date) => {
  // Generate realistic timeseries data
  const dateRange = eachDayOfInterval({ start: fromDate, end: toDate })
  const timeseries = {
    labels: dateRange.map((date) => format(date, "yyyy-MM-dd")),
    revenue: dateRange.map((_, index) => {
      // Create some trend with random variation
      const baseTrend = 200000 + index * 5000 // Growing trend
      const randomVariation = (Math.random() - 0.5) * 100000
      return Math.max(50000, baseTrend + randomVariation)
    }),
    orders: dateRange.map((_, index) => {
      const baseTrend = 15 + index * 0.5
      const randomVariation = (Math.random() - 0.5) * 10
      return Math.max(5, Math.floor(baseTrend + randomVariation))
    }),
  }

  const totalRevenue = timeseries.revenue.reduce((sum, val) => sum + val, 0)
  const totalOrders = timeseries.orders.reduce((sum, val) => sum + val, 0)

  return {
    totals: {
      sales_amount: totalRevenue,
      orders_count: totalOrders,
      settled_amount: Math.floor(totalRevenue * 0.85),
      influencer_rewards_paid: Math.floor(totalRevenue * 0.15),
      today_sales: timeseries.revenue[timeseries.revenue.length - 1] || 0,
      month_sales: Math.floor(totalRevenue * 1.2),
      deltas: {
        sales_amount_pct: 15.3,
        orders_count_pct: 8.7,
        settled_pct: 12.1,
        rewards_pct: 18.9,
        today_sales_pct: -5.2,
        month_sales_pct: 22.4,
      },
    },
    timeseries,
    top_products: [
      {
        product_id: "1",
        title: "Premium Cotton T-Shirt",
        image: "/cotton-tee.png",
        units_sold: 156,
        gross_sales: 7020000,
        influencer_rewards: 1404000,
        net_to_brand: 5616000,
      },
      {
        product_id: "2",
        title: "Organic Skincare Set",
        image: "/skincare-set.png",
        units_sold: 89,
        gross_sales: 10680000,
        influencer_rewards: 3204000,
        net_to_brand: 7476000,
      },
      {
        product_id: "3",
        title: "Minimalist Gold Necklace",
        image: "/gold-necklace.png",
        units_sold: 67,
        gross_sales: 5963000,
        influencer_rewards: 1490750,
        net_to_brand: 4472250,
      },
      {
        product_id: "4",
        title: "Wireless Earbuds Pro",
        image: "/wireless-earbuds.png",
        units_sold: 45,
        gross_sales: 8955000,
        influencer_rewards: 1970100,
        net_to_brand: 6984900,
      },
      {
        product_id: "5",
        title: "Handcrafted Ceramic Mug",
        image: "/ceramic-mug.png",
        units_sold: 123,
        gross_sales: 3444000,
        influencer_rewards: 620320,
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
    ],
  }
}

export const useMockData = () => {
  return process.env.NEXT_PUBLIC_USE_MOCKS === "true"
}
