'use client'

import { Trash2 } from 'lucide-react'
import { deleteProduct } from '@/app/admin/actions'

export default function DeleteProductButton({ id }: { id: string }) {
  return <form action={deleteProduct} onSubmit={(event) => { if (!confirm('Delete this product? This cannot be undone.')) event.preventDefault() }}><input type="hidden" name="id" value={id} /><button type="submit" aria-label="Delete product" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-danger/30 hover:bg-danger/5 hover:text-danger"><Trash2 size={15} /></button></form>
}
