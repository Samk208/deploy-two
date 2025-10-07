"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Package, Truck, Mail, ArrowRight, Download, Shield, Star } from "lucide-react"

// Mock order data
const mockOrder = {
  id: "ORD-2024-001",
  date: "2024-01-15",
  status: "confirmed",
  estimatedDelivery: "2024-01-20",
  items: [
    {
      id: "1",
      title: "Sustainable Cotton Tee",
      price: 45,
      quantity: 2,
      image: "/cotton-tee.png",
      influencer: { handle: "creator", name: "Creator", avatar: "/brand-manager-avatar.png" },
      supplier: { name: "EcoWear Co.", verified: true },
    },
    {
      id: "2",
      title: "Minimalist Gold Necklace",
      price: 89,
      quantity: 1,
      image: "/gold-necklace.png",
      influencer: { handle: "creator", name: "Creator", avatar: "/brand-manager-avatar.png" },
      supplier: { name: "Luxe Jewelry", verified: true },
    },
  ],
  subtotal: 179,
  tax: 14.32,
  shipping: 0,
  total: 193.32,
  shippingAddress: {
    name: "John Doe",
    address: "123 Main St",
    city: "New York",
    zipCode: "10001",
  },
}

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order")
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <OrderSuccessSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-lg text-gray-600 mb-4">
            Thank you for your purchase. Your order #{orderId} has been confirmed.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4" />
            <span>A confirmation email has been sent to your inbox</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <Card className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Order Number:</span>
                    <div className="font-medium">{mockOrder.id}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Order Date:</span>
                    <div className="font-medium">{new Date(mockOrder.date).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <div>
                      <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Estimated Delivery:</span>
                    <div className="font-medium">{new Date(mockOrder.estimatedDelivery).toLocaleDateString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Items Ordered ({mockOrder.items.length})</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  {mockOrder.items.map((item, index) => (
                    <div key={item.id}>
                      <div className="flex gap-4">
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.title}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Image
                              src={item.influencer.avatar || "/placeholder.svg"}
                              alt={item.influencer.name}
                              width={16}
                              height={16}
                              className="rounded-full"
                            />
                            <span className="text-sm text-gray-600">Curated by @{item.influencer.handle}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-600">by {item.supplier.name}</span>
                            {item.supplier.verified && (
                              <Badge variant="outline" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                            <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      {index < mockOrder.items.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="text-sm">
                  <div className="font-medium">{mockOrder.shippingAddress.name}</div>
                  <div className="text-gray-600">{mockOrder.shippingAddress.address}</div>
                  <div className="text-gray-600">
                    {mockOrder.shippingAddress.city}, {mockOrder.shippingAddress.zipCode}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary & Actions */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${mockOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>${mockOrder.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>{mockOrder.shipping === 0 ? "FREE" : `$${mockOrder.shipping.toFixed(2)}`}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${mockOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700">
                <Package className="h-4 w-4 mr-2" />
                Track Your Order
              </Button>

              <Button variant="outline" size="lg" className="w-full bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>

              <Link href="/shops" className="block">
                <Button variant="outline" size="lg" className="w-full bg-transparent">
                  Discover More Shops
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>

              <Link href="/" className="block">
                <Button variant="ghost" size="lg" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </div>

            {/* Support Note */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="text-center">
                <h3 className="font-medium text-blue-900 mb-2">Need Help?</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Our support team is here to help with any questions about your order.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100 bg-transparent"
                >
                  Contact Support
                </Button>
              </div>
            </Card>

            {/* Review Prompt */}
            <Card className="p-4 bg-amber-50 border-amber-200">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-amber-400" />
                  ))}
                </div>
                <h3 className="font-medium text-amber-900 mb-2">Love your purchase?</h3>
                <p className="text-sm text-amber-800 mb-3">Share your feedback to help other shoppers.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-300 text-amber-700 hover:bg-amber-100 bg-transparent"
                >
                  Write a Review
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrderSuccessSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-200 rounded-full skeleton" />
          <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-2 skeleton" />
          <div className="h-4 bg-gray-200 rounded w-96 mx-auto skeleton" />
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-32 bg-gray-200 rounded-2xl skeleton" />
            <div className="h-64 bg-gray-200 rounded-2xl skeleton" />
            <div className="h-24 bg-gray-200 rounded-2xl skeleton" />
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-gray-200 rounded-2xl skeleton" />
            <div className="h-64 bg-gray-200 rounded-2xl skeleton" />
          </div>
        </div>
      </div>
    </div>
  )
}
