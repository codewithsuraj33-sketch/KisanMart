import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Banknote, CalendarDays, Check, Download, MapPin, PackageCheck, Truck, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { money, statusProgress, TRACKING_STEPS } from '@/lib/commerce'
import ReturnRequestForm from '@/components/return-request-form'
import OrderActions from '@/components/order-actions'

type Params = Promise<{ id: string }>

type OrderItemRow = {
  id: string
  product_id: string | null
  product_name: string
  price: number
  quantity: number
}

type OrderStatusRow = {
  id: string
  status: string
  created_at: string
  note: string | null
}

type RefundRow = {
  status: string
  amount: number
  provider: string | null
  failure_reason: string | null
  updated_at: string
}

export default async function OrderPage({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: order },
    { data: items },
    { data: history },
    { data: activeReturn },
    { data: refund },
  ] = await Promise.all([
    supabase.from('orders').select('*').eq('id', id).single(),
    supabase
      .from('order_items')
      .select('id, product_id, product_name, price, quantity')
      .eq('order_id', id),
    supabase.from('order_status_history').select('*').eq('order_id', id).order('created_at'),
    supabase
      .from('return_requests')
      .select('id, status')
      .eq('order_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('refunds')
      .select('status, amount, provider, failure_reason, updated_at')
      .eq('order_id', id)
      .maybeSingle(),
  ])

  if (!order) notFound()
  const orderItems = (items ?? []) as OrderItemRow[]
  const orderHistory = (history ?? []) as OrderStatusRow[]
  const refundRow = refund as RefundRow | null
  const progress = statusProgress(order.status)
  const cancelled = order.status === 'cancelled'

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
      <div
        className={`rounded-2xl border p-5 ${cancelled ? 'border-danger/20 bg-danger/5' : 'border-brand/20 bg-brand/5'}`}
      >
        <div className="flex items-start gap-3">
          {cancelled ? <XCircle className="text-danger" /> : <PackageCheck className="text-brand" />}
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink">
              {cancelled
                ? 'Order cancelled'
                : order.status === 'delivered'
                  ? 'Order delivered'
                  : 'Order is on its way'}
            </h1>
            <p className="mt-1 text-sm text-body">
              Order #{order.id.slice(0, 8).toUpperCase()} ·{' '}
              {new Date(order.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      <OrderActions
        orderId={order.id}
        status={order.status}
        paymentStatus={order.payment_status}
        items={orderItems}
      />

      {!cancelled && (
        <section className="mt-5 rounded-2xl border border-line bg-card p-5 shadow-card">
          <h2 className="flex items-center gap-2 font-bold text-ink">
            <Truck size={18} className="text-brand" /> Shipment tracking
          </h2>
          <div className="mt-6 grid grid-cols-4">
            {TRACKING_STEPS.map((step, index) => {
              const done = progress >= index + 1
              return (
                <div key={step.key} className="relative flex flex-col items-center text-center">
                  <div
                    className={`absolute left-0 right-1/2 top-4 h-0.5 ${index === 0 ? 'hidden' : done ? 'bg-brand' : 'bg-line'}`}
                  />
                  <div
                    className={`absolute left-1/2 right-0 top-4 h-0.5 ${index === 3 ? 'hidden' : progress > index + 1 ? 'bg-brand' : 'bg-line'}`}
                  />
                  <span
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-brand text-white' : 'bg-sage text-muted'}`}
                  >
                    {done ? <Check size={16} /> : index + 1}
                  </span>
                  <span className={`mt-2 text-[11px] font-bold sm:text-sm ${done ? 'text-brand-dark' : 'text-muted'}`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="mt-5 grid gap-2 border-t border-line pt-4 text-sm text-body sm:grid-cols-2">
            {order.expected_delivery_date && (
              <p className="flex items-center gap-2">
                <CalendarDays size={15} className="text-brand" /> Expected by{' '}
                {new Date(`${order.expected_delivery_date}T12:00:00`).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            )}
            <p className="flex items-center gap-2">
              <Truck size={15} className="text-brand" />
              {order.awb_code ? `AWB ${order.awb_code}` : 'Tracking ID packing ke baad milegi'}
            </p>
          </div>
        </section>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-2xl border border-line bg-card p-5 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-bold text-ink">Order items</h2>
            <a href={`/api/orders/${id}/invoice`} className="flex items-center gap-1.5 text-xs font-bold text-brand">
              <Download size={15} /> Invoice PDF
            </a>
          </div>
          <div className="mt-3 divide-y divide-line">
            {orderItems.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">{item.product_name}</p>
                  <p className="text-xs text-muted">Qty {item.quantity}</p>
                </div>
                <span className="font-bold text-ink">{money(Number(item.price) * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-2 border-t border-line pt-4 text-sm text-body">
            <Price label="Subtotal" value={Number(order.subtotal ?? order.total_amount)} />
            <Price label="Shipping" value={Number(order.shipping_cost ?? 0)} />
            {Number(order.discount_amount) > 0 && (
              <Price label={`Coupon ${order.coupon_code ?? ''}`} value={-Number(order.discount_amount)} green />
            )}
            <div className="flex justify-between pt-2 text-lg font-extrabold text-ink">
              <span>Total</span>
              <span>{money(Number(order.total_amount))}</span>
            </div>
          </div>

          {order.status === 'delivered' && !activeReturn && (
            <ReturnRequestForm
              orderId={order.id}
              items={orderItems.map((item) => ({ id: item.id, product_name: item.product_name }))}
            />
          )}
          {activeReturn && (
            <Link href="/returns" className="mt-4 block rounded-xl bg-sage p-3 text-sm font-bold text-brand-dark">
              Return status: {activeReturn.status.replace('_', ' ')} →
            </Link>
          )}
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-line bg-card p-5 shadow-card">
            <h2 className="flex items-center gap-2 font-bold text-ink">
              <MapPin size={17} className="text-brand" /> Delivery address
            </h2>
            <p className="mt-3 text-sm font-semibold text-ink">
              {order.shipping_name} · {order.shipping_phone}
            </p>
            <p className="mt-1 text-sm leading-6 text-body">
              {order.shipping_address}, {order.shipping_city}, {order.shipping_state} — {order.shipping_pincode}
            </p>
          </section>

          <section className="rounded-2xl border border-line bg-card p-5 shadow-card">
            <h2 className="flex items-center gap-2 font-bold text-ink">
              <Banknote size={17} className="text-brand" /> Payment
            </h2>
            <p className="mt-3 text-sm capitalize text-body">
              {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online via Razorpay'}
            </p>
            <p className="mt-1 text-xs font-bold uppercase text-brand">
              {order.payment_status.replace('_', ' ')}
            </p>
          </section>

          {refundRow && (
            <section className="rounded-2xl border border-brand/20 bg-brand/5 p-5 shadow-card">
              <h2 className="font-bold text-ink">Refund tracker</h2>
              <p className="mt-3 text-sm font-semibold text-ink">
                {refundRow.status.replace('_', ' ')} · {money(Number(refundRow.amount))}
              </p>
              <p className="mt-1 text-xs text-body">Provider: {refundRow.provider ?? 'manual'}</p>
              {refundRow.failure_reason && <p className="mt-1 text-xs text-danger">{refundRow.failure_reason}</p>}
              <p className="mt-2 text-[11px] text-muted">
                Updated {new Date(refundRow.updated_at).toLocaleString('en-IN')}
              </p>
            </section>
          )}

          {orderHistory.length > 0 && (
            <section className="rounded-2xl border border-line bg-card p-5 shadow-card">
              <h2 className="font-bold text-ink">Order updates</h2>
              <div className="mt-3 space-y-3">
                {orderHistory.map((event) => (
                  <div key={event.id} className="border-l-2 border-brand/30 pl-3">
                    <p className="text-xs font-bold capitalize text-ink">{event.status}</p>
                    <p className="text-[11px] text-muted">
                      {new Date(event.created_at).toLocaleString('en-IN')}
                    </p>
                    {event.note && <p className="mt-0.5 text-xs text-body">{event.note}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/products" className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white">
          Continue shopping
        </Link>
        <Link href="/orders" className="rounded-xl border border-line px-5 py-2.5 text-sm font-bold text-ink">
          All orders
        </Link>
      </div>
    </main>
  )
}

function Price({ label, value, green = false }: { label: string; value: number; green?: boolean }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className={green ? 'font-bold text-brand' : ''}>{money(value)}</span>
    </div>
  )
}
