import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ProductForm from '@/components/product-form'
import { createProduct } from '@/app/admin/actions'
import type { Category } from '@/lib/types'

export default async function NewProductPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase.from('categories').select('*').order('name')
  return <div className="mx-auto w-full max-w-7xl p-5 sm:p-8"><nav className="flex items-center gap-1.5 text-xs font-semibold text-muted"><Link href="/admin/products" className="hover:text-brand">Products</Link><ChevronRight size={13} /><span>Add product</span></nav><div className="mb-7 mt-4"><h1 className="text-3xl font-extrabold text-ink">Add product</h1><p className="mt-1 text-sm text-body">Create a new catalog item for the storefront.</p></div><ProductForm action={createProduct} categories={(categories ?? []) as Category[]} submitLabel="Create product" /></div>
}
