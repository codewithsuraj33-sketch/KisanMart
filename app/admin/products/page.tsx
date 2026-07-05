import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import AdminProductsTable from '@/components/admin-products-table'
import RealtimeRefresh from '@/components/realtime-refresh'
import { buttonClasses } from '@/components/ui/button'
import type { Product } from '@/lib/types'

export default async function AdminProductsPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('*, categories(name)')
    .order('created_at', { ascending: false })

  const list = (products ?? []) as Product[]

  return (
    <div className="mx-auto w-full max-w-7xl p-5 sm:p-8">
      <RealtimeRefresh tables={['products', 'categories']} />
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Catalog</p>
          <h1 className="mt-2 text-3xl font-extrabold text-ink">Products</h1>
          <p className="mt-1 text-sm text-body">{list.length} items in your catalog</p>
        </div>
        <Link href="/admin/products/new" className={buttonClasses('primary', 'md')}>
          <Plus size={17} /> Add product
        </Link>
      </div>

      <AdminProductsTable products={list} />
    </div>
  )
}
