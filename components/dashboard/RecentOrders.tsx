"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface RecentOrder {
  order_id: string
  date: string
  total: number
  status: "paid" | "pending" | "refunded" | "failed"
  customer_masked: string
}

interface RecentOrdersProps {
  orders: RecentOrder[]
  isLoading?: boolean
}

export function RecentOrders({ orders, isLoading }: RecentOrdersProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: RecentOrder["status"]) => {
    const variants = {
      paid: { variant: "default" as const, className: "bg-green-100 text-green-800" },
      pending: { variant: "secondary" as const, className: "bg-amber-100 text-amber-800" },
      refunded: { variant: "outline" as const, className: "bg-gray-100 text-gray-800" },
      failed: { variant: "destructive" as const, className: "bg-red-100 text-red-800" },
    }

    const config = variants[status]
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Card className="rounded-2xl shadow-lg" data-testid="recent-orders">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <Card className="rounded-2xl shadow-lg" data-testid="recent-orders">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🛒</div>
            <p>No recent orders</p>
            <p className="text-sm">Orders will appear here once customers start purchasing</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl shadow-lg" data-testid="recent-orders">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Orders (Last 5)</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/supplier/orders">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.order_id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => window.open(`/dashboard/supplier/orders/${order.order_id}`, "_blank")}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-medium text-gray-900">#{order.order_id}</span>
                  {getStatusBadge(order.status)}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{formatDate(order.date)}</span>
                  <span>{order.customer_masked}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">{formatCurrency(order.total)}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
