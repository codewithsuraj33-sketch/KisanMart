'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type WishlistContextValue = {
  savedIds: Set<string>
  ready: boolean
  toggle: (productId: string) => Promise<void>
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ids, setIds] = useState<string[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: rows } = await supabase
          .from('wishlists')
          .select('product_id')
          .eq('user_id', data.user.id)
        setIds((rows ?? []).map((row) => row.product_id))
      }
      setReady(true)
    })
  }, [])

  const toggle = useCallback(
    async (productId: string) => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const alreadySaved = ids.includes(productId)
      setIds((current) =>
        alreadySaved ? current.filter((id) => id !== productId) : [...current, productId]
      )

      const { error } = alreadySaved
        ? await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId)
        : await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId })

      if (error) {
        setIds((current) =>
          alreadySaved ? [...current, productId] : current.filter((id) => id !== productId)
        )
      }
    },
    [ids, router]
  )

  const value = useMemo(
    () => ({ savedIds: new Set(ids), ready, toggle }),
    [ids, ready, toggle]
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const value = useContext(WishlistContext)
  if (!value) throw new Error('useWishlist must be used inside WishlistProvider')
  return value
}
