import Link from 'next/link'
import { Star } from 'lucide-react'
import ProductImage from './product-image'
import AddToCartButton from './add-to-cart-button'
import WishlistButton from './wishlist-button'
import CompareButton from './compare-button'
import type { Product } from '@/lib/types'

function formatWeight(grams: number) {
  return grams >= 1000 ? `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 1)} kg` : `${grams} g`
}

export default function ProductCard({ product, layout = 'grid' }: { product: Product; layout?: 'grid' | 'list' }) {
  const hasDiscount = product.mrp != null && product.mrp > product.price
  const outOfStock = product.stock <= 0
  const discountPct = hasDiscount ? Math.round(((product.mrp! - product.price) / product.mrp!) * 100) : 0
  const ratingCount = product.rating_count ?? 0
  const ratingAvg = Number(product.rating_avg ?? 0)

  return (
    <article className={`group overflow-hidden rounded-2xl border border-line bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift ${layout === 'list' ? 'grid grid-cols-[128px_1fr] sm:grid-cols-[190px_1fr]' : 'flex flex-col'}`}>
      <div className={`relative overflow-hidden bg-slate-50 ${layout === 'list' ? 'h-full min-h-44' : 'aspect-square'}`}>
        <Link href={`/products/${product.id}`} className="block h-full w-full">
          <ProductImage src={product.image_url} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </Link>
        {outOfStock ? (
          <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-semibold text-white">Out of stock</span>
        ) : product.categories?.name ? (
          <span className="absolute left-3 top-3 rounded-full bg-brand/90 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">{product.categories.name}</span>
        ) : null}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <WishlistButton productId={product.id} />
          <CompareButton product={product} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3.5">
        <Link href={`/products/${product.id}`} className="clamp-2 min-h-10 font-display text-sm font-semibold leading-5 text-ink transition hover:text-brand">{product.name}</Link>
        {ratingCount > 0 ? (
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-0.5">{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={12} className={star <= Math.round(ratingAvg) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />)}</span>
            <span className="text-[11px] text-muted">({ratingCount})</span>
          </div>
        ) : <span className="text-[11px] text-muted">No reviews yet</span>}
        <div><span className="inline-block rounded-full border border-line bg-surface px-2 py-0.5 text-[11px] font-medium text-body">{formatWeight(product.weight_grams)}</span></div>
        <div className="mt-auto pt-1">
          <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
            <span className="font-display text-lg font-extrabold text-brand">₹{product.price}</span>
            {hasDiscount && <><span className="text-xs text-muted line-through">₹{product.mrp}</span><span className="rounded-md bg-danger/10 px-1.5 py-0.5 text-[10px] font-bold text-danger">{discountPct}% OFF</span></>}
          </div>
          <AddToCartButton product={product} />
        </div>
      </div>
    </article>
  )
}
