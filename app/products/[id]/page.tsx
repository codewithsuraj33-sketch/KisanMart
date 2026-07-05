import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, Leaf, RotateCcw, ShieldCheck, Star, Truck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ProductGallery from '@/components/product-gallery'
import ProductActions from '@/components/product-actions'
import ProductReviews from '@/components/product-reviews'
import DeliveryChecker from '@/components/delivery-checker'
import WishlistButton from '@/components/wishlist-button'
import CompareButton from '@/components/compare-button'
import StickyProductBar from '@/components/sticky-product-bar'
import { RecentlyViewedTracker, RecentlyViewedProducts } from '@/components/recently-viewed'
import RealtimeRefresh from '@/components/realtime-refresh'
import type { Product, ProductVariant, ProductReview } from '@/lib/types'

type Params = Promise<{ id: string }>
const SHIPPING_INFO = [
  { icon: Truck, title: 'Free delivery', desc: 'On orders above ₹999' },
  { icon: ShieldCheck, title: 'Secure payment', desc: 'Razorpay protected' },
  { icon: Leaf, title: 'Quality checked', desc: 'Trusted manufacturers' },
  { icon: RotateCcw, title: 'Easy returns', desc: '7-day return window' },
]

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: product }, { data: variantRows }, { data: reviewRows }] = await Promise.all([
    supabase.from('products').select('*, categories(name)').eq('id', id).single(),
    supabase.from('product_variants').select('*').eq('product_id', id).eq('is_active', true).order('is_default', { ascending: false }).order('price', { ascending: true }),
    supabase.from('product_reviews').select('*').eq('product_id', id).order('created_at', { ascending: false }),
  ])
  if (!product) notFound()
  const p = product as Product
  const variants = (variantRows as ProductVariant[] | null) ?? []
  const reviews = (reviewRows as ProductReview[] | null) ?? []
  const hasDiscount = p.mrp != null && p.mrp > p.price
  const discountPct = hasDiscount ? Math.round(((p.mrp! - p.price) / p.mrp!) * 100) : 0
  const average = Number(p.rating_avg ?? 0)
  const reviewCount = p.rating_count ?? reviews.length

  return (
    <main className="flex-1 bg-surface pb-20">
      <RealtimeRefresh tables={['products']} />
      <RecentlyViewedTracker product={{ id: p.id, name: p.name, price: p.price, image_url: p.image_url }} />
      <div className="w-full px-4 py-8 sm:px-6 lg:px-10">
        <nav className="flex items-center gap-1.5 overflow-hidden text-xs font-semibold text-muted">
          <Link href="/" className="shrink-0 hover:text-brand">Home</Link><ChevronRight size={13} />
          <Link href="/products" className="shrink-0 hover:text-brand">Products</Link><ChevronRight size={13} />
          <span className="truncate text-body">{p.name}</span>
        </nav>

        <div className="mt-7 grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
          <div className="relative h-fit">
            <ProductGallery src={p.image_url} alt={p.name} />
            <div className="absolute right-4 top-4 z-10 flex flex-col gap-2"><WishlistButton productId={p.id} /><CompareButton product={p} /></div>
          </div>

          <div className="min-w-0">
            {p.categories?.name && <span className="inline-flex rounded-full border border-brand/15 bg-brand/10 px-3 py-1 text-xs font-bold text-brand">{p.categories.name}</span>}
            <h1 className="mt-3 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">{p.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 font-bold text-amber-700"><Star size={14} className="fill-accent text-accent" /> {average.toFixed(1)}</span>
              <a href="#reviews" className="font-medium text-body hover:text-brand">{reviewCount} verified reviews</a>
              <span className="text-line">|</span><span className="font-medium text-muted">{p.weight_grams >= 1000 ? `${p.weight_grams / 1000} kg` : `${p.weight_grams} g`}</span>
            </div>

            <div className="mt-6 flex flex-wrap items-baseline gap-3">
              <span className="font-display text-4xl font-extrabold text-brand">₹{p.price}</span>
              {hasDiscount && <><span className="text-lg text-muted line-through">₹{p.mrp}</span><span className="rounded-lg bg-danger/10 px-2 py-1 text-xs font-extrabold text-danger">SAVE {discountPct}%</span></>}
            </div>
            <p className="mt-1 text-xs text-muted">Inclusive of all taxes</p>

            <div className="mt-4">
              {p.stock <= 0 ? <span className="inline-flex rounded-full bg-danger/10 px-3 py-1 text-sm font-bold text-danger">Out of stock</span> : p.stock < 10 ? <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-sm font-bold text-amber-800"><span className="h-2 w-2 animate-pulse rounded-full bg-accent" /> Only {p.stock} left—order soon</span> : <span className="inline-flex items-center gap-2 text-sm font-bold text-brand"><span className="h-2 w-2 rounded-full bg-brand" /> In stock</span>}
            </div>

            {p.description && <div className="mt-6 border-t border-line pt-5"><h2 className="text-sm font-bold text-ink">Product details</h2><p className="mt-2 text-sm leading-7 text-body">{p.description}</p></div>}
            <ProductActions product={p} variants={variants} />
            <DeliveryChecker />
            <div className="mt-6 grid grid-cols-2 gap-3">
              {SHIPPING_INFO.map((item) => <div key={item.title} className="flex items-center gap-3 rounded-xl border border-line bg-card p-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"><item.icon size={17} /></span><div><p className="text-xs font-bold text-ink sm:text-sm">{item.title}</p><p className="text-[11px] text-muted sm:text-xs">{item.desc}</p></div></div>)}
            </div>
          </div>
        </div>

        <ProductReviews productId={p.id} reviews={reviews} average={average} />
      </div>
      <RecentlyViewedProducts />
      <StickyProductBar product={p} />
    </main>
  )
}
