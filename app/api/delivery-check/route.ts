import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const pincode = new URL(request.url).searchParams.get('pincode')?.trim() ?? ''
  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ available: false, message: 'Valid 6-digit pincode daalein.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from('serviceable_pincodes')
    .select('delivery_days, cod_available, is_active')
    .eq('pincode', pincode)
    .maybeSingle()

  // Listed pincodes can override serviceability; otherwise pan-India standard estimate.
  if (data && !data.is_active) {
    return NextResponse.json({ available: false, message: 'Is pincode par delivery abhi available nahi hai.' })
  }

  const days = data?.delivery_days ?? 4 + (Number(pincode.at(-1)) % 3)
  const expected = new Date()
  expected.setDate(expected.getDate() + days)

  return NextResponse.json({
    available: true,
    message: 'Delivery available',
    estimatedDate: expected.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    codAvailable: data?.cod_available ?? true,
  })
}
