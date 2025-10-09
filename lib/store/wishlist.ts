import { toast } from "sonner";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface WishlistItem {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  inStock: boolean;
  dateAdded: string;
}

interface WishlistStore {
  items: WishlistItem[];

  // Actions
  addItem: (item: Omit<WishlistItem, "dateAdded">) => void;
  removeItem: (id: string) => void;
  clearWishlist: () => void;
  moveToCart: (id: string, addToCartFn: (item: any) => void) => void;

  // Computed values
  getTotalItems: () => number;
  isInWishlist: (id: string) => boolean;
  getWishlistItem: (id: string) => WishlistItem | undefined;

  // Bulk operations
  removeMultipleItems: (ids: string[]) => void;
  moveMultipleToCart: (ids: string[], addToCartFn: (item: any) => void) => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (itemData: Omit<WishlistItem, "dateAdded">) => {
        const { items } = get();
        const existingItem = items.find(
          (item: WishlistItem) => item.id === itemData.id
        );

        if (!existingItem) {
          const newItem: WishlistItem = {
            ...itemData,
            dateAdded: new Date().toISOString(),
          };
          set({ items: [...items, newItem] });
          toast.success(`${itemData.title} added to wishlist`);
        } else {
          toast.info(`${itemData.title} is already in your wishlist`);
        }
      },

      removeItem: (id: string) => {
        const { items } = get();
        const item = items.find((item: WishlistItem) => item.id === id);
        set({ items: items.filter((item: WishlistItem) => item.id !== id) });
        if (item) {
          toast.success(`${item.title} removed from wishlist`);
        }
      },

      clearWishlist: () => {
        set({ items: [] });
        toast.success("Wishlist cleared");
      },

      moveToCart: (id: string, addToCartFn: (item: any) => void) => {
        const { items } = get();
        const item = items.find((item: WishlistItem) => item.id === id);
        if (item) {
          addToCartFn({
            id: item.id,
            title: item.title,
            price: item.price,
            originalPrice: item.originalPrice,
            image: item.image,
            maxQuantity: 10, // Default value
            category: item.category,
            supplierId: "unknown",
            supplierName: "Main Shop",
            supplierVerified: true,
            quantity: 1,
          });
          get().removeItem(id);
          toast.success(`${item.title} moved to cart`);
        }
      },

      getTotalItems: () => {
        return get().items.length;
      },

      isInWishlist: (id: string) => {
        return get().items.some((item: WishlistItem) => item.id === id);
      },

      getWishlistItem: (id: string) => {
        return get().items.find((item: WishlistItem) => item.id === id);
      },

      removeMultipleItems: (ids: string[]) => {
        const { items } = get();
        set({
          items: items.filter((item: WishlistItem) => !ids.includes(item.id)),
        });
        toast.success(`${ids.length} items removed from wishlist`);
      },

      moveMultipleToCart: (ids: string[], addToCartFn: (item: any) => void) => {
        const { items } = get();
        const itemsToMove = items.filter((item: WishlistItem) =>
          ids.includes(item.id)
        );

        itemsToMove.forEach((item: WishlistItem) => {
          addToCartFn({
            id: item.id,
            title: item.title,
            price: item.price,
            originalPrice: item.originalPrice,
            image: item.image,
            maxQuantity: 10,
            category: item.category,
            supplierId: "unknown",
            supplierName: "Main Shop",
            supplierVerified: true,
            quantity: 1,
          });
        });

        set({
          items: items.filter((item: WishlistItem) => !ids.includes(item.id)),
        });
        toast.success(`${itemsToMove.length} items moved to cart`);
      },
    }),
    {
      name: "wishlist-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      skipHydration: true,
    }
  )
);
