'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ProductActionState = { error?: string; success?: string }

export async function submitReview(
  productId: string,
  _previousState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const rating = Number(formData.get('rating'))
  const title = String(formData.get('title') || '').trim()
  const comment = String(formData.get('comment') || '').trim()

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: '1 se 5 stars select karein.' }
  }
  if (comment.length < 10 || comment.length > 1000) {
    return { error: 'Review 10 se 1000 characters ke beech hona chahiye.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Review dene ke liye login karein.' }

  const { error } = await supabase.from('product_reviews').upsert(
    {
      product_id: productId,
      user_id: user.id,
      rating,
      title: title || null,
      comment,
    },
    { onConflict: 'product_id,user_id' }
  )

  if (error) return { error: 'Review save nahi hua. Commerce migration run hui hai, check karein.' }
  revalidatePath(`/products/${productId}`)
  return { success: 'Aapka review publish ho gaya.' }
}

export async function requestStockAlert(
  productId: string,
  _previousState: ProductActionState,
  _formData: FormData
): Promise<ProductActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Stock alert ke liye login karein.' }

  const { error } = await supabase
    .from('stock_alerts')
    .upsert({ user_id: user.id, product_id: productId }, { onConflict: 'user_id,product_id' })

  if (error) return { error: 'Alert save nahi hua.' }
  return { success: 'Product wapas stock mein aate hi alert milega.' }
}
