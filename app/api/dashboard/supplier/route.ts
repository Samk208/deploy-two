import { getCurrentUser, hasRole } from "@/lib/auth-helpers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UserRole, type ApiResponse } from "@/lib/types";
import { NextResponse, type NextRequest } from "next/server";

export interface SupplierDashboardData {
  stats: {
    totalProducts: number;
    totalRevenue: number;
    totalSales: number;
    activeOrders: number;
    commissionEarned: number;
    influencerPartners: number;
  };
  todayStats: {
    sales: number;
    revenue: number;
    orders: number;
  };
  thisMonthStats: {
    sales: number;
    revenue: number;
    orders: number;
    newProducts: number;
  };
  topProducts: Array<{
    id: string;
    title: string;
    sales: number;
    revenue: number;
    commission: number;
    stock: number;
  }>;
  recentOrders: Array<{
    id: string;
    customerName: string;
    productTitle: string;
    quantity: number;
    total: number;
    commission: number;
    status: string;
    createdAt: string;
  }>;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user and check permissions
    const user = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!hasRole(user, [UserRole.SUPPLIER])) {
      return NextResponse.json(
        { ok: false, error: "Supplier access required" },
        { status: 403 }
      );
    }

    const supplierId = user.id;
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Products stats (RLS-friendly: filter by supplier_id)
    const { data: productsData } = await supabase
      .from("products")
      .select("id, title, stock_count, commission, created_at, price")
      .eq("supplier_id", supplierId);

    const totalProducts = productsData?.length || 0;
    const newProductsThisMonth = (productsData || []).filter(
      (p: any) => p?.created_at && new Date(p.created_at) >= monthStart
    ).length;

    // Top products (approximation without joins or subselects)
    const topProducts = (productsData || []).slice(0, 5).map((p: any) => ({
      id: p.id,
      title: p.title || "Untitled",
      sales: 0,
      revenue: 0,
      commission: p.commission || 0,
      stock: p.stock_count || 0,
    }));

    // Orders aggregates: fallback-safe without complex joins
    const { data: ordersData } = await supabase
      .from("orders")
      .select("id, total, status, created_at")
      .order("created_at", { ascending: false })
      .limit(25);

    let totalRevenue = 0;
    let totalSales = 0;
    let activeOrders = 0;
    let commissionEarned = 0;
    let todaySales = 0;
    let todayRevenue = 0;
    let todayOrders = 0;
    let monthSales = 0;
    let monthRevenue = 0;
    let monthOrders = 0;

    // Without order items linkage available in typed schema, use totals only
    (ordersData || []).forEach((order: any) => {
      const createdAt = order.created_at ? new Date(order.created_at) : null;
      const isToday = !!createdAt && createdAt >= todayStart;
      const isThisMonth = !!createdAt && createdAt >= monthStart;

      totalRevenue += order.total || 0;
      // sales unknown without items; keep as 0
      if (order.status === "pending" || order.status === "processing") {
        activeOrders++;
      }
      if (isToday) {
        todayRevenue += order.total || 0;
        todayOrders++;
      }
      if (isThisMonth) {
        monthRevenue += order.total || 0;
        monthOrders++;
      }
    });

    // Commission cannot be derived without items; set to 0 (UI handles formatting)
    const recentOrders = (ordersData || []).slice(0, 5).map((o: any) => ({
      id: o.id,
      customerName: "Customer",
      productTitle: "Order",
      quantity: 0,
      total: o.total || 0,
      commission: 0,
      status: o.status || "unknown",
      createdAt: o.created_at || new Date().toISOString(),
    }));

    const influencerPartners = 0;

    const dashboardData: SupplierDashboardData = {
      stats: {
        totalProducts,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalSales,
        activeOrders,
        commissionEarned: Math.round(commissionEarned * 100) / 100,
        influencerPartners,
      },
      todayStats: {
        sales: todaySales,
        revenue: Math.round(todayRevenue * 100) / 100,
        orders: todayOrders,
      },
      thisMonthStats: {
        sales: monthSales,
        revenue: Math.round(monthRevenue * 100) / 100,
        orders: monthOrders,
        newProducts: newProductsThisMonth,
      },
      topProducts,
      recentOrders,
    };

    return NextResponse.json({
      ok: true,
      data: dashboardData,
    } as ApiResponse<SupplierDashboardData>);
  } catch (error) {
    console.error("Supplier dashboard error:", error);
    return NextResponse.json(
      { ok: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}
