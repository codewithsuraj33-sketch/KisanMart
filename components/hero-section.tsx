'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Star } from 'lucide-react'
import { buttonClasses } from './ui/button'

const TRUST = ['500+ Products', 'Free delivery ₹999+', 'Genuine Products']

// Floating demo product cards for the hero visual.
const FLOATERS = [
  {
    name: 'Hybrid Wheat Seeds',
    price: 349,
    img: 'https://picsum.photos/seed/wheat-seeds/240/240',
    className: 'left-0 top-8 w-40 animate-float',
    delay: 0,
  },
  {
    name: 'Organic Vermicompost',
    price: 499,
    img: 'https://picsum.photos/seed/vermicompost/240/240',
    className: 'right-2 top-24 w-36 animate-float-slower',
    delay: 0.15,
  },
  {
    name: 'Drip Irrigation Kit',
    price: 1299,
    img: 'https://picsum.photos/seed/drip-kit/240/240',
    className: 'bottom-6 left-10 w-44 animate-float-slower',
    delay: 0.3,
  },
]

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] overflow-hidden bg-card">
      {/* subtle green dot pattern on the right half */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-dots opacity-60 md:block" />

      <div className="grid min-h-[90vh] w-full items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[55%_45%] md:py-0 lg:px-10">
        {/* LEFT */}
        <div className="relative z-10 text-center md:text-left">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3.5 py-1.5 text-xs font-semibold text-brand"
          >
            🌱 India&apos;s Trusted Agri Store
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.08 }}
            className="mt-5 text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl"
          >
            Fresh Seeds &amp;
            <br />
            <span className="text-brand">Farm Essentials</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.16 }}
            className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-body md:mx-0"
          >
            Quality-tested products for Indian farmers. Direct from trusted
            manufacturers, delivered to your doorstep.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.24 }}
            className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start"
          >
            <Link href="/products" className={buttonClasses('primary', 'lg')}>
              Shop Now <ArrowRight size={18} />
            </Link>
            <Link href="/#categories" className={buttonClasses('outline', 'lg')}>
              View Categories
            </Link>
          </motion.div>

          {/* Trust row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.32 }}
            className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 md:justify-start"
          >
            {TRUST.map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-sm font-medium text-body">
                <Check size={16} className="text-brand" /> {t}
              </span>
            ))}
          </motion.div>
        </div>

        {/* RIGHT — gradient panel with floating cards */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          className="relative hidden aspect-square w-full max-w-md justify-self-center md:block"
        >
          <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-brand via-brand to-brand-dark shadow-[0_30px_80px_rgba(20,83,45,0.35)]" />
          <div className="absolute inset-0 rounded-[24px] bg-dots opacity-15" />

          {FLOATERS.map((f) => (
            <motion.div
              key={f.name}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.4 + f.delay }}
              className={`absolute ${f.className}`}
            >
              <div className="rounded-2xl border border-white/60 bg-white/95 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.2)] backdrop-blur">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.img}
                  alt={f.name}
                  className="mb-2 aspect-square w-full rounded-xl object-cover"
                />
                <p className="clamp-2 text-xs font-semibold text-ink">{f.name}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-brand">₹{f.price}</span>
                  <span className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-500">
                    <Star size={11} className="fill-amber-400 text-amber-400" /> 4.8
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
