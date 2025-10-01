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

    // Top products: initialize; will compute a fallback from commissions if item-level linkage is unavailable
    let topProducts: SupplierDashboardData["topProducts"] = [];

    // Orders aggregates scoped to supplier via commissions → orders inner join
    // Use commissions as the linkage: commissions rows carry supplier_id and order_id
    const { data: commissionJoins } = await supabase
      .from("commissions")
      .select(
        `
        product_id,
        order_id,
        amount,
        rate,
        created_at,
        products ( title ),
        orders!inner (
          id,
          total,
          status,
          created_at,
          users!orders_customer_id_fkey ( name )
        )
      `
      )
      .eq("supplier_id", supplierId)
      .order("created_at", { ascending: false })
      .limit(200);

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

    // Aggregate by unique order_id
    type OrderAgg = {
      orderId: string;
      total: number;
      status: string;
      createdAt: string | null;
      customerName: string;
      itemsCount: number;
      commissionSum: number;
      firstProductTitle: string;
    };

    const byOrder = new Map<string, OrderAgg>();
    (commissionJoins || []).forEach((row: any) => {
      const ord = row.orders || {};
      const orderId = String(row.order_id || ord.id || "");
      if (!orderId) return;
      const existing = byOrder.get(orderId);
      const rawCreatedAt = ord.created_at || row.created_at || null;
      const parsedTs = rawCreatedAt ? Date.parse(rawCreatedAt) : NaN;
      const createdAt = Number.isFinite(parsedTs)
        ? new Date(parsedTs).toISOString()
        : null;
      const productTitle = row.products?.title || "Order";
      if (!existing) {
        byOrder.set(orderId, {
          orderId,
          total: Number(ord.total) || 0,
          status: ord.status || "unknown",
          createdAt,
          customerName: ord?.users?.name || "Customer",
          itemsCount: 1,
          commissionSum: Number(row.amount) || 0,
          firstProductTitle: productTitle,
        });
      } else {
        existing.itemsCount += 1;
        existing.commissionSum += Number(row.amount) || 0;
        // Prefer earliest createdAt from order, keep firstProductTitle as-is
      }
    });

    // Compute dashboard aggregates from unique orders
    const aggregatedOrders = Array.from(byOrder.values()).sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : -Infinity;
      const tb = b.createdAt ? Date.parse(b.createdAt) : -Infinity;
      return tb - ta;
    });

    aggregatedOrders.forEach((o) => {
      const createdAt = o.createdAt ? new Date(o.createdAt) : null;
      const isToday = !!createdAt && createdAt >= todayStart;
      const isThisMonth = !!createdAt && createdAt >= monthStart;

      totalRevenue += o.total || 0;
      totalSales += o.itemsCount || 0;
      commissionEarned += o.commissionSum || 0;

      if (o.status === "pending" || o.status === "processing") {
        activeOrders++;
      }
      if (isToday) {
        todayRevenue += o.total || 0;
        todaySales += o.itemsCount || 0;
        todayOrders++;
      }
      if (isThisMonth) {
        monthRevenue += o.total || 0;
        monthSales += o.itemsCount || 0;
        monthOrders++;
      }
    });

    // Recent orders derived from aggregated supplier-scoped orders
    const recentOrders = aggregatedOrders.slice(0, 5).map((o) => ({
      id: o.orderId,
      customerName: o.customerName,
      productTitle:
        o.itemsCount > 1
          ? `${o.firstProductTitle} + ${o.itemsCount - 1} more`
          : o.firstProductTitle,
      quantity: o.itemsCount,
      total: o.total,
      commission: Math.round(o.commissionSum * 100) / 100,
      status: o.status,
      createdAt: o.createdAt || new Date(0).toISOString(),
    }));

    // Fallback Top Products aggregation from commissions when item-level linkage is limited
    if ((commissionJoins || []).length > 0) {
      const productById: Record<string, any> = Object.create(null);
      (productsData || []).forEach((p: any) => {
        if (p?.id) productById[String(p.id)] = p;
      });

      type ProductAgg = {
        id: string;
        title: string;
        sales: number;
        commissionSum: number;
        revenueSum: number;
        rateSum: number;
        rateCount: number;
      };

      const byProduct = new Map<string, ProductAgg>();

      (commissionJoins || []).forEach((row: any) => {
        const pid = row.product_id ? String(row.product_id) : undefined;
        const title =
          row.products?.title || (pid ? `Product ${pid}` : "Product");
        const key = pid || `title:${title}`;
        const amount = Number(row.amount) || 0;
        const rate = Number(row.rate);
        const estRevenue = rate > 0 ? amount / rate : 0;

        const current = byProduct.get(key);
        if (!current) {
          byProduct.set(key, {
            id: pid || key,
            title,
            sales: 1,
            commissionSum: amount,
            revenueSum: estRevenue,
            rateSum: Number.isFinite(rate) ? rate : 0,
            rateCount: Number.isFinite(rate) && rate > 0 ? 1 : 0,
          });
        } else {
          current.sales += 1;
          current.commissionSum += amount;
          current.revenueSum += estRevenue;
          if (Number.isFinite(rate) && rate > 0) {
            current.rateSum += rate;
            current.rateCount += 1;
          }
        }
      });

      const aggregatedProducts: SupplierDashboardData["topProducts"] =
        Array.from(byProduct.values()).map((g) => {
          const p = productById[g.id];
          const avgRate = g.rateCount > 0 ? g.rateSum / g.rateCount : undefined;
          // Prefer product's configured commission if available, else derive from average rate
          const commissionPercent =
            typeof p?.commission === "number"
              ? Number(p.commission)
              : avgRate !== undefined
                ? Math.round(avgRate * 100)
                : 0;

          return {
            id: g.id,
            title: p?.title || g.title,
            sales: g.sales,
            revenue: Math.round(g.revenueSum * 100) / 100,
            commission: commissionPercent,
            stock: Number(p?.stock_count) || 0,
          };
        });

      aggregatedProducts.sort(
        (a, b) => b.revenue - a.revenue || b.sales - a.sales
      );
      topProducts = aggregatedProducts.slice(0, 5);
    }

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
