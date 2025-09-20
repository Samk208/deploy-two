'use client'

import { Plus, BarChart3, Package, Settings, DollarSign, TrendingUp, ShoppingCart, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface SupplierStats {
  totalProducts: number
  totalRevenue: number
  totalSales: number
  activeOrders: number
  commissionEarned: number
  influencerPartners: number
}

interface TodayStats {
  sales: number
  revenue: number
  orders: number
}

interface ThisMonthStats {
  sales: number
  revenue: number
  orders: number
  newProducts: number
}

interface TopProduct {
  id: string
  title: string
  sales: number
  revenue: number
  commission: number
  stock: number
}

interface RecentOrder {
  id: string
  customerName: string
  productTitle: string
  quantity: number
  total: number
  commission: number
  status: string
  createdAt: string
}

interface SupplierDashboardData {
  stats: SupplierStats
  todayStats: TodayStats
  thisMonthStats: ThisMonthStats
  topProducts: TopProduct[]
  recentOrders: RecentOrder[]
}

export default function SupplierDashboard() {
  const [data, setData] = useState<SupplierDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/supplier')
      const result = await response.json()
      
      if (result.ok) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to fetch dashboard data')
      }
    } catch (error) {
      console.error('Error fetching supplier stats:', error)
      toast({
        title: "Error",
        description: "Failed to fetch supplier statistics",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6" data-testid="dashboard-loading">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error Loading Dashboard</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <Button 
            onClick={fetchDashboardData} 
            className="mt-3 bg-red-600 hover:bg-red-700"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Supplier Dashboard</h1>
        <div className="flex gap-2">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              +{data.thisMonthStats.newProducts} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="total-revenue">
              ${data.stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              ${data.thisMonthStats.revenue.toLocaleString()} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="commission-earned">
              ${data.stats.commissionEarned.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.stats.activeOrders} active orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              {data.thisMonthStats.sales} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.activeOrders}</div>
            <p className="text-xs text-muted-foreground">
              {data.todayStats.orders} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Influencer Partners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.influencerPartners}</div>
            <p className="text-xs text-muted-foreground">
              Active partnerships
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {data.todayStats.sales}
              </div>
              <p className="text-sm text-gray-600">Sales Today</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ${data.todayStats.revenue.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Revenue Today</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {data.todayStats.orders}
              </div>
              <p className="text-sm text-gray-600">Orders Today</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Products and Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topProducts.slice(0, 5).map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.title}</p>
                      <p className="text-xs text-gray-500">{product.sales} sales</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${product.revenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{product.commission}% commission</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{order.customerName}</p>
                    <p className="text-xs text-gray-500">{order.productTitle}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${order.total.toFixed(2)}</p>
                    <p className="text-xs text-green-600">+${order.commission.toFixed(2)}</p>
                    <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-20 flex flex-col gap-2" variant="outline">
              <Plus className="h-6 w-6" />
              <span>Add Product</span>
            </Button>
            <Button className="h-20 flex flex-col gap-2" variant="outline">
              <BarChart3 className="h-6 w-6" />
              <span>View Analytics</span>
            </Button>
            <Button className="h-20 flex flex-col gap-2" variant="outline">
              <Package className="h-6 w-6" />
              <span>Manage Inventory</span>
            </Button>
            <Button className="h-20 flex flex-col gap-2" variant="outline">
              <Settings className="h-6 w-6" />
              <span>Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
