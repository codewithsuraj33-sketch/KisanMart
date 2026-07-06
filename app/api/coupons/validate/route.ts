import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const code = String(body?.code ?? '').trim().toUpperCase()
  const subtotal = Number(body?.subtotal)
  if (!code || !Number.isFinite(subtotal) || subtotal < 0) {
    return NextResponse.json({ error: 'Coupon aur cart total sahi bhejein' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: coupon } = await admin.from('coupons').select('*').eq('code', code).maybeSingle()
  if (!coupon || !coupon.is_active ||
      (coupon.expires_at && new Date(coupon.expires_at) <= new Date()) ||
      (coupon.usage_limit != null && Number(coupon.used_count) >= Number(coupon.usage_limit))) {
    return NextResponse.json({ error: 'Ye coupon valid nahi hai' }, { status: 404 })
  }
  if (subtotal < Number(coupon.min_order_amount)) {
    return NextResponse.json({
      error: `Is coupon ke liye minimum order ₹${Number(coupon.min_order_amount).toLocaleString('en-IN')} hai`,
    }, { status: 400 })
  }
  const raw = coupon.discount_type === 'flat'
    ? Number(coupon.discount_value)
    : subtotal * Number(coupon.discount_value) / 100
  const discount = Math.max(0, Math.min(raw, coupon.max_discount == null ? raw : Number(coupon.max_discount), subtotal))
  return NextResponse.json({ code, discount, message: `Coupon applied — ₹${discount.toLocaleString('en-IN')} saved` })
}
