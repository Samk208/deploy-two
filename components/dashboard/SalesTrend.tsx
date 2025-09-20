"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

interface SalesTrendProps {
  data: Array<{
    date: string
    revenue: number
    orders: number
  }>
  isLoading?: boolean
}

export function SalesTrend({ data, isLoading }: SalesTrendProps) {
  if (isLoading) {
    return (
      <Card className="rounded-2xl shadow-lg" data-testid="chart-sales">
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-100 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className="rounded-2xl shadow-lg" data-testid="chart-sales">
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">📈</div>
              <p>No sales data available</p>
              <p className="text-sm">Data will appear once you have sales</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{formatDate(label)}</p>
          <div className="space-y-1 mt-2">
            <p className="text-indigo-600">Revenue: {formatCurrency(payload[0].value)}</p>
            <p className="text-amber-600">Orders: {payload[1].value}</p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="rounded-2xl shadow-lg" data-testid="chart-sales">
      <CardHeader>
        <CardTitle>Sales Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" tickFormatter={formatDate} className="text-xs" />
              <YAxis
                yAxisId="revenue"
                orientation="left"
                tickFormatter={(value) => `₩${(value / 1000).toFixed(0)}K`}
                className="text-xs"
              />
              <YAxis yAxisId="orders" orientation="right" className="text-xs" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                stroke="#4F46E5"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#revenueGradient)"
                name="Revenue (₩)"
              />
              <Area
                yAxisId="orders"
                type="monotone"
                dataKey="orders"
                stroke="#F59E0B"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#ordersGradient)"
                name="Orders"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
