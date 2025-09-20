"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface SettlementsMiniChartProps {
  settled: number
  pending: number
  isLoading?: boolean
}

export function SettlementsMiniChart({ settled, pending, isLoading }: SettlementsMiniChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const total = settled + pending
  const settledPercentage = total > 0 ? (settled / total) * 100 : 0
  const pendingPercentage = total > 0 ? (pending / total) * 100 : 0

  if (isLoading) {
    return (
      <Card className="rounded-2xl shadow-lg" data-testid="mini-settlements">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Settlements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded-full animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl shadow-lg" data-testid="mini-settlements">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Settlements vs Pending</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/supplier/settlements">View settlements</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stacked bar chart */}
        <div className="space-y-2">
          <div className="flex h-6 rounded-full overflow-hidden bg-gray-100">
            {settledPercentage > 0 && (
              <div className="bg-green-500 transition-all duration-300" style={{ width: `${settledPercentage}%` }} />
            )}
            {pendingPercentage > 0 && (
              <div className="bg-amber-500 transition-all duration-300" style={{ width: `${pendingPercentage}%` }} />
            )}
          </div>
        </div>

        {/* Legend and values */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-600">Settled</span>
            </div>
            <span className="font-medium">{formatCurrency(settled)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full" />
              <span className="text-sm text-gray-600">Pending</span>
            </div>
            <span className="font-medium">{formatCurrency(pending)}</span>
          </div>
        </div>

        {/* Total */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">Total</span>
            <span className="font-bold text-lg">{formatCurrency(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
