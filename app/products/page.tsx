import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ProductCatalog from '@/components/product-catalog'
import ProductFilters from '@/components/product-filters'
import RealtimeRefresh from '@/components/realtime-refresh'
import { buttonClasses } from '@/components/ui/button'
import type { Product, Category } from '@/lib/types'

type SearchParams = Promise<{ q?: string; category?: string; price?: string; sort?: string }>
const PRICE_RANGES = [
  { key: 'u200', min: 0, max: 200 },
  { key: '200-500', min: 200, max: 500 },
  { key: '500-1000', min: 500, max: 1000 },
  { key: 'o1000', min: 1000, max: null },
] as const

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, category, price, sort } = await searchParams
  const supabase = await createClient()
  const [{ data: categories }, { count: totalCount }] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ])
  let query = supabase.from('products').select('*, categories(name)').eq('is_active', true)
  if (q) query = query.ilike('name', `%${q}%`)
  if (category) query = query.eq('category_id', category)
  const range = PRICE_RANGES.find((item) => item.key === price)
  if (range) { query = query.gte('price', range.min); if (range.max != null) query = query.lte('price', range.max) }
  if (sort === 'price_asc') query = query.order('price', { ascending: true })
  else if (sort === 'price_desc') query = query.order('price', { ascending: false })
  else query = query.order('created_at', { ascending: false })
  const { data: products } = await query
  const list = (products as Product[] | null) ?? []
  const cats = (categories as Category[] | null) ?? []

  return (
    <main className="flex-1 bg-surface">
      <RealtimeRefresh tables={['products', 'categories']} />
      <section className="border-b border-brand/10 bg-card">
        <div className="w-full px-4 py-10 sm:px-6 sm:py-12 lg:px-10">
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-muted"><Link href="/" className="hover:text-brand">Home</Link><ChevronRight size={13} /><span className="text-body">Products</span></nav>
          <p className="eyebrow mt-6">Quality farm inputs</p>
          <h1 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">Products for every growing season</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-body">Quality-tested seeds, nutrition, crop protection and tools—chosen for Indian farms.</p>
        </div>
      </section>
      <section className="w-full px-4 py-8 sm:px-6 lg:px-10">
        <ProductFilters categories={cats} current={{ q, category, price, sort }} />
        <div className="mt-7">
          {list.length ? <ProductCatalog products={list} total={totalCount ?? list.length} /> : (
            <div className="rounded-2xl border border-dashed border-line bg-card p-12 text-center"><h2 className="text-xl font-bold text-ink">No matching products</h2><p className="mt-2 text-sm text-body">Try a different category, price range or search term.</p><Link href="/products" className={`${buttonClasses('outline', 'md')} mt-5`}>Clear filters</Link></div>
          )}
        </div>
      </section>
    </main>
  )
}
