'use client'

import Link from 'next/link'
import { Scale, Trash2 } from 'lucide-react'
import ProductImage from '@/components/product-image'
import { useCompare } from '@/components/compare-provider'
import { buttonClasses } from '@/components/ui/button'

export default function ComparePage() {
  const { products, toggle, clear } = useCompare()

  if (!products.length) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <Scale size={44} className="text-green-600" />
        <h1 className="text-2xl font-bold text-gray-900">Compare list khaali hai</h1>
        <p className="text-sm text-gray-500">2-3 products select karke side-by-side compare karein.</p>
        <Link href="/products" className={buttonClasses('primary', 'lg')}>Products Dekhein</Link>
      </main>
    )
  }

  const rows = [
    { label: 'Price', value: (p: (typeof products)[number]) => `₹${p.price}` },
    { label: 'MRP', value: (p: (typeof products)[number]) => (p.mrp ? `₹${p.mrp}` : '—') },
    { label: 'Rating', value: (p: (typeof products)[number]) => `${Number(p.rating_avg ?? 0).toFixed(1)} / 5` },
    { label: 'Stock', value: (p: (typeof products)[number]) => (p.stock > 0 ? `${p.stock} available` : 'Out of stock') },
    { label: 'Weight', value: (p: (typeof products)[number]) => `${p.weight_grams}g` },
  ]

  return (
    <div className="w-full flex-1 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Comparison</h1>
          <p className="text-sm text-gray-500">Maximum 3 products</p>
        </div>
        <button onClick={clear} className="flex items-center gap-1.5 text-sm text-red-600 hover:underline">
          <Trash2 size={15} /> Clear
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full min-w-[620px] table-fixed text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="w-32 p-4 text-left text-gray-500">Product</th>
              {products.map((product) => (
                <th key={product.id} className="p-4 align-top">
                  <ProductImage src={product.image_url} alt={product.name} className="mx-auto h-28 w-28 rounded-xl object-cover" />
                  <Link href={`/products/${product.id}`} className="mt-3 block font-semibold text-gray-900 hover:text-green-700">
                    {product.name}
                  </Link>
                  <button onClick={() => toggle(product)} className="mt-2 text-xs text-red-600 hover:underline">Remove</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-gray-100 last:border-0">
                <th className="bg-gray-50 p-4 text-left font-medium text-gray-600">{row.label}</th>
                {products.map((product) => (
                  <td key={product.id} className="p-4 text-center font-medium text-gray-800">{row.value(product)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
