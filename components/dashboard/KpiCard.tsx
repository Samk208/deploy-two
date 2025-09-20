"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

interface KpiCardProps {
  label: string
  value: string
  delta?: {
    value: number
    isPositive: boolean
  }
  sparklineData?: number[]
  testId?: string
}

export function KpiCard({ label, value, delta, sparklineData, testId }: KpiCardProps) {
  // Simple SVG sparkline
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null

    const width = 60
    const height = 20
    const max = Math.max(...sparklineData)
    const min = Math.min(...sparklineData)
    const range = max - min || 1

    const points = sparklineData
      .map((value, index) => {
        const x = (index / (sparklineData.length - 1)) * width
        const y = height - ((value - min) / range) * height
        return `${x},${y}`
      })
      .join(" ")

    return (
      <svg width={width} height={height} className="opacity-60">
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-600" />
      </svg>
    )
  }

  return (
    <Card className="rounded-2xl shadow-lg" data-testid={testId}>
      <CardContent className="p-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
              {delta && (
                <div className="flex items-center gap-1">
                  {delta.isPositive ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={`text-xs font-medium ${delta.isPositive ? "text-green-600" : "text-red-600"}`}>
                    {delta.isPositive ? "+" : ""}
                    {delta.value}%
                  </span>
                </div>
              )}
            </div>
            {sparklineData && <div className="flex-shrink-0">{renderSparkline()}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
