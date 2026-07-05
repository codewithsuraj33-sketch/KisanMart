import Link from 'next/link'
import { Leaf, Truck, Wallet, ShieldCheck, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/product-card'
import CategoryCard from '@/components/category-card'
import HeroSection from '@/components/hero-section'
import StatsBar from '@/components/stats-bar'
import SectionHeader from '@/components/ui/section-header'
import Reveal from '@/components/ui/reveal'
import { buttonClasses } from '@/components/ui/button'
import type { Product, Category } from '@/lib/types'

const CATEGORY_ICONS: Record<string, string> = {
  seeds: '🌱',
  fertilizers: '🌿',
  pesticides: '🛡️',
  tools: '🔧',
  irrigation: '💧',
}

const DEFAULT_CATEGORIES = [
  { slug: 'seeds', name: 'Seeds' },
  { slug: 'fertilizers', name: 'Fertilizers' },
  { slug: 'pesticides', name: 'Pesticides' },
  { slug: 'tools', name: 'Tools' },
]

const WHY_US = [
  { icon: Leaf, title: 'Quality Tested', desc: 'Every product certified for reliable results.' },
  { icon: Truck, title: 'Fast Delivery', desc: 'Doorstep delivery across 50+ districts.' },
  { icon: Wallet, title: 'Best Prices', desc: 'Direct-from-manufacturer savings.' },
  { icon: ShieldCheck, title: 'Secure Payments', desc: 'Razorpay-protected checkout.' },
]

export default async function Home() {
  const supabase = await createClient()

  const [{ data: products }, { data: categories }, { data: catRows }] = await Promise.all([
    supabase
      .from('products')
      .select('*, categories(name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('categories').select('*').order('name'),
    supabase.from('products').select('category_id').eq('is_active', true),
  ])

  // Tally product counts per category (cheap — only category_id column).
  const countByCat = new Map<string, number>()
  for (const row of (catRows ?? []) as { category_id: string | null }[]) {
    if (row.category_id) countByCat.set(row.category_id, (countByCat.get(row.category_id) ?? 0) + 1)
  }

  const cats = (categories as Category[] | null) ?? []
  const categoryCards =
    cats.length > 0
      ? cats.map((c) => ({
          href: `/products?category=${c.id}`,
          slug: c.slug,
          name: c.name,
          count: countByCat.get(c.id),
        }))
      : DEFAULT_CATEGORIES.map((c) => ({
          href: '/products',
          slug: c.slug,
          name: c.name,
          count: undefined,
        }))

  return (
    <div className="flex flex-1 flex-col">
      <HeroSection />
      <StatsBar />

      {/* Categories */}
      <section id="categories" className="w-full px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
        <Reveal>
          <SectionHeader
            eyebrow="Shop by Category"
            title="Everything your farm needs"
            subtitle="From seeds to irrigation — sourced from trusted manufacturers."
          />
        </Reveal>

        <div className="no-scrollbar mt-10 -mx-4 flex gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {categoryCards.map((c, i) => (
            <Reveal
              key={c.slug + c.href}
              delay={i * 0.06}
              className="min-w-[220px] sm:min-w-0"
            >
              <CategoryCard
                href={c.href}
                icon={CATEGORY_ICONS[c.slug] ?? '🌾'}
                label={c.name}
                slug={c.slug}
                count={c.count}
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="bg-card py-16 sm:py-20">
        <div className="w-full px-4 sm:px-6 lg:px-10">
          <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <SectionHeader
              eyebrow="Our Catalog"
              title="Featured Products"
              subtitle="Fresh arrivals, handpicked for the season."
            />
            <Link
              href="/products"
              className="flex items-center gap-1.5 text-sm font-semibold text-brand transition hover:gap-2.5"
            >
              View all <ArrowRight size={16} />
            </Link>
          </Reveal>

          {products && products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
              {(products as Product[]).map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) * 0.06}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center">
              <p className="text-body">
                No products yet. Run <code className="rounded bg-brand/10 px-1.5 py-0.5 text-brand">supabase/seed.sql</code>.
              </p>
              <Link href="/products" className={`${buttonClasses('primary', 'md')} mt-4`}>
                Go to Products
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Why choose us */}
      <section className="w-full px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
        <Reveal>
          <SectionHeader
            eyebrow="Why KisanMart"
            title="Trusted by farmers"
            subtitle="Thousands of farmers rely on us every season."
            align="center"
          />
        </Reveal>
        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {WHY_US.map((w, i) => (
            <Reveal key={w.title} delay={i * 0.06}>
              <div className="h-full rounded-2xl border border-line bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                  <w.icon size={24} />
                </span>
                <h3 className="mt-4 font-display text-base font-bold text-ink">{w.title}</h3>
                <p className="mt-1 text-sm text-body">{w.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-card">
        <div className="w-full px-4 pb-20 sm:px-6 lg:px-10">
          <Reveal className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-dark px-6 py-12 text-center shadow-[0_30px_80px_rgba(20,83,45,0.3)] sm:px-12 sm:py-16">
            <div className="pointer-events-none absolute inset-0 bg-dots opacity-10" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl font-extrabold text-white sm:text-4xl">
                Ready to grow a better harvest?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-brand-light">
                Browse 500+ quality-tested products at the best prices in India.
              </p>
              <Link
                href="/products"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-brand-dark transition hover:scale-[1.02] active:scale-[0.97]"
              >
                Start Shopping <ArrowRight size={18} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
