'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyCustomer } from '@/lib/notifications'

export type ReturnState = { error?: string; success?: string }
export type OrderState = { error?: string; success?: string }

export async function cancelOrder(
  _previous: OrderState,
  formData: FormData
): Promise<OrderState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Login required.' }

  const orderId = String(formData.get('order_id') || '')
  const reason = String(formData.get('reason') || '').trim()
  if (!orderId) return { error: 'Order missing.' }

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, payment_status, payment_method, total_amount')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (!order) return { error: 'Order not found.' }
  if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
    return { error: 'Shipped/delivered order cancel nahi hota.' }
  }

  const refundRequired = order.payment_status === 'paid'
  const admin = createAdminClient()

  const { error } = await admin
    .from('orders')
    .update({
      status: 'cancelled',
      payment_status: refundRequired ? 'refund_required' : order.payment_status,
    })
    .eq('id', orderId)
    .eq('user_id', user.id)

  if (error) return { error: 'Order cancel nahi hua.' }

  if (refundRequired) {
    await admin.from('refunds').upsert(
      {
        order_id: orderId,
        user_id: user.id,
        amount: Number(order.total_amount),
        reason: reason || 'Customer cancellation',
        status: 'initiated',
        provider: order.payment_method === 'online' ? 'razorpay' : 'manual',
      },
      { onConflict: 'order_id' }
    )
  }

  await notifyCustomer({
    userId: user.id,
    title: 'Order cancelled',
    message: refundRequired
      ? `Order #${orderId.slice(0, 8).toUpperCase()} cancel ho gaya hai aur refund tracker create kar diya gaya hai.`
      : `Order #${orderId.slice(0, 8).toUpperCase()} cancel ho gaya hai.`,
    kind: 'order',
    link: '/returns',
    email: user.email,
  })

  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/orders')
  revalidatePath('/returns')
  return { success: refundRequired ? 'Cancellation request with refund tracker created.' : 'Order cancelled.' }
}

export async function requestReturn(_previous: ReturnState, formData: FormData): Promise<ReturnState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login required.' }
  const orderId = String(formData.get('order_id') || '')
  const itemId = String(formData.get('order_item_id') || '')
  const reason = String(formData.get('reason') || '').trim()
  const details = String(formData.get('details') || '').trim()
  if (!orderId || !reason) return { error: 'Return reason select karein.' }

  const [{ data: order }, { data: deliveredEvent }] = await Promise.all([
    supabase.from('orders').select('id, status, created_at').eq('id', orderId).eq('user_id', user.id).single(),
    supabase.from('order_status_history').select('created_at').eq('order_id', orderId).eq('status', 'delivered').order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])
  if (!order || order.status !== 'delivered') return { error: 'Sirf delivered order return ho sakta hai.' }
  if (itemId) {
    const { data: orderItem } = await supabase.from('order_items').select('id').eq('id', itemId).eq('order_id', orderId).maybeSingle()
    if (!orderItem) return { error: 'Selected item is order ka hissa nahi hai.' }
  }
  const deliveredAt = new Date(deliveredEvent?.created_at ?? order.created_at)
  const days = (Date.now() - deliveredAt.getTime()) / 86_400_000
  if (days > 30) return { error: 'Is order ki return window close ho gayi hai.' }

  const { data: existing } = await supabase.from('return_requests')
    .select('id').eq('order_id', orderId).eq('user_id', user.id).in('status', ['requested', 'approved', 'picked_up']).maybeSingle()
  if (existing) return { error: 'Is order ke liye return request pehle se active hai.' }

  const { error } = await supabase.from('return_requests').insert({
    order_id: orderId, order_item_id: itemId || null, user_id: user.id, reason, details: details || null,
  })
  if (error) return { error: 'Return request submit nahi hui.' }
  await notifyCustomer({
    userId: user.id, title: 'Return request received',
    message: `Order #${orderId.slice(0, 8).toUpperCase()} ki request review mein hai.`,
    kind: 'return', link: '/returns', email: user.email,
  })
  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/returns')
  return { success: 'Return request submit ho gayi. Team jaldi review karegi.' }
}
