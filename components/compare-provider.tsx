'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Product } from '@/lib/types'

export type CompareProduct = Pick<
  Product,
  'id' | 'name' | 'price' | 'mrp' | 'stock' | 'image_url' | 'weight_grams' | 'rating_avg'
>

type CompareContextValue = {
  products: CompareProduct[]
  toggle: (product: CompareProduct) => void
  clear: () => void
}

const CompareContext = createContext<CompareContextValue | null>(null)
const STORAGE_KEY = 'kisanmart_compare'

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<CompareProduct[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setProducts(JSON.parse(stored))
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const save = useCallback((next: CompareProduct[]) => {
    setProducts(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const toggle = useCallback(
    (product: CompareProduct) => {
      const exists = products.some((item) => item.id === product.id)
      if (exists) save(products.filter((item) => item.id !== product.id))
      else save([...products.slice(-2), product])
    },
    [products, save]
  )

  const clear = useCallback(() => save([]), [save])
  const value = useMemo(() => ({ products, toggle, clear }), [products, toggle, clear])

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

export function useCompare() {
  const value = useContext(CompareContext)
  if (!value) throw new Error('useCompare must be used inside CompareProvider')
  return value
}
