"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/lib/store/cart"
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  Plus, 
  Minus, 
  Eye, 
  Share2,
  CheckCircle,
  AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  title: string
  description: string
  price: number
  originalPrice?: number
  images: string[]
  category: string
  tags: string[]
  stock_count: number
  in_stock: boolean
  active: boolean
  rating?: number
  review_count?: number
  supplier: {
    id: string
    name: string
    verified: boolean
    avatar_url?: string
  }
}

interface ProductCardProps {
  product: Product
  showSupplier?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
  onQuickView?: (product: Product) => void
}

export function ProductCard({ 
  product, 
  showSupplier = true, 
  size = "md", 
  className,
  onQuickView
}: ProductCardProps) {
  const { addItem, isInCart, getCartItem, updateQuantity } = useCartStore()
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [imageError, setImageError] = useState(false)

  const cartItem = getCartItem(product.id)
  const inCart = isInCart(product.id)

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.images[0] || "/placeholder.svg",
      maxQuantity: product.stock_count,
      category: product.category,
      supplierId: product.supplier.id,
      supplierName: product.supplier.name,
      supplierVerified: product.supplier.verified,
    })
  }

  const handleQuantityChange = (change: number) => {
    if (cartItem) {
      const newQuantity = cartItem.quantity + change
      updateQuantity(product.id, newQuantity)
    }
  }

  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const isLowStock = product.stock_count <= 5 && product.stock_count > 0

  const cardSizes = {
    sm: "w-full max-w-sm",
    md: "w-full max-w-sm sm:max-w-md",
    lg: "w-full max-w-md lg:max-w-lg"
  }

  const imageSizes = {
    sm: "h-48",
    md: "h-56 sm:h-64",
    lg: "h-64 lg:h-80"
  }

  return (
    <Card 
      data-testid="product-card"
      className={cn(
        "group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white",
        cardSizes[size],
        className
      )}
    >
      {/* Image Section - Fixed positioning */}
      <div className={cn(
        "relative overflow-hidden bg-gray-100",
        imageSizes[size]
      )}>
        <Link href={`/products/${product.id}`} className="block w-full h-full">
          <div className="relative w-full h-full">
            <Image
              src={!imageError && product.images[0] ? product.images[0] : "/placeholder.svg"}
              alt={product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        </Link>

        {/* Overlays and Badges */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        
        {/* Top badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
          {discountPercentage > 0 && (
            <Badge className="bg-red-500 text-white text-xs">
              -{discountPercentage}%
            </Badge>
          )}
          {product.tags.slice(0, 1).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Quick actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 rounded-full bg-white/90 hover:bg-white"
            onClick={() => setIsWishlisted(!isWishlisted)}
          >
            <Heart className={cn(
              "h-4 w-4",
              isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"
            )} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 rounded-full bg-white/90 hover:bg-white"
            onClick={() => onQuickView?.(product)}
          >
            <Eye className="h-4 w-4 text-gray-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 rounded-full bg-white/90 hover:bg-white"
          >
            <Share2 className="h-4 w-4 text-gray-600" />
          </Button>
        </div>

        {/* Stock status */}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive" className="text-sm font-semibold">
              Out of Stock
            </Badge>
          </div>
        )}

        {isLowStock && product.in_stock && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Only {product.stock_count} left
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Supplier info */}
        {showSupplier && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <div className="relative w-4 h-4">
                <Image
                  src={product.supplier.avatar_url || "/placeholder.svg"}
                  alt={product.supplier.name}
                  fill
                  className="rounded-full object-cover"
                  sizes="16px"
                />
              </div>
              <span className="font-medium">{product.supplier.name}</span>
              {product.supplier.verified && (
                <CheckCircle className="h-3 w-3 text-blue-500" />
              )}
            </div>
          </div>
        )}

        {/* Product title and rating */}
        <div className="space-y-1">
          <Link href={`/products/${product.id}`}>
            <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-indigo-600 transition-colors">
              {product.title}
            </h3>
          </Link>
          
          {(product.rating || product.review_count) && (
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="text-xs font-medium ml-1">
                  {product.rating?.toFixed(1) || "0.0"}
                </span>
              </div>
              {product.review_count && (
                <span className="text-xs text-gray-500">
                  ({product.review_count})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-gray-900">
            ${product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-gray-500 line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Add to cart section */}
        <div className="pt-2">
          {!product.in_stock ? (
            <Button disabled className="w-full">
              Out of Stock
            </Button>
          ) : !inCart ? (
            <Button 
              onClick={handleAddToCart}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded-lg bg-gray-50">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={cartItem?.quantity === 1}
                  className="h-8 w-8 p-0 hover:bg-gray-200"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="px-3 py-1 text-sm font-medium min-w-[40px] text-center">
                  {cartItem?.quantity || 0}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleQuantityChange(1)}
                  disabled={cartItem?.quantity === product.stock_count}
                  className="h-8 w-8 p-0 hover:bg-gray-200"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <span className="text-xs text-green-600 font-medium">
                In Cart
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
