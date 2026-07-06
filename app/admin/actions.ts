'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/slugify'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ORDER_STATUSES } from '@/lib/commerce'
import { notifyCustomer } from '@/lib/notifications'

export type FormState = { error?: string }

// Har admin action mein pehle confirm karo ki caller sach mein admin hai.
// (Middleware bhi rokta hai, but actions directly bhi call ho sakte hain —
//  isliye double-check = defense in depth.)
async function requireAdmin(): Promise<{ supabase: SupabaseClient; ok: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, ok: false }
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  return { supabase, ok: !!profile?.is_admin }
}

type ProductData = {
  name: string
  description: string | null
  price: number
  mrp: number | null
  stock: number
  category_id: string | null
  image_url: string | null
  weight_grams: number
  is_active: boolean
}

// Form fields ko validate + parse karta hai
function parseProduct(formData: FormData): { data: ProductData } | { error: string } {
  const name = String(formData.get('name') || '').trim()
  if (!name) return { error: 'Product ka naam zaroori hai.' }

  const price = Number(formData.get('price'))
  if (!Number.isFinite(price) || price < 0) return { error: 'Price sahi daalo.' }

  const mrpRaw = String(formData.get('mrp') || '').trim()
  const mrp = mrpRaw ? Number(mrpRaw) : null
  if (mrp !== null && (!Number.isFinite(mrp) || mrp < 0)) {
    return { error: 'MRP sahi daalo.' }
  }

  const stock = parseInt(String(formData.get('stock') || '0'), 10)
  if (!Number.isInteger(stock) || stock < 0) return { error: 'Stock sahi daalo.' }

  const weight = parseInt(String(formData.get('weight_grams') || '500'), 10)

  return {
    data: {
      name,
      description: String(formData.get('description') || '').trim() || null,
      price,
      mrp,
      stock,
      category_id: String(formData.get('category_id') || '') || null,
      image_url: String(formData.get('image_url') || '').trim() || null,
      weight_grams: Number.isInteger(weight) && weight > 0 ? weight : 500,
      is_active: formData.get('is_active') === 'on',
    },
  }
}

// ---------------- CREATE ----------------
export async function createProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, ok } = await requireAdmin()
  if (!ok) return { error: 'Authorized nahi ho.' }

  const parsed = parseProduct(formData)
  if ('error' in parsed) return parsed

  // Unique slug (naam + short timestamp)
  const slug = `${slugify(parsed.data.name)}-${Date.now().toString(36).slice(-4)}`

  const { error } = await supabase.from('products').insert({ ...parsed.data, slug })
  if (error) return { error: error.message }

  revalidatePath('/admin/products')
  revalidatePath('/products')
  redirect('/admin/products')
}

// ---------------- UPDATE ----------------
export async function updateProduct(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase, ok } = await requireAdmin()
  if (!ok) return { error: 'Authorized nahi ho.' }

  const parsed = parseProduct(formData)
  if ('error' in parsed) return parsed

  const { error } = await supabase.from('products').update(parsed.data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/products')
  revalidatePath('/products')
  revalidatePath(`/products/${id}`)
  redirect('/admin/products')
}

// ---------------- DELETE ----------------
export async function deleteProduct(formData: FormData) {
  const { supabase, ok } = await requireAdmin()
  if (!ok) return

  const id = String(formData.get('id') || '')
  if (!id) return

  await supabase.from('products').delete().eq('id', id)
  revalidatePath('/admin/products')
  revalidatePath('/products')
}

// ---------------- ORDER STATUS ----------------
export async function updateOrderStatus(formData: FormData) {
  const { ok } = await requireAdmin()
  if (!ok) return

  const orderId = String(formData.get('order_id') || '')
  const status = String(formData.get('status') || '')
  if (!orderId || !ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) return

  const admin = createAdminClient()
  const { data: order } = await admin
    .from('orders')
    .select('id, user_id, status, shipping_phone, payment_method, payment_status')
    .eq('id', orderId)
    .single()
  if (!order || order.status === status) return

  // Delivered/cancelled are terminal states. Reviving them would make stock,
  // coupon and loyalty accounting inconsistent.
  if (['delivered', 'cancelled'].includes(order.status)) return
  const rank: Record<string, number> = { pending: 0, confirmed: 1, paid: 1, packed: 2, shipped: 3, delivered: 4 }
  if (status !== 'cancelled' && (rank[status] ?? 0) < (rank[order.status] ?? 0)) return
  if (status === 'cancelled') {
    const { error: releaseError } = await admin.rpc('release_order_inventory', { p_order_id: orderId })
    if (releaseError) return
  }

  await admin.from('orders').update({
    status,
    ...(status === 'delivered' && order.payment_method === 'cod' ? { payment_status: 'paid' } : {}),
    ...(status === 'cancelled' && order.payment_status === 'paid' ? { payment_status: 'refund_required' } : {}),
  }).eq('id', orderId)
  await admin.from('order_status_history').insert({
    order_id: orderId,
    status,
    note: String(formData.get('note') || '').trim() || `Status changed from ${order.status} to ${status}`,
  })
  if (status === 'delivered') await admin.rpc('award_order_loyalty', { p_order_id: orderId })
  if (order.user_id) {
    const messages: Record<string, string> = {
      confirmed: 'Aapka order confirm ho gaya hai.', paid: 'Payment confirm ho gaya hai.',
      packed: 'Aapka order pack ho gaya hai.', shipped: 'Aapka order delivery ke liye nikal gaya hai.',
      delivered: 'Order deliver ho gaya. KisanMart chunne ke liye dhanyavaad!',
      cancelled: 'Aapka order cancel kar diya gaya hai.', pending: 'Order pending review mein hai.',
    }
    await notifyCustomer({
      userId: order.user_id, title: `Order ${status}`,
      message: messages[status] ?? `Order status: ${status}`,
      kind: 'order', link: `/orders/${orderId}`, phone: order.shipping_phone,
    })
  }
  revalidatePath('/admin/orders')
  revalidatePath(`/orders/${orderId}`)
}

// ---------------- TOGGLE USER ADMIN ----------------
// Kisi user ko admin banana / admin hataana.
// NOTE: profiles pe RLS sirf "apni hi row update" allow karta hai, isliye
// dusre user ko update karne ke liye service-role (admin) client chahiye.
export async function toggleUserAdmin(formData: FormData) {
  const { supabase, ok } = await requireAdmin()
  if (!ok) return

  const userId = String(formData.get('user_id') || '')
  const makeAdmin = formData.get('make_admin') === 'true'
  if (!userId) return

  // Apne aap ko admin se hataane se roko (galti se lockout na ho)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user?.id === userId && !makeAdmin) return

  const admin = createAdminClient()
  await admin.from('profiles').update({ is_admin: makeAdmin }).eq('id', userId)
  revalidatePath('/admin/users')
}

// ---------------- RETURNS / REFUNDS ----------------
export async function updateReturnStatus(formData: FormData) {
  const { ok } = await requireAdmin()
  if (!ok) return
  const requestId = String(formData.get('request_id') || '')
  const status = String(formData.get('status') || '')
  const refundRaw = String(formData.get('refund_amount') || '').trim()
  const allowed = ['requested', 'approved', 'rejected', 'picked_up', 'refunded']
  if (!requestId || !allowed.includes(status)) return
  const refundAmount = refundRaw ? Number(refundRaw) : null
  if (refundAmount !== null && (!Number.isFinite(refundAmount) || refundAmount < 0)) return

  const admin = createAdminClient()
  const { data: request } = await admin.from('return_requests')
    .select('id, user_id, order_id').eq('id', requestId).single()
  if (!request) return
  await admin.from('return_requests').update({
    status,
    ...(refundAmount !== null ? { refund_amount: refundAmount } : {}),
  }).eq('id', requestId)
  await notifyCustomer({
    userId: request.user_id,
    title: `Return ${status.replace('_', ' ')}`,
    message: status === 'refunded'
      ? `Order #${request.order_id.slice(0, 8).toUpperCase()} ka refund process ho gaya hai.`
      : `Aapki return request ka status ab “${status.replace('_', ' ')}” hai.`,
    kind: 'return', link: '/returns',
  })
  revalidatePath('/admin/returns')
  revalidatePath('/returns')
}

export async function updateQuoteStatus(formData: FormData) {
  const { ok } = await requireAdmin()
  if (!ok) return
  const id = String(formData.get('quote_id') || '')
  const status = String(formData.get('status') || '')
  if (!id || !['new', 'contacted', 'quoted', 'closed'].includes(status)) return
  await createAdminClient().from('bulk_quote_requests').update({ status }).eq('id', id)
  revalidatePath('/admin/quotes')
}

// ---------------- COUPONS ----------------
export async function createCoupon(formData: FormData) {
  const { ok } = await requireAdmin()
  if (!ok) return
  const code = String(formData.get('code') || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '')
  const discountType = formData.get('discount_type') === 'flat' ? 'flat' : 'percentage'
  const discountValue = Number(formData.get('discount_value'))
  const minimum = Number(formData.get('min_order_amount') || 0)
  const maximumRaw = String(formData.get('max_discount') || '').trim()
  const limitRaw = String(formData.get('usage_limit') || '').trim()
  const expiresRaw = String(formData.get('expires_at') || '').trim()
  if (code.length < 3 || !Number.isFinite(discountValue) || discountValue <= 0 ||
      (discountType === 'percentage' && discountValue > 100) || !Number.isFinite(minimum) || minimum < 0) return
  await createAdminClient().from('coupons').insert({
    code, discount_type: discountType, discount_value: discountValue,
    min_order_amount: minimum,
    max_discount: maximumRaw ? Number(maximumRaw) : null,
    usage_limit: limitRaw ? Number(limitRaw) : null,
    expires_at: expiresRaw ? new Date(`${expiresRaw}T23:59:59`).toISOString() : null,
    is_active: true,
  })
  revalidatePath('/admin/coupons')
}

export async function toggleCoupon(formData: FormData) {
  const { ok } = await requireAdmin()
  if (!ok) return
  const id = String(formData.get('coupon_id') || '')
  const active = formData.get('active') === 'true'
  if (!id) return
  await createAdminClient().from('coupons').update({ is_active: active }).eq('id', id)
  revalidatePath('/admin/coupons')
}
