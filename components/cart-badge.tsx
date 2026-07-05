'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCart } from './cart-provider'

export default function CartBadge() {
  const { totalItems } = useCart()

  return (
    <Link
      href="/cart"
      className="relative flex items-center text-zinc-600 hover:text-green-700"
      aria-label="Cart"
    >
      <ShoppingCart size={20} />
      {totalItems > 0 && (
        <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-green-600 px-1 text-[10px] font-bold text-white">
          {totalItems}
        </span>
      )}
    </Link>
  )
}
