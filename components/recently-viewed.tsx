'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProductImage from './product-image'
import type { Product } from '@/lib/types'

type RecentProduct = Pick<Product, 'id' | 'name' | 'price' | 'image_url'>
const STORAGE_KEY = 'kisanmart_recently_viewed'

export function RecentlyViewedTracker({ product }: { product: RecentProduct }) {
  useEffect(() => {
    try {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as RecentProduct[]
      const next = [product, ...current.filter((item) => item.id !== product.id)].slice(0, 8)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [product])
  return null
}

export function RecentlyViewedProducts() {
  const [products, setProducts] = useState<RecentProduct[]>([])

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as RecentProduct[]
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProducts(stored)
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  if (!products.length) return null

  return (
    <section className="bg-gray-50 py-12">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <h2 className="text-2xl font-bold text-green-800">Recently Viewed</h2>
        <p className="mt-1 text-sm text-gray-500">Jin products ko aapne abhi dekha tha</p>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {products.slice(0, 5).map((product) => (
            <Link key={product.id} href={`/products/${product.id}`} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md">
              <ProductImage src={product.image_url} alt={product.name} className="aspect-square w-full object-cover" />
              <div className="p-3">
                <p className="line-clamp-2 text-xs font-semibold text-gray-800">{product.name}</p>
                <p className="mt-1 text-sm font-bold text-green-700">₹{product.price}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
