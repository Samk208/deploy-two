'use client'

import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Package } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Product } from '@/lib/types'
import Link from 'next/link'

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "title",
    header: "Product",
    cell: ({ row }) => {
      const product = row.original
      return (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            {product.images && product.images.length > 0 ? (
              <img 
                src={product.images[0]} 
                alt={product.title}
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <Package className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div>
            <div className="font-medium">{product.title}</div>
            <div className="text-sm text-gray-500">{product.sku}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <Badge variant="outline">{row.getValue("category")}</Badge>
    ),
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(price)
      return <div className="font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "stock_count",
    header: "Stock",
    cell: ({ row }) => {
      const stock = row.getValue("stock_count") as number
      return (
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{stock}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => {
      const active = row.getValue("active") as boolean
      return (
        <Badge variant={active ? "default" : "secondary"}>
          {active ? "Active" : "Inactive"}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const product = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/supplier/products/${product.id}`}>View</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/supplier/products/${product.id}/edit`}>Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
