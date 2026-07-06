import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = Promise<{ id: string }>

function ascii(value: unknown) {
  return String(value ?? '').replace(/₹/g, 'Rs. ').replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function makePdf(lines: Array<{ text: string; size?: number; bold?: boolean }>) {
  const stream: string[] = ['BT']
  let y = 800
  for (const line of lines) {
    const size = line.size ?? 11
    stream.push(`/${line.bold ? 'F2' : 'F1'} ${size} Tf`, `50 ${y} Td`, `(${ascii(line.text)}) Tj`, `-50 -${y} Td`)
    y -= size + 9
  }
  stream.push('ET')
  const content = stream.join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf))
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = Buffer.byteLength(pdf)
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return Buffer.from(pdf)
}

export async function GET(_request: Request, { params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })
  const { data: order } = await supabase.from('orders').select('*, order_items(*)').eq('id', id).single()
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  const lines: Array<{ text: string; size?: number; bold?: boolean }> = [
    { text: 'KisanMart - Tax Invoice / Receipt', size: 20, bold: true },
    { text: `Invoice: KM-${order.id.slice(0, 8).toUpperCase()}`, bold: true },
    { text: `Order date: ${new Date(order.created_at).toLocaleDateString('en-IN')}` },
    { text: `Payment: ${order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_status}` },
    { text: '' }, { text: 'Billed / Shipped to', size: 13, bold: true },
    { text: `${order.shipping_name} | ${order.shipping_phone}` },
    { text: `${order.shipping_address}, ${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}` },
    { text: '' }, { text: 'Items', size: 13, bold: true },
  ]
  for (const item of order.order_items ?? []) {
    lines.push({ text: `${item.product_name}${item.variant_label ? ` (${item.variant_label})` : ''} x ${item.quantity}    Rs. ${(Number(item.price) * item.quantity).toFixed(2)}` })
  }
  lines.push(
    { text: '' },
    { text: `Subtotal: Rs. ${Number(order.subtotal ?? order.total_amount).toFixed(2)}` },
    { text: `Shipping: Rs. ${Number(order.shipping_cost ?? 0).toFixed(2)}` },
    { text: `Coupon discount: Rs. ${Math.max(0, Number(order.discount_amount ?? 0) - Number(order.loyalty_discount ?? 0)).toFixed(2)}` },
    { text: `Rewards used: ${Number(order.loyalty_points_redeemed ?? 0)} points (Rs. ${Number(order.loyalty_discount ?? 0).toFixed(2)})` },
    { text: `Grand total: Rs. ${Number(order.total_amount).toFixed(2)}`, size: 14, bold: true },
    { text: '' }, { text: 'Thank you for shopping with KisanMart.' },
  )
  return new NextResponse(makePdf(lines), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="KisanMart-${order.id.slice(0, 8)}.pdf"` },
  })
}
