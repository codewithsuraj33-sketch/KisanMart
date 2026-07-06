'use client'

import { useActionState } from 'react'
import { submitQuote, type QuoteState } from '@/app/bulk-orders/actions'

const initialState: QuoteState = {}
const input = 'w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10'

export default function BulkQuoteForm() {
  const [state, action, pending] = useActionState(submitQuote, initialState)
  return <form action={action} className="rounded-3xl border border-line bg-card p-6 shadow-soft sm:p-8"><h2 className="font-display text-2xl font-extrabold text-ink">Get a bulk quote</h2><p className="mt-1 text-sm text-muted">Requirement bhejein—team volume price aur delivery plan share karegi.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><input name="name" required placeholder="Contact person *" className={input} /><input name="phone" required type="tel" placeholder="Phone number *" className={input} /><input name="email" type="email" placeholder="Email (optional)" className={input} /><input name="organisation" placeholder="FPO / farm / business name" className={input} /><textarea name="products_needed" required rows={3} placeholder="Kaunse products chahiye? *" className={`${input} sm:col-span-2`} /><input name="quantity_note" required placeholder="Approx. quantity *" className={input} /><input name="delivery_place" required placeholder="Delivery city / pincode *" className={input} /><textarea name="message" rows={3} placeholder="GST invoice, schedule ya koi special requirement" className={`${input} sm:col-span-2`} /></div>{state.error && <p className="mt-4 rounded-xl bg-danger/5 p-3 text-sm text-danger">{state.error}</p>}{state.success && <p className="mt-4 rounded-xl bg-brand/5 p-3 text-sm font-semibold text-brand">{state.success}</p>}<button disabled={pending} className="mt-5 rounded-xl bg-accent px-6 py-3 text-sm font-extrabold text-ink disabled:opacity-50">{pending ? 'Submitting…' : 'Request best price'}</button></form>
}
