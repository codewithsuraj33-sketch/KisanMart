'use client'

import { useActionState, useState } from 'react'
import { BadgeCheck, Star } from 'lucide-react'
import { submitReview, type ProductActionState } from '@/app/products/actions'
import { buttonClasses } from './ui/button'
import type { ProductReview } from '@/lib/types'

const initialState: ProductActionState = {}

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return <span className="inline-flex gap-0.5" aria-label={`${value} out of 5 stars`}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={size} className={star <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />)}</span>
}

export default function ProductReviews({ productId, reviews, average }: { productId: string; reviews: ProductReview[]; average: number }) {
  const [rating, setRating] = useState(5)
  const [state, action, pending] = useActionState(submitReview.bind(null, productId), initialState)
  const distribution = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((review) => review.rating === star).length }))

  return (
    <section className="mt-16 border-t border-line pt-12" id="reviews">
      <div className="mb-8"><p className="eyebrow">Customer feedback</p><h2 className="mt-2 text-3xl font-extrabold text-ink">Ratings &amp; reviews</h2></div>
      <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
        <div>
          <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
            <div className="flex items-end gap-2"><span className="font-display text-5xl font-extrabold text-ink">{average.toFixed(1)}</span><span className="pb-1.5 text-sm text-muted">out of 5</span></div>
            <div className="mt-2 flex items-center gap-2"><Stars value={average} size={19} /><span className="text-xs text-muted">{reviews.length} reviews</span></div>
            <div className="mt-5 space-y-2.5">
              {distribution.map((row) => { const width = reviews.length ? (row.count / reviews.length) * 100 : 0; return <div key={row.star} className="grid grid-cols-[24px_1fr_24px] items-center gap-2 text-xs font-semibold text-body"><span>{row.star}</span><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${width}%` }} /></div><span className="text-right text-muted">{row.count}</span></div> })}
            </div>
          </div>

          <form action={action} className="mt-4 space-y-3 rounded-2xl border border-line bg-card p-5 shadow-card">
            <h3 className="font-display font-bold text-ink">Share your experience</h3>
            <input type="hidden" name="rating" value={rating} />
            <div className="flex gap-1">{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" onClick={() => setRating(star)} aria-label={`${star} stars`}><Star size={23} className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} /></button>)}</div>
            <input name="title" maxLength={80} placeholder="Review title (optional)" className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" />
            <textarea name="comment" required minLength={10} maxLength={1000} rows={4} placeholder="Tell other farmers about this product…" className="w-full resize-none rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" />
            {state.error && <p className="text-xs font-medium text-danger">{state.error}</p>}{state.success && <p className="text-xs font-medium text-brand">{state.success}</p>}
            <button disabled={pending} className={buttonClasses('primary', 'sm')}>{pending ? 'Publishing…' : 'Submit review'}</button>
          </form>
        </div>

        <div className="space-y-4">
          {reviews.map((review) => <article key={review.id} className="rounded-2xl border border-line bg-card p-5 shadow-card"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-bold text-ink">{review.reviewer_name}</p>{review.is_verified && <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand"><BadgeCheck size={14} /> Verified buyer</span>}</div><div className="text-right"><Stars value={review.rating} /><p className="mt-1 text-xs text-muted">{new Date(review.created_at).toLocaleDateString('en-IN')}</p></div></div>{review.title && <h3 className="mt-4 font-semibold text-ink">{review.title}</h3>}<p className="mt-1 text-sm leading-6 text-body">{review.comment}</p></article>)}
          {!reviews.length && <div className="rounded-2xl border border-dashed border-line bg-card p-12 text-center"><Star className="mx-auto text-muted" size={26} /><h3 className="mt-3 font-bold text-ink">No reviews yet</h3><p className="mt-1 text-sm text-body">Be the first farmer to share an experience.</p></div>}
        </div>
      </div>
    </section>
  )
}
