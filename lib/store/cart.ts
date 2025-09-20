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
  // Optional influencer/shop attribution for commission tracking
  shopHandle?: string
  influencerHandle?: string
  influencerId?: string
  // If present, this represents the effective sale price when added via influencer shop
  effectivePrice?: number
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
        try {
          console.debug('[Cart] addItem called with:', itemData)
        } catch (_) {}
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
            try {
              console.debug('[Cart] quantity updated:', { id: itemData.id, newQuantity })
            } catch (_) {}
            toast.success(`Updated ${itemData.title} quantity to ${newQuantity}`)
          } else {
            try { console.warn('[Cart] addItem exceeded maxQuantity', { id: itemData.id, attempted: newQuantity, max: existingItem.maxQuantity }) } catch (_) {}
            toast.error(`Only ${existingItem.maxQuantity} items available`)
          }
        } else {
          const newItem: CartItem = {
            ...itemData,
            quantity: itemData.quantity || 1
          }
          set({ items: [...items, newItem] })
          try { console.debug('[Cart] item added:', newItem) } catch (_) {}
          toast.success(`${itemData.title} added to cart`)
        }
      },

      removeItem: (id) => {
        try { console.debug('[Cart] removeItem called with:', id) } catch (_) {}
        const { items } = get()
        const item = items.find(item => item.id === id)
        set({ items: items.filter(item => item.id !== id) })
        if (item) {
          toast.success(`${item.title} removed from cart`)
        }
      },

      updateQuantity: (id, quantity) => {
        try { console.debug('[Cart] updateQuantity called with:', { id, quantity }) } catch (_) {}
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
          try { console.debug('[Cart] quantity set:', { id, quantity }) } catch (_) {}
        } else if (item) {
          try { console.warn('[Cart] updateQuantity exceeded maxQuantity', { id, attempted: quantity, max: item.maxQuantity }) } catch (_) {}
          toast.error(`Only ${item.maxQuantity} items available`)
        }
      },

      clearCart: () => {
        try { console.debug('[Cart] clearCart called') } catch (_) {}
        set({ items: [] })
        toast.success('Cart cleared')
      },

      getTotalItems: () => {
        const total = get().items.reduce((total, item) => total + item.quantity, 0)
        try { console.debug('[Cart] getTotalItems:', total) } catch (_) {}
        return total
      },

      getTotalPrice: () => {
        const { getSubtotal, getTax, getShipping } = get()
        const total = getSubtotal() + getTax() + getShipping()
        try { console.debug('[Cart] getTotalPrice:', total) } catch (_) {}
        return total
      },

      getSubtotal: () => {
        const subtotal = get().items.reduce((total, item) => total + (item.price * item.quantity), 0)
        try { console.debug('[Cart] getSubtotal:', subtotal) } catch (_) {}
        return subtotal
      },

      getTax: () => {
        const tax = get().getSubtotal() * 0.08 // 8% tax
        try { console.debug('[Cart] getTax:', tax) } catch (_) {}
        return tax
      },

      getShipping: () => {
        const subtotal = get().getSubtotal()
        const shipping = subtotal > 75 ? 0 : 9.99 // Free shipping over $75
        try { console.debug('[Cart] getShipping:', shipping) } catch (_) {}
        return shipping
      },

      isInCart: (id) => {
        const present = get().items.some(item => item.id === id)
        try { console.debug('[Cart] isInCart:', { id, present }) } catch (_) {}
        return present
      },

      getCartItem: (id) => {
        const found = get().items.find(item => item.id === id)
        try { console.debug('[Cart] getCartItem:', { id, found }) } catch (_) {}
        return found
      },

      removeMultipleItems: (ids) => {
        try { console.debug('[Cart] removeMultipleItems called with:', ids) } catch (_) {}
        const { items } = get()
        set({ items: items.filter(item => !ids.includes(item.id)) })
        toast.success(`${ids.length} items removed from cart`)
      },

      updateMultipleQuantities: (updates) => {
        try { console.debug('[Cart] updateMultipleQuantities called with:', updates) } catch (_) {}
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
      // Avoid SSR hydration mismatch; we'll manually rehydrate on client
      skipHydration: true,
    }
  )
)
