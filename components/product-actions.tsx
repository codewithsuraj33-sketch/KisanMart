'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Minus, Plus, ShoppingCart } from 'lucide-react'
import { useCart } from './cart-provider'
import { useToast } from './ui/toast'
import { buttonClasses } from './ui/button'
import StockAlertButton from './stock-alert-button'
import type { Product, ProductVariant } from '@/lib/types'

export default function ProductActions({ product, variants = [] }: { product: Product; variants?: ProductVariant[] }) {
  const { addToCart } = useCart()
  const toast = useToast()
  const router = useRouter()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const defaultVariant = variants.find((item) => item.is_default) ?? variants[0]
  const [variantId, setVariantId] = useState(defaultVariant?.id ?? '')
  const variant = variants.find((item) => item.id === variantId)
  const currentStock = variant?.stock ?? product.stock
  const max = Math.max(currentStock, 1)
  const item = { id: product.id, name: product.name, price: Number(variant?.price ?? product.price), image_url: product.image_url, stock: currentStock, weight_grams: variant?.weight_grams ?? product.weight_grams, variant_id: variant?.id ?? null, variant_label: variant?.label ?? null }

  function handleAdd() {
    addToCart(item, qty); setAdded(true); toast('Added to cart'); setTimeout(() => setAdded(false), 1800)
  }
  function handleBuyNow() { addToCart(item, qty); router.push('/checkout') }

  if (currentStock <= 0) return <div id="product-actions" className="mt-6 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm font-medium text-danger">Currently out of stock.<StockAlertButton productId={product.id} /></div>

  return (
    <div id="product-actions" className="mt-6 space-y-5">
      {variants.length > 0 && (
        <div>
          <div className="flex items-center justify-between"><span className="text-sm font-bold text-ink">Choose pack size</span>{variant && <span className="text-sm font-extrabold text-brand">₹{variant.price}</span>}</div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {variants.map((option) => <button key={option.id} type="button" onClick={() => { setVariantId(option.id); setQty(1) }} disabled={option.stock <= 0} className={`rounded-full border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${option.id === variantId ? 'border-brand bg-brand text-white' : 'border-line bg-card text-body hover:border-brand/40 hover:text-brand'}`}>{option.label}</button>)}
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-bold text-ink">Quantity</span>
        <div className="flex items-center rounded-full border border-line bg-card p-1">
          <button type="button" onClick={() => setQty((value) => Math.max(1, value - 1))} disabled={qty <= 1} aria-label="Decrease" className="flex h-8 w-8 items-center justify-center rounded-full text-body transition hover:bg-surface hover:text-brand disabled:opacity-30"><Minus size={15} /></button>
          <span className="w-9 text-center text-sm font-bold text-ink">{qty}</span>
          <button type="button" onClick={() => setQty((value) => Math.min(max, value + 1))} disabled={qty >= max} aria-label="Increase" className="flex h-8 w-8 items-center justify-center rounded-full text-body transition hover:bg-surface hover:text-brand disabled:opacity-30"><Plus size={15} /></button>
        </div>
        <span className="text-xs font-medium text-muted">{currentStock} available</span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button onClick={handleAdd} className={`${buttonClasses('primary', 'lg')} flex-1`}>{added ? <><Check size={18} /> Added</> : <><ShoppingCart size={18} /> Add to cart</>}</button>
        <button onClick={handleBuyNow} className={`${buttonClasses('outline', 'lg')} flex-1`}>Buy now</button>
      </div>
    </div>
  )
}
