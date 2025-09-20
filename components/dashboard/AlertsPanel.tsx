"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react"
import Link from "next/link"

interface Alert {
  id: string
  type: "verification" | "low_stock" | "payout" | "general"
  message: string
  cta?: {
    label: string
    href: string
  }
}

interface AlertsPanelProps {
  alerts: Alert[]
  isLoading?: boolean
}

export function AlertsPanel({ alerts, isLoading }: AlertsPanelProps) {
  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "verification":
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case "low_stock":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />
      case "payout":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "general":
      default:
        return <Info className="h-4 w-4 text-gray-600" />
    }
  }

  const getAlertBadge = (type: Alert["type"]) => {
    const variants = {
      verification: { variant: "default" as const, className: "bg-blue-100 text-blue-800" },
      low_stock: { variant: "secondary" as const, className: "bg-amber-100 text-amber-800" },
      payout: { variant: "destructive" as const, className: "bg-red-100 text-red-800" },
      general: { variant: "outline" as const, className: "bg-gray-100 text-gray-800" },
    }

    const config = variants[type]
    const label = type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())

    return (
      <Badge variant={config.variant} className={config.className}>
        {label}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Card className="rounded-2xl shadow-lg" data-testid="alerts">
        <CardHeader>
          <CardTitle>Alerts & Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!alerts || alerts.length === 0) {
    return (
      <Card className="rounded-2xl shadow-lg" data-testid="alerts">
        <CardHeader>
          <CardTitle>Alerts & Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">✅</div>
            <p>All caught up!</p>
            <p className="text-sm">No alerts or tasks at the moment</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl shadow-lg" data-testid="alerts">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Alerts & Tasks
          <Badge variant="outline">{alerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">{getAlertIcon(alert.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">{getAlertBadge(alert.type)}</div>
                <p className="text-sm text-gray-900 mb-3">{alert.message}</p>
                {alert.cta && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={alert.cta.href}>{alert.cta.label}</Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
