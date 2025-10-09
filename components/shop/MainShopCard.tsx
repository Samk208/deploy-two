"use client";
import { ProductImageCarousel } from "@/components/shop/ProductImageCarousel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCartStore, type CartItem } from "@/lib/store/cart";
import { useWishlistStore } from "@/lib/store/wishlist";
import { cn } from "@/lib/utils";
import type { MainShopProduct } from "@/types/catalog";
import { Eye, Heart, ShoppingBag, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const fmt = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
});

export default function MainShopCard({
  p,
  index = 0,
}: {
  p: MainShopProduct;
  index?: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const { addItem, isInCart } = useCartStore();
  const {
    addItem: addToWishlist,
    removeItem: removeFromWishlist,
    isInWishlist,
  } = useWishlistStore();

  // Prevent hydration mismatch by ensuring client-side state is only used after hydration
  const isProductInCart = isHydrated ? isInCart(p.id.toString()) : false;
  const isProductInWishlist = isHydrated
    ? isInWishlist(p.id.toString())
    : false;
  const isOutOfStock = !p.in_stock || (p.stock_count ?? 0) <= 0;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) {
      toast.error("This product is out of stock");
      return;
    }

    const cartItem: Omit<CartItem, "quantity"> & { quantity?: number } = {
      id: p.id.toString(),
      title: p.title,
      price: p.price ?? 0,
      image: p.primary_image || "/images/fallback.jpg",
      maxQuantity: p.stock_count ?? 1,
      category: p.category || "Uncategorized",
      supplierId: "unknown",
      supplierName: "Main Shop",
      supplierVerified: true,
      quantity: 1,
    };

    addItem(cartItem);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isProductInWishlist) {
      removeFromWishlist(p.id.toString());
    } else {
      addToWishlist({
        id: p.id.toString(),
        title: p.title,
        price: p.price ?? 0,
        image: p.primary_image || "/images/fallback.jpg",
        category: p.category || "Uncategorized",
        inStock: p.in_stock ?? false,
      });
    }
  };

  return (
    <div
      data-testid="product-card"
      className="group relative rounded-2xl border bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container with Carousel */}
      <Link href={`/product/${p.id}`} className="block">
        <ProductImageCarousel
          images={p.images}
          title={p.title}
          priority={index < 6}
          className="rounded-xl"
        />
      </Link>

      {/* Badges */}
      <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
        {!p.in_stock && (
          <Badge variant="destructive" className="text-xs font-medium">
            Out of Stock
          </Badge>
        )}
        {p.in_stock && (p.stock_count ?? 0) < 5 && (
          <Badge
            variant="outline"
            className="text-xs bg-amber-100 text-amber-800 border-amber-300"
          >
            Low Stock
          </Badge>
        )}
        {p.brand && (
          <Badge variant="secondary" className="text-xs">
            {p.brand}
          </Badge>
        )}
      </div>

      {/* Quick Actions */}
      <div
        className={cn(
          "absolute top-2 right-2 flex flex-col gap-2 transition-all duration-300 z-20",
          isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm"
          onClick={handleWishlist}
          aria-label={
            isProductInWishlist ? "Remove from wishlist" : "Add to wishlist"
          }
        >
          <Heart
            className={cn(
              "h-4 w-4",
              isProductInWishlist
                ? "fill-red-500 text-red-500"
                : "text-gray-600"
            )}
          />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = `/product/${p.id}`;
          }}
          aria-label="Quick view product"
        >
          <Eye className="h-4 w-4 text-gray-600" />
        </Button>
      </div>

      {/* Quick Add to Cart */}
      <div
        className={cn(
          "absolute bottom-2 right-2 transition-all duration-300 z-20",
          isHovered && !isOutOfStock
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2"
        )}
      >
        <Button
          size="sm"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          className={cn(
            "shadow-sm",
            isProductInCart
              ? "bg-green-600 hover:bg-green-700"
              : "bg-indigo-600 hover:bg-indigo-700"
          )}
        >
          {isProductInCart ? (
            <>
              <ShoppingBag className="h-4 w-4 mr-1" />
              In Cart
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4 mr-1" />
              Add
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="p-4">
        <Link href={`/product/${p.id}`} className="block group">
          <h3 className="text-base font-medium line-clamp-2 group-hover:text-indigo-600 transition-colors mb-2">
            {p.title}
          </h3>
        </Link>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">{p.category || "—"}</span>
          {p.in_stock && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              In Stock
            </span>
          )}
        </div>

        {p.short_description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {p.short_description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-900">
            {fmt.format(p.price ?? 0)}
          </div>

          {/* Stock count for low inventory */}
          {p.in_stock && (p.stock_count ?? 0) <= 10 && (
            <span className="text-xs text-amber-600">{p.stock_count} left</span>
          )}
        </div>

        {/* Mobile Add to Cart Button */}
        <div className="mt-3 sm:hidden">
          <Button
            size="sm"
            className="w-full"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
          >
            {isProductInCart ? (
              <>
                <ShoppingBag className="h-4 w-4 mr-1" />
                In Cart
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-1" />
                Add to Cart
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
