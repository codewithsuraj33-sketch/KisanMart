import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calcShipping } from '@/lib/shipping'

// Browser se aane wale item ka shape (sirf id + quantity — price NAHI)
type IncomingItem = { id: string; quantity: number; variantId?: string | null }
type Shipping = {
  name: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
}

export async function POST(req: Request) {
  // 1) User logged in hona chahiye
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Login required' }, { status: 401 })
  }

  // 2) Body parse + basic validation
  const body = await req.json().catch(() => null)
  const items: IncomingItem[] = body?.items
  const shipping: Shipping = body?.shipping

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Cart khaali hai' }, { status: 400 })
  }
  const requiredFields: (keyof Shipping)[] = [
    'name',
    'phone',
    'address',
    'city',
    'state',
    'pincode',
  ]
  for (const f of requiredFields) {
    if (!shipping?.[f]?.trim()) {
      return NextResponse.json(
        { error: 'Saari address details bharo' },
        { status: 400 }
      )
    }
  }

  const admin = createAdminClient()

  // 3) Products DB se laao — asli price/stock yahin se, browser se NAHI
  const ids = items.map((i) => i.id)
  const { data: products, error: prodErr } = await admin
    .from('products')
    .select('id, name, price, stock, is_active')
    .in('id', ids)

  if (prodErr || !products) {
    return NextResponse.json({ error: 'Products load nahi hue' }, { status: 500 })
  }

  // 4) Total server-side compute + stock validate
  let itemsTotal = 0
  const orderItems: {
    product_id: string
    product_name: string
    price: number
    quantity: number
    variant_id: string | null
    variant_label: string | null
  }[] = []

  const variantIds = items.map((item) => item.variantId).filter((id): id is string => Boolean(id))
  const { data: variants } = variantIds.length
    ? await admin
        .from('product_variants')
        .select('id, product_id, label, price, stock, is_active')
        .in('id', variantIds)
    : { data: [] }

  const seenKeys = new Set<string>()

  for (const item of items) {
    const p = products.find((x) => x.id === item.id)
    if (!p) {
      return NextResponse.json({ error: 'Product nahi mila' }, { status: 400 })
    }
    if (!p.is_active) {
      return NextResponse.json({ error: `"${p.name}" ab available nahi hai` }, { status: 400 })
    }
    const qty = Number(item.quantity)
    if (!Number.isInteger(qty) || qty < 1) {
      return NextResponse.json({ error: 'Galat quantity' }, { status: 400 })
    }
    const variant = item.variantId
      ? variants?.find((candidate) => candidate.id === item.variantId && candidate.product_id === p.id)
      : null
    if (item.variantId && (!variant || !variant.is_active)) {
      return NextResponse.json({ error: `"${p.name}" ka selected pack nahi mila` }, { status: 400 })
    }
    const key = `${p.id}:${variant?.id ?? 'base'}`
    if (seenKeys.has(key)) {
      return NextResponse.json({ error: 'Duplicate cart item mila' }, { status: 400 })
    }
    seenKeys.add(key)

    const availableStock = variant?.stock ?? p.stock
    const unitPrice = Number(variant?.price ?? p.price)
    if (availableStock < qty) {
      return NextResponse.json(
        { error: `"${p.name}" ke liye itna stock nahi hai` },
        { status: 400 }
      )
    }
    itemsTotal += unitPrice * qty
    orderItems.push({
      product_id: p.id,
      product_name: p.name,
      price: unitPrice,
      quantity: qty,
      variant_id: variant?.id ?? null,
      variant_label: variant?.label ?? null,
    })
  }

  const shippingCost = calcShipping(itemsTotal)
  const total = itemsTotal + shippingCost

  // 5) Razorpay order banao (amount paise mein — isliye ×100)
  const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })

  let rzpOrder
  try {
    rzpOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: 'INR',
      receipt: `rcpt_${user.id.slice(0, 8)}_${Date.now()}`,
    })
  } catch {
    return NextResponse.json(
      { error: 'Payment gateway error. Razorpay keys check karo.' },
      { status: 500 }
    )
  }

  // 6) Apna order (pending) DB mein save karo
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({
      user_id: user.id,
      status: 'pending',
      total_amount: total,
      shipping_name: shipping.name,
      shipping_phone: shipping.phone,
      shipping_address: shipping.address,
      shipping_city: shipping.city,
      shipping_state: shipping.state,
      shipping_pincode: shipping.pincode,
      payment_status: 'pending',
      razorpay_order_id: rzpOrder.id,
    })
    .select('id')
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Order save nahi hua' }, { status: 500 })
  }

  // 7) Order items save karo
  const { error: itemsErr } = await admin
    .from('order_items')
    .insert(orderItems.map((oi) => ({ ...oi, order_id: order.id })))

  if (itemsErr) {
    return NextResponse.json({ error: 'Order items save nahi hue' }, { status: 500 })
  }

  // 8) Client ko Razorpay open karne ke liye zaroori data bhejo
  return NextResponse.json({
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    razorpayOrderId: rzpOrder.id,
    amount: Math.round(total * 100),
    currency: 'INR',
    dbOrderId: order.id,
    itemsTotal,
    shippingCost,
    total,
  })
}
