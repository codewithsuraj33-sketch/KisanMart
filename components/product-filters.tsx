'use client'

import { useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'

type Cat = { id: string; name: string }

const PRICE_OPTIONS = [
  { value: '', label: 'Any price' },
  { value: 'u200', label: 'Under ₹200' },
  { value: '200-500', label: '₹200 – ₹500' },
  { value: '500-1000', label: '₹500 – ₹1,000' },
  { value: 'o1000', label: 'Above ₹1,000' },
]

const SORT_OPTIONS = [
  { value: 'new', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
]

export default function ProductFilters({
  categories,
  current,
}: {
  categories: Cat[]
  current: { q?: string; category?: string; price?: string; sort?: string }
}) {
  const router = useRouter()

  function push(patch: Record<string, string | undefined>) {
    const merged: Record<string, string | undefined> = { ...current, ...patch }
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value)
    }
    router.push(params.size ? `/products?${params}` : '/products')
  }

  function onSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = String(new FormData(event.currentTarget).get('q') || '').trim()
    push({ q: query || undefined })
  }

  const activeCategory = categories.find((item) => item.id === current.category)
  const activePrice = PRICE_OPTIONS.find((item) => item.value === current.price)
  const hasFilters = Boolean(current.q || current.category || current.price || current.sort)
  const selectClass =
    'h-11 min-w-[160px] shrink-0 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10'

  return (
    <div className="rounded-2xl border border-line bg-card p-3 shadow-card sm:p-4">
      <div className="no-scrollbar flex items-center gap-3 overflow-x-auto">
        <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand lg:flex">
          <SlidersHorizontal size={18} />
        </span>

        <form onSubmit={onSearch} className="relative min-w-[220px] flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            key={current.q ?? 'all'}
            name="q"
            defaultValue={current.q}
            placeholder="Search products"
            className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-4 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
        </form>

        <select
          aria-label="Category"
          value={current.category ?? ''}
          onChange={(event) => push({ category: event.target.value || undefined })}
          className={selectClass}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>

        <select
          aria-label="Price range"
          value={current.price ?? ''}
          onChange={(event) => push({ price: event.target.value || undefined })}
          className={selectClass}
        >
          {PRICE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <select
          aria-label="Sort products"
          value={current.sort ?? 'new'}
          onChange={(event) => push({ sort: event.target.value === 'new' ? undefined : event.target.value })}
          className={selectClass}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push('/products')}
            className="h-11 shrink-0 rounded-xl px-3 text-xs font-bold text-brand transition hover:bg-brand/10"
          >
            Clear all
          </button>
        )}
      </div>

      {(current.q || activeCategory || activePrice) && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
          {current.q && <ActiveChip label={`“${current.q}”`} onRemove={() => push({ q: undefined })} />}
          {activeCategory && <ActiveChip label={activeCategory.name} onRemove={() => push({ category: undefined })} />}
          {activePrice && <ActiveChip label={activePrice.label} onRemove={() => push({ price: undefined })} />}
        </div>
      )}
    </div>
  )
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand-dark">
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remove ${label}`}>
        <X size={13} />
      </button>
    </span>
  )
}
