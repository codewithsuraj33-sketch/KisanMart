import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  // 1) User logged in?
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Login required' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    dbOrderId,
  } = body ?? {}

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !dbOrderId) {
    return NextResponse.json({ error: 'Adhoori payment details' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 2) SIGNATURE VERIFY — ye asli security hai.
  // Razorpay ne jo signature bheja = HMAC_SHA256(order_id|payment_id, secret)
  // Hum khud calculate karke compare karte hain. Match = payment asli hai.
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  if (expectedSignature !== razorpay_signature) {
    // Fake/tampered payment — order ko failed mark karo
    await admin
      .from('orders')
      .update({ payment_status: 'failed' })
      .eq('id', dbOrderId)
      .eq('user_id', user.id)
    return NextResponse.json({ error: 'Payment verify fail' }, { status: 400 })
  }

  // 3) Order fetch karo aur confirm karo ye isi user ka + isi razorpay order ka hai
  const { data: order } = await admin
    .from('orders')
    .select('*')
    .eq('id', dbOrderId)
    .single()

  if (
    !order ||
    order.user_id !== user.id ||
    order.razorpay_order_id !== razorpay_order_id
  ) {
    return NextResponse.json({ error: 'Order match nahi hua' }, { status: 400 })
  }

  // Already paid? (double-call safety) — kuch mat karo, success bhej do
  if (order.payment_status === 'paid') {
    return NextResponse.json({ ok: true })
  }

  // 4) Order ko paid mark karo
  await admin
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'paid',
      razorpay_payment_id,
    })
    .eq('id', dbOrderId)

  // 5) Har item ka stock kam karo (RPC function se)
  const { data: orderItems } = await admin
    .from('order_items')
    .select('product_id, variant_id, quantity')
    .eq('order_id', dbOrderId)

  for (const oi of orderItems ?? []) {
    if (oi.variant_id) {
      await admin.rpc('decrement_variant_stock', {
        p_variant_id: oi.variant_id,
        p_qty: oi.quantity,
      })
    } else if (oi.product_id) {
      await admin.rpc('decrement_stock', {
        p_product_id: oi.product_id,
        p_qty: oi.quantity,
      })
    }
  }

  return NextResponse.json({ ok: true })
}
