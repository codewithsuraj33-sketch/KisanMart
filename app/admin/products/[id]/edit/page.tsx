import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ProductForm from '@/components/product-form'
import { updateProduct } from '@/app/admin/actions'
import type { Category, Product } from '@/lib/types'

type Params = Promise<{ id: string }>

export default async function EditProductPage({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: product }, { data: categories }] = await Promise.all([supabase.from('products').select('*').eq('id', id).single(), supabase.from('categories').select('*').order('name')])
  if (!product) notFound()
  const boundUpdate = updateProduct.bind(null, (product as Product).id)
  return <div className="mx-auto w-full max-w-7xl p-5 sm:p-8"><nav className="flex items-center gap-1.5 text-xs font-semibold text-muted"><Link href="/admin/products" className="hover:text-brand">Products</Link><ChevronRight size={13} /><span>Edit</span></nav><div className="mb-7 mt-4"><h1 className="text-3xl font-extrabold text-ink">Edit product</h1><p className="mt-1 text-sm text-body">Update {product.name} and save your changes.</p></div><ProductForm action={boundUpdate} categories={(categories ?? []) as Category[]} initial={product as Product} submitLabel="Update product" /></div>
}
