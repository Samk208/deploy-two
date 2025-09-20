"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Eye, Heart, ShoppingCart, Star, Truck, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

// Strongly-typed product interface used throughout this component
export interface Product {
  id: string | number;
  title: string;
  description?: string;
  price: number;
  original_price?: number;
  images?: string[] | string;
  category?: string;
  badges?: string[];
  in_stock?: boolean;
  stock_count?: number;
  rating?: number;
  reviews?: number;
  commission?: number;
  // When present, enables deep-linking to the product detail page
  shopHandle?: string;
  supplier?: {
    id?: string;
    name?: string;
    verified?: boolean;
    avatar_url?: string;
  };
}

interface EnhancedProductCardProps {
  product: Product;
  size?: "sm" | "md" | "lg";
  showSupplier?: boolean;
  onQuickView?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export function EnhancedProductCard({
  product,
  size = "md",
  showSupplier = false,
  onQuickView,
  onAddToCart,
}: EnhancedProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const hasDiscount =
    product.original_price && product.original_price > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.original_price - product.price) / product.original_price) *
          100
      )
    : 0;

  const sizeClasses = {
    sm: "h-64",
    md: "h-80",
    lg: "h-96",
  };

  // Use a fixed aspect ratio so the fill image always has a non-zero height
  // This avoids Next.js warning: Image has "fill" and a height value of 0
  // The card width determines the height via the aspect ratio

  const primaryImageSrc = useMemo(() => {
    const raw = Array.isArray(product?.images)
      ? product.images[0]
      : product?.images;
    if (!raw || typeof raw !== "string") return "/placeholder.jpg";
    const cleaned = raw.trim().replace(/^"|"$/g, "");
    // Normalize common relative patterns (e.g., "public/foo.png" → "/foo.png")
    if (/^(public\/|images\/)/.test(cleaned)) {
      return "/" + cleaned.replace(/^public\//, "");
    }
    return cleaned;
  }, [product?.images]);

  const detailHref = useMemo(() => {
    if (!product?.id) return undefined;
    if (product?.shopHandle)
      return `/shop/${product.shopHandle}/product/${product.id}`;
    return undefined; // Avoid 404 when we don't know the shop handle
  }, [product]);

  return (
    <Card
      data-testid="product-card"
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
        sizeClasses[size]
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-0 h-full flex flex-col">
        {/* Image Container */}
        <div
          className={cn(
            "relative overflow-hidden bg-gray-100 w-full aspect-[4/3]"
          )}
        >
          <Image
            src={
              !imageError && primaryImageSrc
                ? primaryImageSrc
                : "/placeholder.jpg"
            }
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
            priority={false}
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasDiscount && (
              <Badge variant="destructive" className="text-xs">
                -{discountPercentage}%
              </Badge>
            )}
            {product.badges?.map((badge: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {badge}
              </Badge>
            ))}
            {!product.in_stock && (
              <Badge variant="outline" className="text-xs bg-white/90">
                Out of Stock
              </Badge>
            )}
          </div>

          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
            onClick={() => setIsWishlisted(!isWishlisted)}
          >
            <Heart
              className={cn(
                "h-4 w-4",
                isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"
              )}
            />
          </Button>

          {/* Quick View Overlay */}
          {isHovered && onQuickView && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onQuickView(product)}
                className="bg-white text-gray-900 hover:bg-gray-100"
              >
                <Eye className="h-4 w-4 mr-2" />
                Quick View
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col">
          {/* Title */}
          <Link
            href={detailHref ?? "#"}
            className="group"
            aria-disabled={!detailHref}
          >
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
              {product.title}
            </h3>
          </Link>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-1">
            {product.description}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-3 w-3",
                    star <= (product.rating || 4.5)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              {product.rating || 4.5} ({product.reviews || 0})
            </span>
          </div>

          {/* Supplier Info */}
          {showSupplier && product.supplier && (
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  {product.supplier.name?.charAt(0) || "S"}
                </span>
              </div>
              <span className="text-xs text-gray-600">
                by {product.supplier.name || "Supplier"}
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg font-bold text-gray-900">
              ${product.price}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">
                ${product.original_price}
              </span>
            )}
          </div>

          {/* Features */}
          <div className="flex items-center gap-3 mb-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Truck className="h-3 w-3" />
              <span>Free shipping</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span>{product.commission}% commission</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => onAddToCart?.(product)}
              disabled={!product.in_stock}
              className="flex-1"
              size="sm"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
            {onQuickView && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onQuickView(product)}
                className="px-3"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Stock Status */}
          {product.in_stock && (
            <div className="mt-2 text-xs text-green-600 font-medium">
              {product.stock_count || 0} in stock
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
