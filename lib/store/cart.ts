import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { toast } from 'sonner'

export interface CartItem {
  id: string
  title: string
  price: number
  originalPrice?: number
  image: string
  quantity: number
  maxQuantity: number
  category: string
  supplierId: string
  supplierName: string
  supplierVerified: boolean
  variant?: {
    size?: string
    color?: string
    [key: string]: any
  }
  metadata?: {
    sku?: string
    weight?: number
    dimensions?: string
  }
}

interface CartStore {
  items: CartItem[]
  isLoading: boolean
  
  // Actions
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  
  // Computed values
  getTotalItems: () => number
  getTotalPrice: () => number
  getSubtotal: () => number
  getTax: () => number
  getShipping: () => number
  
  // Item checks
  isInCart: (id: string) => boolean
  getCartItem: (id: string) => CartItem | undefined
  
  // Bulk operations
  removeMultipleItems: (ids: string[]) => void
  updateMultipleQuantities: (updates: Array<{ id: string, quantity: number }>) => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      addItem: (itemData) => {
        const { items } = get()
        const existingItem = items.find(item => item.id === itemData.id)
        
        if (existingItem) {
          const newQuantity = existingItem.quantity + (itemData.quantity || 1)
          if (newQuantity <= existingItem.maxQuantity) {
            set({
              items: items.map(item =>
                item.id === itemData.id
                  ? { ...item, quantity: newQuantity }
                  : item
              )
            })
            toast.success(`Updated ${itemData.title} quantity to ${newQuantity}`)
          } else {
            toast.error(`Only ${existingItem.maxQuantity} items available`)
          }
        } else {
          const newItem: CartItem = {
            ...itemData,
            quantity: itemData.quantity || 1
          }
          set({ items: [...items, newItem] })
          toast.success(`${itemData.title} added to cart`)
        }
      },

      removeItem: (id) => {
        const { items } = get()
        const item = items.find(item => item.id === id)
        set({ items: items.filter(item => item.id !== id) })
        if (item) {
          toast.success(`${item.title} removed from cart`)
        }
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }

        const { items } = get()
        const item = items.find(item => item.id === id)
        
        if (item && quantity <= item.maxQuantity) {
          set({
            items: items.map(item =>
              item.id === id
                ? { ...item, quantity }
                : item
            )
          })
        } else if (item) {
          toast.error(`Only ${item.maxQuantity} items available`)
        }
      },

      clearCart: () => {
        set({ items: [] })
        toast.success('Cart cleared')
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        const { getSubtotal, getTax, getShipping } = get()
        return getSubtotal() + getTax() + getShipping()
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0)
      },

      getTax: () => {
        return get().getSubtotal() * 0.08 // 8% tax
      },

      getShipping: () => {
        const subtotal = get().getSubtotal()
        return subtotal > 75 ? 0 : 9.99 // Free shipping over $75
      },

      isInCart: (id) => {
        return get().items.some(item => item.id === id)
      },

      getCartItem: (id) => {
        return get().items.find(item => item.id === id)
      },

      removeMultipleItems: (ids) => {
        const { items } = get()
        set({ items: items.filter(item => !ids.includes(item.id)) })
        toast.success(`${ids.length} items removed from cart`)
      },

      updateMultipleQuantities: (updates) => {
        const { items } = get()
        set({
          items: items.map(item => {
            const update = updates.find(u => u.id === item.id)
            if (update && update.quantity <= item.maxQuantity) {
              return { ...item, quantity: update.quantity }
            }
            return item
          })
        })
        toast.success('Cart updated')
      }
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
)
