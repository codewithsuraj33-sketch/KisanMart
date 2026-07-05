'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Expand } from 'lucide-react'
import ProductImage from './product-image'

const VIEWS = [
  { label: 'Full product', imageClass: 'scale-100 object-center' },
  { label: 'Top detail', imageClass: 'scale-110 object-top' },
  { label: 'Pack detail', imageClass: 'scale-[1.18] object-center' },
  { label: 'Lower detail', imageClass: 'scale-110 object-bottom' },
]

export default function ProductGallery({ src, alt }: { src: string | null; alt: string }) {
  const [active, setActive] = useState(0)
  return (
    <div className="grid gap-3 sm:grid-cols-[76px_1fr] sm:gap-4">
      <div className="no-scrollbar order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col sm:overflow-visible">
        {VIEWS.map((view, index) => (
          <button key={view.label} onClick={() => setActive(index)} aria-label={view.label} className={`relative aspect-square w-[68px] shrink-0 overflow-hidden rounded-xl border-2 bg-slate-50 transition sm:w-full ${active === index ? 'border-brand shadow-[0_0_0_3px_rgba(22,163,74,0.1)]' : 'border-line hover:border-brand/40'}`}>
            <ProductImage src={src} alt="" className={`h-full w-full object-cover ${view.imageClass}`} />
          </button>
        ))}
      </div>
      <div className="order-1 relative aspect-square overflow-hidden rounded-3xl border border-line bg-slate-50 shadow-card sm:order-2">
        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{ opacity: 0.35 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} className="h-full w-full overflow-hidden">
            <ProductImage src={src} alt={alt} className={`h-full w-full object-cover transition-transform duration-500 ${VIEWS[active].imageClass}`} />
          </motion.div>
        </AnimatePresence>
        <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/90 text-ink shadow-sm backdrop-blur"><Expand size={17} /></span>
      </div>
    </div>
  )
}
