import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/product-card'
import { buttonClasses } from '@/components/ui/button'
import type { Product } from '@/lib/types'

export default async function WishlistPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rows } = await supabase
    .from('wishlists')
    .select('products(*, categories(name))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const products = (rows ?? [])
    .map((row) => row.products as unknown as Product | null)
    .filter((product): product is Product => Boolean(product))

  return (
    <div className="w-full flex-1 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mb-7 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500">
          <Heart size={22} className="fill-red-500" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Products</h1>
          <p className="text-sm text-gray-500">{products.length} products aapki wishlist mein</p>
        </div>
      </div>

      {products.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">Wishlist abhi khaali hai.</p>
          <Link href="/products" className={`${buttonClasses('primary', 'md')} mt-4`}>
            Products Explore Karein
          </Link>
        </div>
      )}
    </div>
  )
}
