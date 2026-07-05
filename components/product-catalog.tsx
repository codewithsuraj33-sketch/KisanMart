'use client'

import { useState } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import ProductCard from './product-card'
import type { Product } from '@/lib/types'

export default function ProductCatalog({ products, total }: { products: Product[]; total: number }) {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm text-body">Showing <span className="font-bold text-ink">{products.length}</span> of <span className="font-bold text-ink">{total}</span> products</p>
        <div className="flex rounded-xl border border-line bg-card p-1" aria-label="Product view">
          <button onClick={() => setView('grid')} aria-label="Grid view" className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${view === 'grid' ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}><LayoutGrid size={16} /></button>
          <button onClick={() => setView('list')} aria-label="List view" className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${view === 'list' ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}><List size={17} /></button>
        </div>
      </div>
      <div className={view === 'grid' ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7' : 'grid grid-cols-1 gap-4'}>
        {products.map((product) => <ProductCard key={product.id} product={product} layout={view} />)}
      </div>
    </div>
  )
}
