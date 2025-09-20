"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

interface TopProduct {
  product_id: string
  title: string
  image: string
  units_sold: number
  gross_sales: number
  influencer_rewards: number
  net_to_brand: number
}

interface TopProductsTableProps {
  products: TopProduct[]
  isLoading?: boolean
}

export function TopProductsTable({ products, isLoading }: TopProductsTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      minimumFractionDigits: 0,
    }).format(value)
  }

  if (isLoading) {
    return (
      <Card className="rounded-2xl shadow-lg" data-testid="table-top-products">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top 5 Best-Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
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

  if (!products || products.length === 0) {
    return (
      <Card className="rounded-2xl shadow-lg" data-testid="table-top-products">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top 5 Best-Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📦</div>
            <p>No sales data available</p>
            <p className="text-sm">Your top products will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl shadow-lg" data-testid="table-top-products">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Top 5 Best-Selling Products</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/supplier/products?sort=best">View all</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Rank</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Units Sold</TableHead>
              <TableHead className="text-right">Gross Sales</TableHead>
              <TableHead className="text-right">Influencer Rewards</TableHead>
              <TableHead className="text-right">Net to Brand</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product, index) => (
              <TableRow
                key={product.product_id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => window.open(`/dashboard/supplier/products/${product.product_id}`, "_blank")}
              >
                <TableCell>
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-sm font-bold">
                    {index + 1}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.title}
                      width={40}
                      height={40}
                      className="rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-900 line-clamp-1">{product.title}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">{product.units_sold}</TableCell>
                <TableCell className="text-right">{formatCurrency(product.gross_sales)}</TableCell>
                <TableCell className="text-right text-amber-600">
                  {formatCurrency(product.influencer_rewards)}
                </TableCell>
                <TableCell className="text-right font-medium text-green-600">
                  {formatCurrency(product.net_to_brand)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
