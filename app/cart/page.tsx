"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCartStore } from "@/lib/store/cart"
import { CartSidebar } from "@/components/shop/cart-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ShoppingCart, ArrowLeft } from "lucide-react"

export default function CartPage() {
  const [isLoading, setIsLoading] = useState(true)
  const { items, getTotalItems } = useCartStore()

  useEffect(() => {
    // Simulate loading to allow cart store to hydrate
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <CartPageSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-6xl">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/shop">Shop</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Shopping Cart</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            {getTotalItems() > 0 && (
              <span className="text-lg text-gray-600">({getTotalItems()} items)</span>
            )}
          </div>
          <Button variant="outline" asChild>
            <Link href="/shop" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
        </div>

        {/* Cart Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="h-[600px] lg:h-[700px]">
                  <CartSidebar />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recommended Products Section */}
        {items.length > 0 && (
          <section className="mt-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">You might also like</h2>
              <p className="text-gray-600">Discover more products from your favorite creators</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Placeholder for recommended products */}
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="group hover:shadow-lg transition-shadow duration-300">
                  <div className="aspect-square bg-gray-100 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <Button className="w-full" disabled>
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Trust Indicators */}
        <section className="mt-16 py-12 bg-white rounded-2xl">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-8">
              Why shop with us?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Secure Shopping</h4>
                <p className="text-gray-600 text-sm">
                  Your payment information is encrypted and secure
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Fast Shipping</h4>
                <p className="text-gray-600 text-sm">
                  Free shipping on orders over $75
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Easy Returns</h4>
                <p className="text-gray-600 text-sm">
                  30-day hassle-free return policy
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function CartPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-6xl">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-4 w-16" />
          <span>/</span>
          <Skeleton className="h-4 w-12" />
          <span>/</span>
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Cart Content Skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <Skeleton className="h-6 w-48" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 border rounded-lg">
                  <Skeleton className="w-20 h-20 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-8 w-24 mb-2" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-6">
                <div className="flex justify-between mb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex justify-between mb-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex justify-between mb-4 font-semibold">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
