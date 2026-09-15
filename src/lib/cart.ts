import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: number
  name: string
  price: number
  image: string
  quantity: number
  stock: number
}

interface CartState {
  items: Array<CartItem>
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (productId: number) => void
  setQuantity: (productId: number, quantity: number) => void
  clear: () => void
  total: () => number
  count: () => number
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: Math.min(i.quantity + quantity, i.stock || 99) }
                  : i,
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity }] }
        })
      },
      removeItem: (productId) => {
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) }))
      },
      setQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items
            .map((i) => (i.productId === productId ? { ...i, quantity } : i))
            .filter((i) => i.quantity > 0),
        }))
      },
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'kito-cart' },
  ),
)
