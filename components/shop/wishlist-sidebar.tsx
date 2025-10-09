"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useCartStore } from "@/lib/store/cart";
import { useWishlistStore } from "@/lib/store/wishlist";
import { ArrowRight, Heart, ShoppingCart, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export function WishlistSidebar() {
  const {
    items,
    getTotalItems,
    removeItem,
    clearWishlist,
    moveToCart,
    removeMultipleItems,
    moveMultipleToCart,
  } = useWishlistStore();
  const { addItem } = useCartStore();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((item) => item.id));
    }
  };

  const handleBulkMoveToCart = () => {
    moveMultipleToCart(selectedItems, addItem);
    setSelectedItems([]);
  };

  const handleBulkRemove = () => {
    removeMultipleItems(selectedItems);
    setSelectedItems([]);
  };

  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <Heart className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Your wishlist is empty
        </h3>
        <p className="text-gray-600 mb-4">
          Save items you love to view them later
        </p>
        <Button asChild>
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          <h2 className="font-semibold">Wishlist</h2>
          <Badge variant="secondary">{getTotalItems()}</Badge>
        </div>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearWishlist}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Bulk Actions */}
      {items.length > 0 && (
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <Checkbox
              checked={selectedItems.length === items.length}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm">Select all ({items.length})</span>
          </div>
          {selectedItems.length > 0 && (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleBulkMoveToCart}>
                <ShoppingCart className="h-4 w-4 mr-1" />
                Add to Cart ({selectedItems.length})
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkRemove}>
                Remove ({selectedItems.length})
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3 p-3 border rounded-lg">
            <Checkbox
              checked={selectedItems.includes(item.id)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedItems([...selectedItems, item.id]);
                } else {
                  setSelectedItems(
                    selectedItems.filter((id) => id !== item.id)
                  );
                }
              }}
            />
            <Image
              src={item.image}
              alt={item.title}
              width={60}
              height={60}
              className="rounded object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm line-clamp-2">{item.title}</h3>
              <p className="text-xs text-gray-600">{item.category}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-semibold">${item.price}</span>
                {!item.inStock && (
                  <Badge variant="destructive" className="text-xs">
                    Out of Stock
                  </Badge>
                )}
              </div>
              <div className="flex gap-1 mt-2">
                <Button
                  size="sm"
                  disabled={!item.inStock}
                  onClick={() => moveToCart(item.id, addItem)}
                  className="text-xs h-6"
                >
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  Add to Cart
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  className="text-xs h-6 text-red-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <Button className="w-full" asChild>
          <Link href="/shop">
            Continue Shopping
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
