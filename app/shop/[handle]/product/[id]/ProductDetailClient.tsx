"use client"

import { useState, useEffect } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Star,
  Heart,
  Share2,
  Plus,
  Minus,
  ShoppingCart,
  Shield,
  Truck,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
} from "lucide-react"

// Mock data (neutral placeholders only; no demo handles)
const mockInfluencer = {
  handle: "creator",
  name: "Creator",
  avatar: "/brand-manager-avatar.png",
  verified: true,
}

const mockProduct = {
  id: "1",
  title: "Sustainable Cotton Tee",
  description:
    "Made from 100% organic cotton, this comfortable tee is perfect for everyday wear. The soft fabric feels great against your skin while being environmentally conscious.",
  price: 45,
  originalPrice: 60,
  images: ["/cotton-tee.png", "/cotton-tee-back.png", "/cotton-tee-detail.png", "/cotton-tee-model.png"],
  badges: ["New", "Eco-Friendly"],
  category: "Clothing",
  region: "Global",
  inStock: true,
  stockCount: 15,
  rating: 4.8,
  reviews: 124,
  supplier: {
    name: "EcoWear Co.",
    verified: true,
    rating: 4.9,
  },
  specifications: {
    Material: "100% Organic Cotton",
    Fit: "Regular",
    Care: "Machine wash cold, tumble dry low",
    Origin: "Made in Portugal",
    Sizes: "XS, S, M, L, XL, XXL",
    Colors: "White, Black, Navy, Sage Green",
  },
  shipping: {
    freeShipping: true,
    estimatedDays: "3-5 business days",
    returns: "30-day free returns",
    warranty: "1-year quality guarantee",
  },
}

const mockRelatedProducts = [
  {
    id: "2",
    title: "Minimalist Gold Necklace",
    price: 89,
    image: "/gold-necklace.png",
    rating: 4.9,
    reviews: 67,
  },
  {
    id: "3",
    title: "Organic Skincare Set",
    price: 120,
    originalPrice: 150,
    image: "/skincare-set.png",
    rating: 4.7,
    reviews: 203,
  },
  {
    id: "4",
    title: "Vintage Denim Jacket",
    price: 95,
    image: "/classic-denim-jacket.png",
    rating: 4.6,
    reviews: 89,
  },
  {
    id: "5",
    title: "Handcrafted Ceramic Mug",
    price: 28,
    image: "/ceramic-mug.png",
    rating: 4.5,
    reviews: 45,
  },
]

interface ProductDetailClientProps {
  params: {
    handle: string
    id: string
  }
}

export default function ProductDetailClient({ params }: ProductDetailClientProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [addedToCart, setAddedToCart] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const handleAddToCart = () => {
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(1, Math.min(mockProduct.stockCount, quantity + delta)))
  }

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % mockProduct.images.length)
  }

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + mockProduct.images.length) % mockProduct.images.length)
  }

  if (isLoading) {
    return <ProductDetailSkeleton />
  }

  if (!mockProduct) {
    notFound()
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: mockProduct.title,
    description: mockProduct.description,
    image: mockProduct.images,
    brand: {
      "@type": "Brand",
      name: mockProduct.supplier.name,
    },
    offers: {
      "@type": "Offer",
      price: mockProduct.price,
      priceCurrency: "USD",
      availability: mockProduct.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: mockInfluencer.name,
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: mockProduct.rating,
      reviewCount: mockProduct.reviews,
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/shop/${params.handle}`}>@{params.handle}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{mockProduct.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src={mockProduct.images[selectedImageIndex] || "/placeholder.svg"}
                  alt={`${mockProduct.title} - Image ${selectedImageIndex + 1}`}
                  fill
                  className="object-cover"
                  priority
                />

                {/* Navigation Arrows */}
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 p-0 bg-white/80 hover:bg-white"
                  onClick={prevImage}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 p-0 bg-white/80 hover:bg-white"
                  onClick={nextImage}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {selectedImageIndex + 1} / {mockProduct.images.length}
                </div>
              </div>

              {/* Thumbnail Gallery */}
              <div className="grid grid-cols-4 gap-3">
                {mockProduct.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? "border-indigo-500 ring-2 ring-indigo-200"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    aria-label={`View image ${index + 1}`}
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`${mockProduct.title} thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{mockProduct.title}</h1>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {mockProduct.badges.map((badge) => (
                        <Badge key={badge} variant={badge === "New" ? "default" : "secondary"} className="text-sm">
                          {badge}
                        </Badge>
                      ))}
                      {mockProduct.stockCount <= 10 && (
                        <Badge variant="destructive" className="bg-amber-500">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Only {mockProduct.stockCount} left
                        </Badge>
                      )}
                    </div>

                    {/* Influencer & Supplier */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Image
                          src={mockInfluencer.avatar || "/placeholder.svg"}
                          alt={mockInfluencer.name}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                        <span className="text-sm text-gray-600">
                          Curated by{" "}
                          <Link href={`/shop/${params.handle}`} className="text-indigo-600 hover:underline">
                            @{mockInfluencer.handle}
                          </Link>
                        </span>
                        {mockInfluencer.verified && <Shield className="h-4 w-4 text-indigo-600" />}
                      </div>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">by {mockProduct.supplier.name}</span>
                        {mockProduct.supplier.verified && (
                          <Badge variant="outline" className="text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-6">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(mockProduct.rating) ? "text-amber-400 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {mockProduct.rating} ({mockProduct.reviews} reviews)
                      </span>
                    </div>
                  </div>

                  {/* Wishlist & Share */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsWishlisted(!isWishlisted)}
                      className={isWishlisted ? "text-red-600 border-red-200" : ""}
                    >
                      <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl font-bold text-gray-900">${mockProduct.price}</span>
                  {mockProduct.originalPrice && (
                    <span className="text-xl text-gray-500 line-through">${mockProduct.originalPrice}</span>
                  )}
                  {mockProduct.originalPrice && (
                    <Badge variant="destructive" className="bg-green-600">
                      Save ${mockProduct.originalPrice - mockProduct.price}
                    </Badge>
                  )}
                </div>

                {/* Region Availability */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Truck className="h-4 w-4" />
                    <span>Available in: {mockProduct.region}</span>
                  </div>
                </div>
              </div>

              {/* Quantity & Add to Cart */}
              <Card className="p-6">
                <div className="space-y-4">
                  {/* Quantity Selector */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">Quantity:</span>
                    <div className="flex items-center border rounded-lg">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="h-10 w-10 p-0"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center text-sm font-medium">{quantity}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= mockProduct.stockCount}
                        className="h-10 w-10 p-0"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="text-sm text-gray-500">({mockProduct.stockCount} available)</span>
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    size="lg"
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleAddToCart}
                    disabled={!mockProduct.inStock}
                  >
                    {addedToCart ? (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Added to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Add to Cart - ${(mockProduct.price * quantity).toFixed(2)}
                      </>
                    )}
                  </Button>

                  {!mockProduct.inStock && (
                    <div className="text-center">
                      <Badge variant="destructive" className="mb-2">
                        Out of Stock
                      </Badge>
                      <p className="text-sm text-gray-600">This item is currently unavailable</p>
                    </div>
                  )}

                  {/* Trust Indicators */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Shield className="h-5 w-5 text-green-600" />
                      <span className="text-xs text-gray-600">Secure Payment</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Truck className="h-5 w-5 text-green-600" />
                      <span className="text-xs text-gray-600">Fast Shipping</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <RotateCcw className="h-5 w-5 text-green-600" />
                      <span className="text-xs text-gray-600">Easy Returns</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Product Details Tabs */}
          <div className="mt-12">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="specifications">Specifications</TabsTrigger>
                <TabsTrigger value="shipping">Shipping & Returns</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Product Description</h3>
                  <p className="text-gray-700 leading-relaxed">{mockProduct.description}</p>
                </Card>
              </TabsContent>

              <TabsContent value="specifications" className="mt-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Specifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(mockProduct.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700">{key}:</span>
                        <span className="text-gray-600">{value}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="shipping" className="mt-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Shipping & Returns</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Truck className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900">Free Shipping</h4>
                        <p className="text-sm text-gray-600">
                          Estimated delivery: {mockProduct.shipping.estimatedDays}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <RotateCcw className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900">Returns</h4>
                        <p className="text-sm text-gray-600">{mockProduct.shipping.returns}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900">Warranty</h4>
                        <p className="text-sm text-gray-600">{mockProduct.shipping.warranty}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Related Products */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">You might also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {mockRelatedProducts.map((product) => (
                <Card
                  key={product.id}
                  className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                      <Link href={`/shop/${params.handle}/product/${product.id}`} className="hover:text-indigo-600">
                        {product.title}
                      </Link>
                    </h3>
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="h-3 w-3 text-amber-400 fill-current" />
                      <span className="text-xs text-gray-600">
                        {product.rating} ({product.reviews})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">${product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">${product.originalPrice}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb Skeleton */}
        <div className="h-4 bg-gray-200 rounded w-64 mb-6 skeleton" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery Skeleton */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-200 rounded-2xl skeleton" />
            <div className="grid grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-lg skeleton" />
              ))}
            </div>
          </div>

          {/* Product Info Skeleton */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4 skeleton" />
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded w-16 skeleton" />
                <div className="h-6 bg-gray-200 rounded w-20 skeleton" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-1/2 skeleton" />
              <div className="h-4 bg-gray-200 rounded w-1/3 skeleton" />
              <div className="h-10 bg-gray-200 rounded w-32 skeleton" />
            </div>
            <div className="h-32 bg-gray-200 rounded-2xl skeleton" />
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="mt-12">
          <div className="h-10 bg-gray-200 rounded w-full mb-6 skeleton" />
          <div className="h-40 bg-gray-200 rounded-2xl skeleton" />
        </div>

        {/* Related Products Skeleton */}
        <div className="mt-12">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6 skeleton" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-square bg-gray-200 rounded-lg skeleton" />
                <div className="h-4 bg-gray-200 rounded skeleton" />
                <div className="h-4 bg-gray-200 rounded w-2/3 skeleton" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
