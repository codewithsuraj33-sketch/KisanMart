'use client'

import { useActionState } from 'react'
import { requestReturn, type ReturnState } from '@/app/orders/actions'

const initialState: ReturnState = {}

export default function ReturnRequestForm({ orderId, items }: { orderId: string; items: Array<{ id: string; product_name: string }> }) {
  const [state, action, pending] = useActionState(requestReturn, initialState)
  return <details className="mt-5 rounded-xl border border-line bg-surface p-4"><summary className="cursor-pointer text-sm font-bold text-ink">Request a return / refund</summary><form action={action} className="mt-4 space-y-3"><input type="hidden" name="order_id" value={orderId} /><select name="order_item_id" className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm"><option value="">Entire order</option>{items.map((item) => <option key={item.id} value={item.id}>{item.product_name}</option>)}</select><select name="reason" required className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm"><option value="">Return reason</option><option>Damaged product</option><option>Wrong product delivered</option><option>Quality issue</option><option>Missing items</option><option>Changed my mind</option></select><textarea name="details" rows={3} placeholder="Problem ke baare mein aur batayein" className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand" />{state.error && <p className="text-sm text-danger">{state.error}</p>}{state.success && <p className="text-sm text-brand">{state.success}</p>}<button disabled={pending} className="rounded-xl bg-ink px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{pending ? 'Submitting…' : 'Submit return request'}</button></form></details>
}
