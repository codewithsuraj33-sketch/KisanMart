'use client'

import { useState } from 'react'
import { Check, ShoppingCart } from 'lucide-react'
import { useCart } from './cart-provider'
import { useLanguage } from './language-provider'

type OrderItem = {
  id: string
  product_id: string | null
  product_name: string
  price: number
  quantity: number
  products?: {
    id: string
    name: string
    price: number
    image_url: string | null
    weight_grams: number
    stock: number
  } | null
}

export default function BuyAgainButton({ items }: { items: OrderItem[] }) {
  const { addToCart } = useCart()
  const { t } = useLanguage()
  const [added, setAdded] = useState(false)

  function handleBuyAgain() {
    items.forEach((item) => {
      const product = item.products
      const quantity = Math.max(1, item.quantity)
      addToCart(
        {
          id: product?.id ?? item.product_id ?? item.id,
          name: product?.name ?? item.product_name,
          price: Number(product?.price ?? item.price),
          image_url: product?.image_url ?? null,
          stock: Math.max(product?.stock ?? quantity, quantity),
          weight_grams: product?.weight_grams ?? 0,
          variant_id: null,
          variant_label: null,
        },
        quantity
      )
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <button
      type="button"
      onClick={handleBuyAgain}
      className="inline-flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/10 px-3 py-2 text-sm font-bold text-brand-dark transition hover:bg-brand/15"
    >
      {added ? <Check size={16} /> : <ShoppingCart size={16} />} {added ? 'Added again' : t('buyAgain')}
    </button>
  )
}
