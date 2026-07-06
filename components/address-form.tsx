'use client'

import { useActionState } from 'react'
import { saveAddress, type AddressState } from '@/app/addresses/actions'

const initialState: AddressState = {}
const input = 'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10'

export default function AddressForm() {
  const [state, action, pending] = useActionState(saveAddress, initialState)
  return <form action={action} className="rounded-2xl border border-line bg-card p-5 shadow-card"><h2 className="font-display text-xl font-bold text-ink">Add a new address</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><input name="label" placeholder="Label (Home / Farm)" className={input} /><input name="full_name" required placeholder="Poora naam" className={input} /><input name="phone" required type="tel" placeholder="Phone" className={input} /><input name="address_line" required placeholder="House, street, village/area" className={`${input} sm:col-span-2`} /><input name="city" required placeholder="City / District" className={input} /><input name="state" required placeholder="State" className={input} /><input name="pincode" required pattern="[0-9]{6}" maxLength={6} placeholder="Pincode" className={input} /></div><label className="mt-4 flex items-center gap-2 text-sm text-body"><input type="checkbox" name="is_default" className="accent-brand" /> Default delivery address</label>{state.error && <p className="mt-3 text-sm text-danger">{state.error}</p>}{state.success && <p className="mt-3 text-sm text-brand">{state.success}</p>}<button disabled={pending} className="mt-4 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{pending ? 'Saving…' : 'Save address'}</button></form>
}
