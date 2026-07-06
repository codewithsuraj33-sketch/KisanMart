'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react'

// Cart mein har item ka structure
export type CartItem = {
  id: string // product id
  name: string
  price: number
  image_url: string | null
  stock: number // max quantity cap ke liye
  weight_grams: number // shipping calculate karne ke liye (TASK 5)
  variant_id?: string | null
  variant_label?: string | null
  quantity: number
}

export function cartItemKey(item: Pick<CartItem, 'id' | 'variant_id'>) {
  return `${item.id}:${item.variant_id ?? 'base'}`
}

type CartContextType = {
  items: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, qty: number) => void
  clearCart: () => void
  totalItems: number
  totalAmount: number
}

const CartContext = createContext<CartContextType | null>(null)
const STORAGE_KEY = 'kisanmart_cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [loaded, setLoaded] = useState(false)

  // Page load pe localStorage se cart wapas laao
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) queueMicrotask(() => setItems(JSON.parse(raw)))
    } catch {
      // corrupt data — ignore
    }
    queueMicrotask(() => setLoaded(true))
  }, [])

  // Jab bhi cart badle, localStorage mein save karo (pehli load ke baad)
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, loaded])

  const addToCart = useCallback(
    (item: Omit<CartItem, 'quantity'>, qty: number = 1) => {
      setItems((prev) => {
        const key = cartItemKey(item)
        const existing = prev.find((i) => cartItemKey(i) === key)
        if (existing) {
          // Already cart mein hai to quantity badhao (stock se zyada nahi)
          const newQty = Math.min(existing.quantity + qty, item.stock)
          return prev.map((i) =>
            cartItemKey(i) === key ? { ...i, quantity: newQty } : i
          )
        }
        return [...prev, { ...item, quantity: Math.min(qty, item.stock) }]
      })
    },
    []
  )

  const removeFromCart = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => cartItemKey(i) !== key))
  }, [])

  const updateQuantity = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) =>
        cartItemKey(i) === key
          ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock)) }
          : i
      )
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  )
  const totalAmount = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  )

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

// Custom hook — koi bhi component cart use kar sakta hai
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
