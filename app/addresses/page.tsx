import { redirect } from 'next/navigation'
import { MapPin, Star, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import AddressForm from '@/components/address-form'
import { deleteAddress, makeDefaultAddress } from './actions'
import type { Address } from '@/lib/types'

export default async function AddressesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data } = await supabase.from('addresses').select('*').order('is_default', { ascending: false }).order('created_at')
  const addresses = (data ?? []) as Address[]
  return <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6"><div className="mb-6"><p className="text-xs font-bold uppercase tracking-wider text-brand">My account</p><h1 className="mt-2 font-display text-3xl font-extrabold text-ink">Address book</h1><p className="mt-1 text-sm text-muted">Checkout ko faster banane ke liye multiple delivery addresses save karein.</p></div><div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]"><section className="space-y-3">{addresses.map((address) => <article key={address.id} className={`rounded-2xl border bg-card p-5 shadow-card ${address.is_default ? 'border-brand/30' : 'border-line'}`}><div className="flex items-start justify-between gap-3"><div><p className="flex items-center gap-2 font-bold text-ink"><MapPin size={17} className="text-brand" /> {address.label}{address.is_default && <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] uppercase text-brand">Default</span>}</p><p className="mt-3 text-sm font-semibold text-ink">{address.full_name} · {address.phone}</p><p className="mt-1 text-sm leading-6 text-body">{address.address_line}, {address.city}, {address.state} — {address.pincode}</p></div><form action={deleteAddress}><input type="hidden" name="id" value={address.id} /><button aria-label="Delete address" className="rounded-lg p-2 text-muted hover:bg-danger/5 hover:text-danger"><Trash2 size={17} /></button></form></div>{!address.is_default && <form action={makeDefaultAddress} className="mt-3"><input type="hidden" name="id" value={address.id} /><button className="flex items-center gap-1.5 text-xs font-bold text-brand"><Star size={14} /> Make default</button></form>}</article>)}{!addresses.length && <div className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">Abhi koi saved address nahi hai.</div>}</section><AddressForm /></div></main>
}
