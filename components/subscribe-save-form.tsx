'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { CalendarDays, Clock3, Gift, MapPin, Repeat, Sparkles } from 'lucide-react'
import { createSubscription, type ProductActionState } from '@/app/products/actions'
import { useLanguage } from './language-provider'
import { money } from '@/lib/commerce'

type Address = {
  id: string
  label: string
  full_name: string
  address_line: string
  city: string
  state: string
  pincode: string
}

type Variant = {
  id: string
  label: string
  price: number
  stock: number
  is_default: boolean
}

const initialState: ProductActionState = {}
const defaultFrequencies = [15, 30, 45, 60, 90] as const

export default function SubscribeSaveForm({
  productId,
  productName,
  basePrice,
  canSubscribe,
  addresses,
  variants = [],
  defaultVariantId,
}: {
  productId: string
  productName: string
  basePrice: number
  canSubscribe: boolean
  addresses: Address[]
  variants?: Variant[]
  defaultVariantId?: string | null
}) {
  const { t } = useLanguage()
  const [state, action, pending] = useActionState(createSubscription.bind(null, productId), initialState)
  const [frequency, setFrequency] = useState<(typeof defaultFrequencies)[number]>(30)
  const [quantity, setQuantity] = useState(1)
  const [variantId, setVariantId] = useState(defaultVariantId ?? variants.find((variant) => variant.is_default)?.id ?? variants[0]?.id ?? '')
  const [addressId, setAddressId] = useState(addresses.find((address) => address.label.toLowerCase() === 'home')?.id ?? addresses[0]?.id ?? '')

  const selectedVariant = variants.find((variant) => variant.id === variantId)
  const activePrice = Number(selectedVariant?.price ?? basePrice)
  const savingAmount = Math.round(activePrice * quantity * 0.05)
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + frequency)

  if (!canSubscribe) {
    return (
      <section className="mt-6 rounded-2xl border border-brand/15 bg-brand/5 p-5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand shadow-sm">
            <Repeat size={20} />
          </span>
          <div>
            <h2 className="font-bold text-ink">{t('subscribeSave')}</h2>
            <p className="text-xs text-muted">Login ke baad recurring delivery setup karein.</p>
          </div>
        </div>
        <Link href="/login" className="mt-4 inline-flex rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white">
          Login to subscribe
        </Link>
      </section>
    )
  }

  return (
    <section className="mt-6 rounded-2xl border border-brand/15 bg-brand/5 p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand shadow-sm">
            <Gift size={20} />
          </span>
          <div>
            <h2 className="font-bold text-ink">{t('subscribeSave')}</h2>
            <p className="text-xs text-muted">Regular delivery aur repeat discount setup karein.</p>
          </div>
        </div>
        <div className="rounded-xl bg-white px-3 py-2 text-right shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted">Saving</p>
          <p className="text-sm font-extrabold text-brand-dark">Approx. {money(savingAmount)} / cycle</p>
        </div>
      </div>

      <form action={action} className="mt-5 space-y-4">
        <input type="hidden" name="variant_id" value={variantId} />
        <input type="hidden" name="discount_percent" value={5} />

        {variants.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Pack size</label>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setVariantId(variant.id)}
                  className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition ${variant.id === variantId ? 'border-brand bg-brand text-white' : 'border-line bg-white text-body hover:border-brand/30 hover:text-brand'}`}
                >
                  {variant.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
              <Clock3 size={14} /> Delivery frequency
            </label>
            <select value={frequency} onChange={(event) => setFrequency(Number(event.target.value) as typeof defaultFrequencies[number])} name="frequency_days" className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10">
              {defaultFrequencies.map((days) => (
                <option key={days} value={days}>
                  Every {days} days
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
              <CalendarDays size={14} /> Quantity
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Math.min(20, Number(event.target.value) || 1)))}
              name="quantity"
              className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
            <MapPin size={14} /> Delivery address
          </label>
          <select
            name="address_id"
            value={addressId}
            onChange={(event) => setAddressId(event.target.value)}
            className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
          >
            {addresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.label} - {address.city}, {address.state}
              </option>
            ))}
          </select>
          {addresses.length === 0 && <p className="mt-1.5 text-xs text-danger">Please add a delivery address first.</p>}
        </div>

        <div className="rounded-xl bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between text-sm text-body">
            <span>{productName}</span>
            <span className="font-semibold text-ink">₹{activePrice.toLocaleString('en-IN')}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted">
            <span>Next order</span>
            <span>{nextDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        {state.success && <p className="text-sm text-brand-dark">{state.success}</p>}

        <button
          type="submit"
          disabled={pending || !addressId}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          <Sparkles size={16} /> {pending ? 'Saving...' : t('subscribeSave')}
        </button>
      </form>
    </section>
  )
}
