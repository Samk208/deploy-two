"use client"

import { useState } from "react"
import Image from "next/image"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Heart, ShoppingCart, Star, Truck, Shield, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickViewModalProps {
  product: any
  isOpen: boolean
  onClose: () => void
  onAddToCart: (product: any) => void
}

export function QuickViewModal({ product, isOpen, onClose, onAddToCart }: QuickViewModalProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)

  if (!product) return null

  const images = Array.isArray(product.images) ? product.images : [product.images].filter(Boolean)
  const hasDiscount = product.original_price && product.original_price > product.price
  const discountPercentage = hasDiscount 
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0

  const handleAddToCart = () => {
    onAddToCart({ ...product, quantity })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{product.title}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={images[selectedImage] || "/placeholder.jpg"}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 90vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2",
                      selectedImage === index ? "border-blue-500" : "border-gray-200"
                    )}
                  >
                    <span className="relative block w-16 h-16">
                      <Image
                        src={image}
                        alt={`${product.title} ${index + 1}`}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-900">
                ${product.price}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-gray-500 line-through">
                    ${product.original_price}
                  </span>
                  <Badge variant="destructive" className="text-xs">
                    -{discountPercentage}%
                  </Badge>
                </>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "h-4 w-4",
                      star <= (product.rating || 4.5) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {product.rating || 4.5} ({product.reviews || 0} reviews)
              </span>
            </div>

            {/* Description */}
            <p className="text-gray-700 text-sm leading-relaxed">
              {product.description}
            </p>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                product.in_stock ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="text-sm font-medium">
                {product.in_stock ? `In Stock (${product.stock_count || 0} available)` : "Out of Stock"}
              </span>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Quantity:</label>
              <div className="flex items-center border border-gray-300 rounded-md">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-8 w-8 p-0"
                >
                  -
                </Button>
                <span className="px-3 py-1 text-sm font-medium min-w-[3rem] text-center">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.min(product.stock_count || 10, quantity + 1))}
                  className="h-8 w-8 p-0"
                >
                  +
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleAddToCart}
                disabled={!product.in_stock}
                className="flex-1"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="px-3"
              >
                <Heart className={cn(
                  "h-4 w-4",
                  isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"
                )} />
              </Button>
            </div>

            {/* Features */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Truck className="h-4 w-4" />
                <span>Free shipping on orders over $50</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="h-4 w-4" />
                <span>30-day money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <RotateCcw className="h-4 w-4" />
                <span>Easy returns and exchanges</span>
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-2 pt-4 border-t">
              <h4 className="font-medium text-gray-900">Product Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Category:</span>
                  <span className="ml-2 font-medium">{product.category}</span>
                </div>
                <div>
                  <span className="text-gray-600">SKU:</span>
                  <span className="ml-2 font-medium">{product.sku || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Region:</span>
                  <span className="ml-2 font-medium">{product.region || "Global"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Commission:</span>
                  <span className="ml-2 font-medium">{product.commission}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}