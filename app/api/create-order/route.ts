import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calcShipping } from '@/lib/shipping'
import { expectedDeliveryDate } from '@/lib/commerce'
import { notifyCustomer } from '@/lib/notifications'

type IncomingItem = { id: string; quantity: number; variantId?: string | null }
type Shipping = {
  name: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
}

function couponDiscount(
  coupon: { discount_type: string; discount_value: number; max_discount: number | null },
  amount: number
) {
  const raw = coupon.discount_type === 'flat'
    ? Number(coupon.discount_value)
    : amount * Number(coupon.discount_value) / 100
  return Math.max(0, Math.min(raw, coupon.max_discount == null ? raw : Number(coupon.max_discount), amount))
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const items: IncomingItem[] = body?.items
  const shipping: Shipping = body?.shipping
  const paymentMethod = body?.paymentMethod === 'cod' ? 'cod' : 'online'
  const couponCode = String(body?.couponCode ?? '').trim().toUpperCase()

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Cart khaali hai' }, { status: 400 })
  }
  for (const field of ['name', 'phone', 'address', 'city', 'state', 'pincode'] as const) {
    if (!shipping?.[field]?.trim()) {
      return NextResponse.json({ error: 'Saari address details bharo' }, { status: 400 })
    }
  }
  if (!/^\d{6}$/.test(shipping.pincode)) {
    return NextResponse.json({ error: 'Valid 6-digit pincode daalo' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: serviceability } = await admin
    .from('serviceable_pincodes')
    .select('delivery_days, cod_available, is_active')
    .eq('pincode', shipping.pincode)
    .maybeSingle()
  if (serviceability && !serviceability.is_active) {
    return NextResponse.json({ error: 'Is pincode par delivery available nahi hai' }, { status: 400 })
  }
  if (paymentMethod === 'cod' && serviceability?.cod_available === false) {
    return NextResponse.json({ error: 'Is pincode par COD available nahi hai' }, { status: 400 })
  }

  const ids = items.map((item) => item.id)
  const { data: products, error: productsError } = await admin
    .from('products')
    .select('id, name, price, stock, is_active')
    .in('id', ids)
  if (productsError || !products) {
    return NextResponse.json({ error: 'Products load nahi hue' }, { status: 500 })
  }

  const variantIds = items.map((item) => item.variantId).filter((id): id is string => Boolean(id))
  const { data: variants } = variantIds.length
    ? await admin.from('product_variants').select('id, product_id, label, price, stock, is_active').in('id', variantIds)
    : { data: [] }

  let subtotal = 0
  const seen = new Set<string>()
  const orderItems: Array<{
    product_id: string; product_name: string; price: number; quantity: number
    variant_id: string | null; variant_label: string | null
  }> = []

  for (const item of items) {
    const product = products.find((row) => row.id === item.id)
    const quantity = Number(item.quantity)
    if (!product || !product.is_active) {
      return NextResponse.json({ error: 'Cart ka ek product available nahi hai' }, { status: 400 })
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return NextResponse.json({ error: 'Galat quantity' }, { status: 400 })
    }
    const variant = item.variantId
      ? variants?.find((row) => row.id === item.variantId && row.product_id === product.id)
      : null
    if (item.variantId && (!variant || !variant.is_active)) {
      return NextResponse.json({ error: `${product.name} ka selected pack nahi mila` }, { status: 400 })
    }
    const lineKey = `${product.id}:${variant?.id ?? 'base'}`
    if (seen.has(lineKey)) return NextResponse.json({ error: 'Duplicate cart item mila' }, { status: 400 })
    seen.add(lineKey)
    if (Number(variant?.stock ?? product.stock) < quantity) {
      return NextResponse.json({ error: `${product.name} ke liye itna stock nahi hai` }, { status: 400 })
    }
    const price = Number(variant?.price ?? product.price)
    subtotal += price * quantity
    orderItems.push({
      product_id: product.id,
      product_name: product.name,
      price,
      quantity,
      variant_id: variant?.id ?? null,
      variant_label: variant?.label ?? null,
    })
  }

  let discount = 0
  if (couponCode) {
    const { data: coupon } = await admin.from('coupons').select('*').eq('code', couponCode).maybeSingle()
    const invalid = !coupon || !coupon.is_active ||
      (coupon.expires_at && new Date(coupon.expires_at) <= new Date()) ||
      Number(coupon.min_order_amount) > subtotal ||
      (coupon.usage_limit != null && Number(coupon.used_count) >= Number(coupon.usage_limit))
    if (invalid) return NextResponse.json({ error: 'Coupon valid nahi hai ya conditions match nahi karti' }, { status: 400 })
    discount = couponDiscount(coupon, subtotal)
  }

  let loyaltyPointsRedeemed = 0
  if (body?.redeemPoints) {
    const { data: profile } = await admin.from('profiles').select('loyalty_points').eq('id', user.id).single()
    loyaltyPointsRedeemed = Math.max(0, Math.min(
      Number(profile?.loyalty_points ?? 0),
      Math.floor(subtotal * 0.2),
    ))
  }
  const loyaltyDiscount = loyaltyPointsRedeemed

  const shippingCost = calcShipping(subtotal)
  const total = Math.max(0, subtotal - discount - loyaltyDiscount + shippingCost)
  const deliveryDays = Number(serviceability?.delivery_days ?? 6)
  const { data: order, error: orderError } = await admin.from('orders').insert({
    user_id: user.id,
    status: paymentMethod === 'cod' ? 'confirmed' : 'pending',
    subtotal,
    shipping_cost: shippingCost,
    discount_amount: discount + loyaltyDiscount,
    loyalty_points_redeemed: loyaltyPointsRedeemed,
    loyalty_discount: loyaltyDiscount,
    coupon_code: couponCode || null,
    total_amount: total,
    shipping_name: shipping.name.trim(),
    shipping_phone: shipping.phone.trim(),
    shipping_address: shipping.address.trim(),
    shipping_city: shipping.city.trim(),
    shipping_state: shipping.state.trim(),
    shipping_pincode: shipping.pincode,
    payment_method: paymentMethod,
    payment_status: paymentMethod === 'cod' ? 'cod_pending' : 'pending',
    expected_delivery_date: expectedDeliveryDate(deliveryDays),
  }).select('id').single()
  if (orderError || !order) return NextResponse.json({ error: 'Order save nahi hua' }, { status: 500 })

  const { error: itemsError } = await admin.from('order_items').insert(
    orderItems.map((item) => ({ ...item, order_id: order.id }))
  )
  if (itemsError) {
    await admin.from('orders').delete().eq('id', order.id)
    return NextResponse.json({ error: 'Order items save nahi hue' }, { status: 500 })
  }

  if (body?.saveAddress) {
    await admin.from('addresses').insert({
      user_id: user.id,
      label: String(body?.addressLabel || 'Home').slice(0, 30),
      full_name: shipping.name.trim(), phone: shipping.phone.trim(),
      address_line: shipping.address.trim(), city: shipping.city.trim(),
      state: shipping.state.trim(), pincode: shipping.pincode,
      is_default: Boolean(body?.makeDefaultAddress),
    })
  }

  if (paymentMethod === 'cod') {
    const { error: stockError } = await admin.rpc('reserve_order_inventory', { p_order_id: order.id })
    if (stockError) {
      await admin.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Stock ab available nahi hai. Cart refresh karo.' }, { status: 409 })
    }
    await admin.from('order_status_history').insert({ order_id: order.id, status: 'confirmed', note: 'Cash on Delivery order confirmed' })
    await notifyCustomer({
      userId: user.id,
      title: 'Order confirmed',
      message: `Aapka COD order #${order.id.slice(0, 8).toUpperCase()} confirm ho gaya hai.`,
      kind: 'order', link: `/orders/${order.id}`, email: user.email, phone: shipping.phone,
    })
    return NextResponse.json({ ok: true, cod: true, dbOrderId: order.id, subtotal, shippingCost, discount, loyaltyDiscount, total })
  }

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    await admin.from('orders').delete().eq('id', order.id)
    return NextResponse.json({ error: 'Online payment abhi configured nahi hai. COD choose karein.' }, { status: 503 })
  }
  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100), currency: 'INR',
      receipt: `rcpt_${user.id.slice(0, 8)}_${Date.now()}`,
    })
    const { error: razorpaySaveError } = await admin.from('orders').update({ razorpay_order_id: razorpayOrder.id }).eq('id', order.id)
    if (razorpaySaveError) {
      await admin.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Payment order link save nahi hua. Dobara try karein.' }, { status: 500 })
    }
    return NextResponse.json({
      key: keyId, razorpayOrderId: razorpayOrder.id, amount: Math.round(total * 100),
      currency: 'INR', dbOrderId: order.id, subtotal, shippingCost, discount, loyaltyDiscount, total,
    })
  } catch {
    await admin.from('orders').delete().eq('id', order.id)
    return NextResponse.json({ error: 'Payment gateway error. COD try karein.' }, { status: 502 })
  }
}
