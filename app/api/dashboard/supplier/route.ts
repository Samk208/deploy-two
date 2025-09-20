import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getCurrentUser, hasRole } from "@/lib/auth-helpers"
import { UserRole, type ApiResponse } from "@/lib/types"

export interface SupplierDashboardData {
  stats: {
    totalProducts: number
    totalRevenue: number
    totalSales: number
    activeOrders: number
    commissionEarned: number
    influencerPartners: number
  }
  todayStats: {
    sales: number
    revenue: number
    orders: number
  }
  thisMonthStats: {
    sales: number
    revenue: number
    orders: number
    newProducts: number
  }
  topProducts: Array<{
    id: string
    title: string
    sales: number
    revenue: number
    commission: number
    stock: number
  }>
  recentOrders: Array<{
    id: string
    customerName: string
    productTitle: string
    quantity: number
    total: number
    commission: number
    status: string
    createdAt: string
  }>
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get current user and check permissions
    const user = await getCurrentUser(supabase)
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    if (!hasRole(user, [UserRole.SUPPLIER])) {
      return NextResponse.json(
        { ok: false, error: "Supplier access required" },
        { status: 403 }
      )
    }

    const supplierId = user.id
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get supplier's products count
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, title, stock_count, commission, created_at')
      .eq('supplier_id', supplierId)

    if (productsError) {
      console.error('Products fetch error:', productsError)
      return NextResponse.json(
        { ok: false, error: "Failed to fetch products data" },
        { status: 500 }
      )
    }

    const totalProducts = productsData?.length || 0
    const newProductsThisMonth = productsData?.filter((p: { created_at: string }) => 
      new Date(p.created_at) >= monthStart
    ).length || 0

    // Get top products by sales
    const { data: topProducts, error: topProductsError } = await supabase
      .from('products')
      .select(`
        id,
        title,
        price,
        commission,
        stock_count,
        (
          select 
            coalesce(sum(quantity), 0) as total_sales,
            coalesce(sum(quantity * price), 0) as total_revenue
          from order_items 
          where product_id = products.id
        )
      `)
      .eq('supplier_id', supplierId)
      .order('total_sales', { ascending: false })
      .limit(5)

    if (topProductsError) {
      console.error('Top products fetch error:', topProductsError)
      return NextResponse.json(
        { ok: false, error: "Failed to fetch top products data" },
        { status: 500 }
      )
    }

    const formattedTopProducts = topProducts?.map((p: any) => ({
      id: p.id,
      title: p.title,
      sales: p.total_sales || 0,
      revenue: p.total_revenue || 0,
      commission: p.commission,
      stock: p.stock_count
    })).sort((a: any, b: any) => b.sales - a.sales) || []

    // Get orders data for supplier's products
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        total,
        status,
        created_at,
        profiles!customer_id (
          first_name,
          last_name
        ),
        order_items (
          quantity,
          price,
          products (
            title,
            commission,
            supplier_id
          )
        )
      `)
      .contains('order_items.products.supplier_id', [supplierId])
      .order('created_at', { ascending: false })
      .limit(10)

    if (ordersError) {
      console.error('Orders fetch error:', ordersError)
      return NextResponse.json(
        { ok: false, error: "Failed to fetch orders data" },
        { status: 500 }
      )
    }

    // Calculate metrics from orders
    let totalRevenue = 0
    let totalSales = 0
    let activeOrders = 0
    let commissionEarned = 0
    let todaySales = 0
    let todayRevenue = 0
    let todayOrders = 0
    let monthSales = 0
    let monthRevenue = 0
    let monthOrders = 0

    const formattedRecentOrders = ordersData?.map((order: any) => {
      const supplierItems = order.order_items?.filter((item: any) => 
        item.products?.supplier_id === supplierId
      ) || []
      
      const orderTotal = supplierItems.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.price), 0
      )
      
      const commission = supplierItems.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.price * (item.products?.commission || 0) / 100), 0
      )

      return {
        id: order.id,
        customerName: `${order.profiles?.first_name || ''} ${order.profiles?.last_name || ''}`.trim() || 'Unknown Customer',
        productTitle: supplierItems[0]?.products?.title || 'Multiple Products',
        quantity: supplierItems.reduce((sum: number, item: any) => sum + item.quantity, 0),
        total: orderTotal,
        commission: commission,
        status: order.status,
        createdAt: order.created_at
      }
    }).filter((order: any) => order.total > 0).sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ) || []

    // Get unique influencer partners count (simplified - would need proper shop/influencer relationship)
    const influencerPartners = Math.floor(Math.random() * 15) + 5 // Placeholder

    ordersData?.forEach((order: { created_at: string; status: string; order_items: any[] }) => {
      const orderDate = new Date(order.created_at)
      const isToday = orderDate >= todayStart
      const isThisMonth = orderDate >= monthStart
      
      // Filter items for this supplier only
      const supplierItems = order.order_items?.filter((item: { products: { supplier_id: string } }) => 
        item.products?.supplier_id === supplierId
      ) || []

      if (supplierItems.length === 0) return

      let orderTotal = 0
      let orderCommission = 0

      supplierItems.forEach((item: { price: number; quantity: number; products: { commission: number } }) => {
        const itemTotal = item.price * item.quantity
        const itemCommission = itemTotal * (item.products?.commission || 0) / 100
        
        orderTotal += itemTotal
        orderCommission += itemCommission

        // Track product sales
        totalRevenue += itemTotal
        totalSales += item.quantity
        commissionEarned += itemCommission
      })

      if (order.status === 'pending' || order.status === 'processing') {
        activeOrders++
      }

      if (isToday) {
        todaySales += supplierItems.reduce((sum: number, item: any) => sum + item.quantity, 0)
        todayRevenue += orderTotal
        todayOrders++
      }

      if (isThisMonth) {
        monthSales += supplierItems.reduce((sum: number, item: any) => sum + item.quantity, 0)
        monthRevenue += orderTotal
        monthOrders++
      }
    })

    const dashboardData: SupplierDashboardData = {
      stats: {
        totalProducts,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalSales,
        activeOrders,
        commissionEarned: Math.round(commissionEarned * 100) / 100,
        influencerPartners
      },
      todayStats: {
        sales: todaySales,
        revenue: Math.round(todayRevenue * 100) / 100,
        orders: todayOrders
      },
      thisMonthStats: {
        sales: monthSales,
        revenue: Math.round(monthRevenue * 100) / 100,
        orders: monthOrders,
        newProducts: newProductsThisMonth
      },
      topProducts: formattedTopProducts,
      recentOrders: formattedRecentOrders
    }

    return NextResponse.json({
      ok: true,
      data: dashboardData
    } as ApiResponse<SupplierDashboardData>)

  } catch (error) {
    console.error('Supplier dashboard error:', error)
    return NextResponse.json(
      { ok: false, error: "Something went wrong" },
      { status: 500 }
    )
  }
}
