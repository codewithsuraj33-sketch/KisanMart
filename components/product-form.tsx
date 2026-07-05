'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Save } from 'lucide-react'
import { buttonClasses } from './ui/button'
import type { Category, Product } from '@/lib/types'
import type { FormState } from '@/app/admin/actions'

export default function ProductForm({ action, categories, initial, submitLabel }: { action: (prev: FormState, formData: FormData) => Promise<FormState>; categories: Category[]; initial?: Product; submitLabel: string }) {
  const [state, formAction, pending] = useActionState(action, {})
  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10'
  const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500'
  return (
    <form action={formAction} className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className={labelClass}>Product name *</label><input name="name" required defaultValue={initial?.name} className={inputClass} /></div>
        <div className="sm:col-span-2"><label className={labelClass}>Category</label><select name="category_id" defaultValue={initial?.category_id ?? ''} className={inputClass}><option value="">No category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
        <div><label className={labelClass}>Selling price (₹) *</label><input name="price" type="number" step="0.01" min="0" required defaultValue={initial?.price} className={inputClass} /></div>
        <div><label className={labelClass}>MRP (₹)</label><input name="mrp" type="number" step="0.01" min="0" defaultValue={initial?.mrp ?? ''} className={inputClass} /></div>
        <div><label className={labelClass}>Stock *</label><input name="stock" type="number" min="0" required defaultValue={initial?.stock ?? 0} className={inputClass} /></div>
        <div><label className={labelClass}>Weight (grams)</label><input name="weight_grams" type="number" min="1" defaultValue={initial?.weight_grams ?? 500} className={inputClass} /></div>
        <div className="sm:col-span-2"><label className={labelClass}>Image URL</label><input name="image_url" type="url" placeholder="https://example.com/product.jpg" defaultValue={initial?.image_url ?? ''} className={inputClass} /><p className="mt-1.5 text-xs text-muted">Use a square, high-resolution product image for the best storefront result.</p></div>
        <div className="sm:col-span-2"><label className={labelClass}>Description</label><textarea name="description" rows={5} defaultValue={initial?.description ?? ''} className={`${inputClass} resize-y`} /></div>
      </div>
      <label className="mt-5 flex items-center gap-2.5 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-ink"><input name="is_active" type="checkbox" defaultChecked={initial ? initial.is_active : true} className="h-4 w-4 rounded border-slate-300 accent-brand" />Visible on storefront</label>
      {state.error && <p className="mt-5 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{state.error}</p>}
      <div className="mt-6 flex flex-wrap gap-3"><button type="submit" disabled={pending} className={buttonClasses('primary', 'md')}><Save size={16} /> {pending ? 'Saving…' : submitLabel}</button><Link href="/admin/products" className={buttonClasses('outline', 'md')}>Cancel</Link></div>
    </form>
  )
}
