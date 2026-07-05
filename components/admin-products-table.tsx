'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Package, Pencil, Search, SlidersHorizontal, X } from 'lucide-react'
import AdminSortHeader, { type SortDirection } from './admin-sort-header'
import DeleteProductButton from './delete-product-button'
import ProductImage from './product-image'
import type { Product } from '@/lib/types'

type SortKey = 'name' | 'category' | 'price' | 'stock' | 'status'

export default function AdminProductsTable({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [stock, setStock] = useState('all')
  const [status, setStatus] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [direction, setDirection] = useState<SortDirection>('asc')

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.categories?.name).filter(Boolean) as string[])].sort(),
    [products]
  )

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = products.filter((product) => {
      const matchesSearch = !query || product.name.toLowerCase().includes(query)
      const matchesCategory = category === 'all' || product.categories?.name === category
      const matchesStatus = status === 'all' || (status === 'active' ? product.is_active : !product.is_active)
      const matchesStock =
        stock === 'all' ||
        (stock === 'out' && product.stock === 0) ||
        (stock === 'low' && product.stock > 0 && product.stock < 10) ||
        (stock === 'available' && product.stock >= 10)
      return matchesSearch && matchesCategory && matchesStatus && matchesStock
    })

    return filtered.sort((a, b) => {
      let left: string | number | boolean
      let right: string | number | boolean
      if (sortKey === 'category') {
        left = a.categories?.name ?? ''
        right = b.categories?.name ?? ''
      } else if (sortKey === 'status') {
        left = a.is_active
        right = b.is_active
      } else {
        left = a[sortKey]
        right = b[sortKey]
      }
      const result = typeof left === 'string'
        ? left.localeCompare(String(right))
        : Number(left) - Number(right)
      return direction === 'asc' ? result : -result
    })
  }, [products, search, category, stock, status, sortKey, direction])

  function sortBy(key: SortKey) {
    if (sortKey === key) setDirection((value) => value === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setDirection('asc') }
  }

  const hasFilters = Boolean(search || category !== 'all' || stock !== 'all' || status !== 'all')
  const selectClass = 'h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-ink outline-none focus:border-brand'

  function clear() {
    setSearch(''); setCategory('all'); setStock('all'); setStatus('all')
  }

  return (
    <div>
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"><SlidersHorizontal size={17} /></span>
          <label className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product name" className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm text-ink outline-none focus:border-brand" /></label>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className={selectClass}><option value="all">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <select value={stock} onChange={(event) => setStock(event.target.value)} className={selectClass}><option value="all">All stock</option><option value="available">Available (10+)</option><option value="low">Low stock (1–9)</option><option value="out">Out of stock</option></select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className={selectClass}><option value="all">All statuses</option><option value="active">Active</option><option value="hidden">Hidden</option></select>
          {hasFilters && <button type="button" onClick={clear} className="flex h-10 shrink-0 items-center gap-1 rounded-xl px-3 text-xs font-bold text-danger hover:bg-danger/5"><X size={14} /> Clear</button>}
        </div>
      </div>

      <div className="mb-3 text-xs font-semibold text-muted">Showing {rows.length} of {products.length} products</div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line bg-sage text-xs font-bold uppercase tracking-wider text-brand-dark/60"><tr>
            <AdminSortHeader label="Product" active={sortKey === 'name'} direction={direction} onSort={() => sortBy('name')} />
            <AdminSortHeader label="Category" active={sortKey === 'category'} direction={direction} onSort={() => sortBy('category')} />
            <AdminSortHeader label="Price" active={sortKey === 'price'} direction={direction} onSort={() => sortBy('price')} />
            <AdminSortHeader label="Stock" active={sortKey === 'stock'} direction={direction} onSort={() => sortBy('stock')} />
            <AdminSortHeader label="Status" active={sortKey === 'status'} direction={direction} onSort={() => sortBy('status')} />
            <th className="px-5 py-4 text-right">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((product) => <tr key={product.id} className="transition hover:bg-slate-50/80"><td className="px-5 py-4"><div className="flex items-center gap-3"><ProductImage src={product.image_url} alt="" className="h-11 w-11 rounded-xl object-cover" /><span className="max-w-[240px] font-bold text-ink">{product.name}</span></div></td><td className="px-5 py-4 text-body">{product.categories?.name ?? '—'}</td><td className="px-5 py-4 font-bold text-ink">₹{product.price}</td><td className="px-5 py-4"><span className={product.stock === 0 ? 'font-bold text-danger' : product.stock < 10 ? 'font-bold text-amber-600' : 'text-body'}>{product.stock}</span></td><td className="px-5 py-4">{product.is_active ? <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand">Active</span> : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">Hidden</span>}</td><td className="px-5 py-4"><div className="flex justify-end gap-2"><Link href={`/admin/products/${product.id}/edit`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-brand/30 hover:text-brand" aria-label={`Edit ${product.name}`}><Pencil size={15} /></Link><DeleteProductButton id={product.id} /></div></td></tr>)}
            {!rows.length && <tr><td colSpan={6} className="px-5 py-16 text-center"><Package className="mx-auto text-slate-300" size={30} /><p className="mt-3 font-semibold text-slate-500">No products match these filters</p></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
