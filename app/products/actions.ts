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
  void _previousState
  void _formData
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

export async function createSubscription(
  productId: string,
  _previousState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const variantIdRaw = String(formData.get('variant_id') || '').trim()
  const addressId = String(formData.get('address_id') || '').trim()
  const frequencyDays = Number(formData.get('frequency_days') || 30)
  const quantity = Number(formData.get('quantity') || 1)
  const discountPercent = Number(formData.get('discount_percent') || 5)

  if (!addressId) return { error: 'Delivery address select karein.' }
  if (![15, 30, 45, 60, 90].includes(frequencyDays)) return { error: 'Frequency valid nahi hai.' }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) return { error: 'Quantity 1 se 20 ke beech honi chahiye.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Subscribe karne ke liye login karein.' }

  const [{ data: address }, { data: product }, { data: variant }] = await Promise.all([
    supabase.from('addresses').select('id').eq('id', addressId).eq('user_id', user.id).maybeSingle(),
    supabase.from('products').select('id, stock, is_active').eq('id', productId).maybeSingle(),
    variantIdRaw
      ? supabase
          .from('product_variants')
          .select('id, stock, is_active')
          .eq('id', variantIdRaw)
          .eq('product_id', productId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  if (!address) return { error: 'Selected address aapki nahi hai.' }
  if (!product?.is_active) return { error: 'Product subscription ke liye available nahi hai.' }
  if (variantIdRaw && !variant?.is_active) return { error: 'Selected variant active nahi hai.' }

  const nextOrderDate = new Date()
  nextOrderDate.setDate(nextOrderDate.getDate() + frequencyDays)

  const payload = {
    user_id: user.id,
    product_id: productId,
    variant_id: variantIdRaw || null,
    address_id: addressId,
    quantity,
    frequency_days: frequencyDays,
    discount_percent: discountPercent,
    status: 'active',
    next_order_date: nextOrderDate.toISOString().slice(0, 10),
    last_error: null,
  }

  let activeSubscriptionQuery = supabase
    .from('product_subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .in('status', ['active', 'paused'])

  activeSubscriptionQuery = variantIdRaw
    ? activeSubscriptionQuery.eq('variant_id', variantIdRaw)
    : activeSubscriptionQuery.is('variant_id', null)

  const activeSubscription = await activeSubscriptionQuery.maybeSingle()

  const operation = activeSubscription.data?.id
    ? supabase.from('product_subscriptions').update(payload).eq('id', activeSubscription.data.id)
    : supabase.from('product_subscriptions').insert(payload)

  const { error } = await operation
  if (error) return { error: 'Subscription save nahi hui.' }

  revalidatePath(`/products/${productId}`)
  revalidatePath('/settings')
  return { success: 'Subscribe & save enable ho gaya.' }
}
