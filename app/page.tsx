import Link from 'next/link'
import {
  Leaf,
  Truck,
  Wallet,
  ShieldCheck,
  RotateCcw,
  Headphones,
  Sprout,
  ArrowRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/product-card'
import CategoryCard from '@/components/category-card'
import HeroSection from '@/components/hero-section'
import StatsBar from '@/components/stats-bar'
import SectionHeader from '@/components/ui/section-header'
import Reveal from '@/components/ui/reveal'
import { buttonClasses } from '@/components/ui/button'
import type { Product, Category } from '@/lib/types'

const DEFAULT_CATEGORIES = [
  { slug: 'seeds', name: 'Seeds' },
  { slug: 'fertilizers', name: 'Fertilizers' },
  { slug: 'pesticides', name: 'Pesticides' },
  { slug: 'tools', name: 'Tools' },
  { slug: 'irrigation', name: 'Irrigation' },
]

// Thin trust band under the hero.
const STRIP = [
  { icon: ShieldCheck, title: '100% Genuine', sub: 'Certified products' },
  { icon: Truck, title: 'Free Delivery', sub: 'On orders ₹999+' },
  { icon: RotateCcw, title: 'Easy Returns', sub: '7-day window' },
  { icon: Wallet, title: 'Best Prices', sub: 'Direct sourcing' },
  { icon: Headphones, title: 'Expert Support', sub: 'Kisan helpline' },
]

const STORY = [
  { icon: Sprout, title: 'Sourced Responsibly', desc: 'Directly from trusted, verified manufacturers.' },
  { icon: ShieldCheck, title: 'Quality Guaranteed', desc: 'Every batch checked before it reaches your farm.' },
  { icon: Truck, title: 'Delivered Fast', desc: 'To your doorstep across 50+ districts.' },
]

const STORY_IMG =
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&h=1000&fit=crop'

export default async function Home() {
  const supabase = await createClient()

  const [{ data: products }, { data: categories }, { data: catRows }] = await Promise.all([
    supabase
      .from('products')
      .select('*, categories(name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10),
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
          image: c.image_url,
          count: countByCat.get(c.id),
        }))
      : DEFAULT_CATEGORIES.map((c) => ({
          href: '/products',
          slug: c.slug,
          name: c.name,
          image: null as string | null,
          count: undefined,
        }))

  return (
    <div className="flex flex-1 flex-col">
      <HeroSection />

      {/* Trust strip */}
      <section className="border-y border-line bg-card">
        <div className="grid w-full grid-cols-2 gap-x-4 gap-y-6 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:grid-cols-5 lg:px-10">
          {STRIP.map((s) => (
            <div key={s.title} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                <s.icon size={20} />
              </span>
              <span>
                <span className="block text-sm font-bold text-ink">{s.title}</span>
                <span className="block text-xs text-muted">{s.sub}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="w-full px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
        <Reveal>
          <SectionHeader
            eyebrow="Shop by Category"
            title="Best of the Farm, Handpicked"
            subtitle="From seeds to irrigation — everything your farm needs, from trusted makers."
            align="center"
          />
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categoryCards.map((c, i) => (
            <Reveal key={c.slug + c.href} delay={i * 0.06}>
              <CategoryCard href={c.href} image={c.image} label={c.name} count={c.count} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="bg-sage py-16 sm:py-20">
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {(products as Product[]).map((p, i) => (
                <Reveal key={p.id} delay={(i % 5) * 0.06}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-card p-12 text-center">
              <p className="text-body">
                No products yet. Run <code className="rounded bg-brand/10 px-1.5 py-0.5 text-brand">supabase/products.sql</code>.
              </p>
              <Link href="/products" className={`${buttonClasses('primary', 'md')} mt-4`}>
                Go to Products
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Our Story */}
      <section className="w-full px-4 py-16 sm:px-6 sm:py-24 lg:px-10">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal className="relative">
            <div className="overflow-hidden rounded-[2rem] border-4 border-white shadow-[0_40px_90px_-30px_rgba(20,49,31,0.45)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={STORY_IMG} alt="Golden harvest field" className="aspect-[4/3.4] w-full object-cover" />
            </div>
            <div className="absolute -bottom-5 -right-3 hidden items-center gap-3 rounded-2xl bg-brand px-5 py-4 text-white shadow-xl sm:flex lg:-right-5">
              <span className="font-display text-3xl font-extrabold leading-none">15+</span>
              <span className="text-xs font-medium leading-tight text-white/85">Years serving<br />Indian farmers</span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="flex items-center gap-2">
              <Leaf size={20} className="text-brand" />
              <span className="font-script text-3xl text-brand">Our Promise</span>
            </p>
            <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-brand-dark sm:text-[2.6rem]">
              From our farm family to yours
            </h2>
            <p className="mt-4 max-w-xl text-body">
              KisanMart exists to put honest, quality-tested farm inputs within every
              farmer&apos;s reach — at fair prices, with no fakes and no middlemen. When
              your crop thrives, we&apos;ve done our job.
            </p>

            <div className="mt-8 space-y-5">
              {STORY.map((s) => (
                <div key={s.title} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                    <s.icon size={20} />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold text-ink">{s.title}</h3>
                    <p className="text-sm text-body">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/products" className={`${buttonClasses('primary', 'lg')} mt-9`}>
              Start Shopping <ArrowRight size={18} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Stats band */}
      <StatsBar />

      {/* Newsletter */}
      <section className="w-full px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
        <Reveal className="relative overflow-hidden rounded-[2rem] bg-brand-dark px-6 py-14 shadow-[0_30px_80px_-30px_rgba(20,49,31,0.7)] sm:px-14">
          <div className="pointer-events-none absolute inset-0 bg-dots opacity-10" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="flex items-center gap-2 text-brand-light">
                <Leaf size={18} /> <span className="font-script text-2xl">Stay in the loop</span>
              </p>
              <h2 className="mt-2 font-display text-3xl font-extrabold text-white sm:text-4xl">
                Get 10% off your first order
              </h2>
              <p className="mt-3 max-w-lg text-sm text-white/70">
                Subscribe for seasonal crop tips, new arrivals and exclusive farmer-only deals.
              </p>
            </div>
            <form className="flex w-full flex-col gap-3 sm:flex-row" action="/products">
              <input
                type="email"
                required
                placeholder="Enter your email address"
                aria-label="Email address"
                className="h-12 flex-1 rounded-full border border-white/15 bg-white/10 px-5 text-sm text-white placeholder:text-white/50 outline-none transition focus:border-brand-light focus:bg-white/15"
              />
              <button type="submit" className={buttonClasses('accent', 'lg')}>
                Subscribe <ArrowRight size={17} />
              </button>
            </form>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
