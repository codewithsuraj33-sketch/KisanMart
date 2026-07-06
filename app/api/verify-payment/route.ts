import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyCustomer } from '@/lib/notifications'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId } = body ?? {}
  if (![razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId].every(Boolean)) {
    return NextResponse.json({ error: 'Adhoori payment details' }, { status: 400 })
  }
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) return NextResponse.json({ error: 'Payment configuration missing' }, { status: 503 })

  const expected = crypto.createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex')
  const expectedBuffer = Buffer.from(expected)
  const receivedBuffer = Buffer.from(String(razorpay_signature))
  const validSignature = expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)

  const admin = createAdminClient()
  if (!validSignature) {
    await admin.from('orders').update({ payment_status: 'failed' }).eq('id', dbOrderId).eq('user_id', user.id)
    return NextResponse.json({ error: 'Payment verify fail' }, { status: 400 })
  }

  const { data: order } = await admin.from('orders').select('*').eq('id', dbOrderId).single()
  if (!order || order.user_id !== user.id || order.razorpay_order_id !== razorpay_order_id || order.payment_method !== 'online') {
    return NextResponse.json({ error: 'Order match nahi hua' }, { status: 400 })
  }
  if (order.payment_status === 'paid') return NextResponse.json({ ok: true })

  const { error: stockError } = await admin.rpc('reserve_order_inventory', { p_order_id: dbOrderId })
  if (stockError) {
    await admin.from('orders').update({ status: 'cancelled', payment_status: 'refund_required' }).eq('id', dbOrderId)
    await notifyCustomer({
      userId: user.id, title: 'Payment received — refund assistance needed',
      message: 'Payment ke samay stock khatam ho gaya. Hamari team refund ke liye aapse sampark karegi.',
      kind: 'payment', link: `/orders/${dbOrderId}`, email: user.email, phone: order.shipping_phone,
    })
    return NextResponse.json({ error: 'Payment hua lekin stock available nahi raha. Refund support notified.' }, { status: 409 })
  }

  const { error: updateError } = await admin.from('orders').update({
    payment_status: 'paid', status: 'confirmed', razorpay_payment_id,
  }).eq('id', dbOrderId)
  if (updateError) return NextResponse.json({ error: 'Order update nahi hua' }, { status: 500 })

  await admin.from('order_status_history').insert({
    order_id: dbOrderId, status: 'confirmed', note: 'Online payment verified',
  })
  await notifyCustomer({
    userId: user.id, title: 'Payment successful',
    message: `Order #${dbOrderId.slice(0, 8).toUpperCase()} confirm ho gaya hai.`,
    kind: 'payment', link: `/orders/${dbOrderId}`, email: user.email, phone: order.shipping_phone,
  })
  return NextResponse.json({ ok: true })
}
