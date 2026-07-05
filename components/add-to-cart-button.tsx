'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingCart, Check } from 'lucide-react'
import { useCart } from './cart-provider'
import { useToast } from './ui/toast'
import type { Product } from '@/lib/types'

export default function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const toast = useToast()
  const [added, setAdded] = useState(false)
  const outOfStock = product.stock <= 0

  function handleClick() {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      stock: product.stock,
      weight_grams: product.weight_grams,
    })
    setAdded(true)
    toast(`${product.name} added to cart`)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <button
      type="button"
      disabled={outOfStock}
      onClick={handleClick}
      className={`flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-full py-2 text-xs font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:hover:scale-100 ${
        added ? 'bg-brand-dark' : 'bg-brand hover:bg-accent'
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {outOfStock ? (
          <motion.span key="oos">Out of Stock</motion.span>
        ) : added ? (
          <motion.span
            key="added"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2"
          >
            <Check size={16} /> Added!
          </motion.span>
        ) : (
          <motion.span
            key="add"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2"
          >
            <ShoppingCart size={16} /> Add to Cart
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
