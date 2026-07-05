'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useWishlist } from './wishlist-provider'
import { useToast } from './ui/toast'

// 6 particles fired outward on save (subtle burst).
const PARTICLES = Array.from({ length: 6 }, (_, i) => {
  const angle = (i / 6) * Math.PI * 2
  return { x: Math.cos(angle) * 18, y: Math.sin(angle) * 18 }
})

export default function WishlistButton({
  productId,
  className = '',
}: {
  productId: string
  className?: string
}) {
  const { savedIds, ready, toggle } = useWishlist()
  const toast = useToast()
  const saved = savedIds.has(productId)
  const [burst, setBurst] = useState(0)

  async function onClick(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    const willSave = !saved
    if (willSave) setBurst((b) => b + 1)
    await toggle(productId)
    if (ready) toast(willSave ? 'Saved to wishlist' : 'Removed from wishlist')
  }

  return (
    <button
      type="button"
      disabled={!ready}
      onClick={onClick}
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      className={`relative flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/95 shadow-sm backdrop-blur transition hover:scale-105 hover:border-danger/40 active:scale-95 disabled:opacity-60 ${className}`}
    >
      {/* particle burst */}
      {burst > 0 && (
        <span key={burst} className="pointer-events-none absolute inset-0">
          {PARTICLES.map((p, i) => (
            <motion.span
              key={i}
              className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-danger"
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          ))}
        </span>
      )}

      <motion.span animate={{ scale: saved ? [1, 1.35, 1] : 1 }} transition={{ duration: 0.35 }}>
        <Heart
          size={18}
          className={saved ? 'fill-danger text-danger' : 'text-slate-500'}
        />
      </motion.span>
    </button>
  )
}
