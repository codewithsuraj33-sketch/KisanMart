'use client'

import { Scale } from 'lucide-react'
import { useCompare } from './compare-provider'
import type { Product } from '@/lib/types'

export default function CompareButton({ product }: { product: Product }) {
  const { products, toggle } = useCompare()
  const selected = products.some((item) => item.id === product.id)

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        toggle(product)
      }}
      aria-label={selected ? 'Comparison se hatao' : 'Product compare karo'}
      className={`flex h-9 w-9 items-center justify-center rounded-full border bg-white/95 shadow-sm backdrop-blur transition hover:scale-105 active:scale-95 ${
        selected ? 'border-brand text-brand' : 'border-line text-slate-500 hover:text-brand'
      }`}
    >
      <Scale size={17} />
    </button>
  )
}
