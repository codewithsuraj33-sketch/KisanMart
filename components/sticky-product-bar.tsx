'use client'

import { useEffect, useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { useCart } from './cart-provider'
import { useToast } from './ui/toast'
import ProductImage from './product-image'
import type { Product } from '@/lib/types'

export default function StickyProductBar({ product }: { product: Product }) {
  const [visible, setVisible] = useState(false)
  const { addToCart } = useCart()
  const toast = useToast()

  useEffect(() => {
    const target = document.getElementById('product-actions')
    if (!target) return
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0), { threshold: 0 })
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  if (!visible || product.stock <= 0) return null
  function add() {
    addToCart({ id: product.id, name: product.name, price: Number(product.price), image_url: product.image_url, stock: product.stock, weight_grams: product.weight_grams, variant_id: null, variant_label: null })
    toast('Added to cart')
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="flex w-full items-center gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <ProductImage src={product.image_url} alt="" className="hidden h-11 w-11 rounded-lg object-cover sm:block" />
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-ink">{product.name}</p><p className="font-display text-base font-extrabold text-brand">₹{product.price}</p></div>
        <button onClick={add} className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:scale-[1.02] hover:bg-brand-dark active:scale-[0.97]"><ShoppingCart size={17} /> Add to cart</button>
      </div>
    </div>
  )
}
