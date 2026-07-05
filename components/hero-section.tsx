'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Leaf, ShieldCheck, Truck, Sprout, Star } from 'lucide-react'
import { buttonClasses } from './ui/button'

const FEATURES = [
  { icon: ShieldCheck, title: '100% Genuine', sub: 'Certified & Tested' },
  { icon: Truck, title: 'Fast Delivery', sub: 'On-Time, Every Time' },
  { icon: Sprout, title: 'Trusted by Farmers', sub: 'Across 50+ Districts' },
]

const HERO_IMG =
  'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=900&h=900&fit=crop'

const ease = 'easeOut' as const

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sage via-surface to-surface">
      {/* subtle dot texture on the right */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-dots opacity-70 md:block" />

      <div className="grid w-full items-center gap-10 px-4 py-14 sm:px-6 md:min-h-[88vh] md:grid-cols-2 md:gap-6 md:py-0 lg:px-10">
        {/* LEFT — copy */}
        <div className="relative z-10 mx-auto max-w-xl text-center md:mx-0 md:text-left">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="flex items-center justify-center gap-2 md:justify-start"
          >
            <Leaf size={22} className="text-brand" />
            <span className="font-script text-3xl leading-none text-brand sm:text-4xl">
              Farm Fresh Inputs
            </span>
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease, delay: 0.08 }}
            className="mt-3 font-display text-[2.9rem] font-extrabold leading-[1.04] text-brand-dark sm:text-6xl"
          >
            Grow more,
            <br />
            <span className="text-brand">harvest better.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease, delay: 0.16 }}
            className="mx-auto mt-5 max-w-md text-base leading-relaxed text-body sm:text-lg md:mx-0"
          >
            Quality-tested seeds, fertilizers, crop protection and tools — sourced
            from trusted manufacturers and delivered right to your farm.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease, delay: 0.24 }}
            className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start"
          >
            <Link href="/products" className={buttonClasses('primary', 'lg')}>
              Shop Now <ArrowRight size={18} />
            </Link>
            <Link href="/#categories" className={buttonClasses('outline', 'lg')}>
              Explore Categories
            </Link>
          </motion.div>

          {/* Feature badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease, delay: 0.32 }}
            className="mt-10 grid grid-cols-3 gap-3 border-t border-line pt-7"
          >
            {FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col items-center gap-2 text-center md:flex-row md:items-center md:gap-2.5 md:text-left">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <f.icon size={19} />
                </span>
                <span>
                  <span className="block text-[13px] font-bold text-ink">{f.title}</span>
                  <span className="block text-[11px] text-muted">{f.sub}</span>
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT — hero image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease, delay: 0.15 }}
          className="relative z-10 mx-auto w-full max-w-lg py-6 md:py-16"
        >
          <div className="relative aspect-square overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-[0_40px_90px_-30px_rgba(20,49,31,0.5)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HERO_IMG}
              alt="Fresh farm produce"
              className="h-full w-full object-cover"
            />
          </div>

          {/* floating "genuine" badge */}
          <div className="absolute -left-3 top-10 flex items-center gap-2 rounded-2xl bg-brand px-4 py-3 text-white shadow-[0_18px_40px_-12px_rgba(20,49,31,0.6)] sm:-left-6">
            <Leaf size={22} />
            <span className="leading-tight">
              <span className="block text-sm font-extrabold">100% Genuine</span>
              <span className="block text-[11px] text-white/80">Quality Assured</span>
            </span>
          </div>

          {/* floating rating card */}
          <div className="absolute -bottom-3 right-2 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_18px_40px_-12px_rgba(20,49,31,0.35)] sm:right-0">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Star size={20} className="fill-accent text-accent" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-extrabold text-ink">4.8 / 5 rating</span>
              <span className="block text-[11px] text-muted">10,000+ happy farmers</span>
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
