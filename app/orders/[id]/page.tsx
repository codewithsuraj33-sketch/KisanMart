import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { CheckCircle2, Clock, XCircle, Truck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

type Params = Promise<{ id: string }>

// Tracking timeline ke steps
const TRACK_STEPS = [
  { key: 'placed', label: 'Order Placed' },
  { key: 'paid', label: 'Payment Done' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
]

export default async function OrderPage({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: order } = await supabase.from('orders').select('*').eq('id', id).single()
  if (!order) notFound()

  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', id)

  const isPaid = order.payment_status === 'paid'
  const isCancelled = order.status === 'cancelled'

  // Har step complete hai ya nahi
  const stepDone: Record<string, boolean> = {
    placed: true,
    paid: isPaid,
    shipped: ['shipped', 'delivered'].includes(order.status),
    delivered: order.status === 'delivered',
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      {/* Status banner */}
      <div
        className={`mb-6 flex items-center gap-3 rounded-xl p-4 ${
          isCancelled
            ? 'bg-red-50 text-red-700'
            : isPaid
              ? 'bg-green-50 text-green-700'
              : 'bg-amber-50 text-amber-700'
        }`}
      >
        {isCancelled ? (
          <XCircle size={28} />
        ) : isPaid ? (
          <CheckCircle2 size={28} />
        ) : (
          <Clock size={28} />
        )}
        <div>
          <h1 className="font-bold">
            {isCancelled
              ? 'Order Cancelled'
              : isPaid
                ? 'Order Confirmed! 🎉'
                : 'Payment Pending'}
          </h1>
          <p className="text-sm">
            {isCancelled
              ? 'Ye order cancel ho gaya hai.'
              : isPaid
                ? 'Aapka order mil gaya, jaldi hi ship hoga.'
                : 'Payment abhi complete nahi hua.'}
          </p>
        </div>
      </div>

      {/* Tracking timeline (cancelled na ho tab) */}
      {!isCancelled && (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-800">
            <Truck size={16} /> Order Tracking
          </h2>
          <div className="flex justify-between">
            {TRACK_STEPS.map((step, i) => {
              const done = stepDone[step.key]
              return (
                <div key={step.key} className="flex flex-1 flex-col items-center text-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      done ? 'bg-green-600 text-white' : 'bg-zinc-200 text-zinc-400'
                    }`}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  <span
                    className={`mt-1 text-[11px] ${
                      done ? 'text-zinc-700' : 'text-zinc-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Shiprocket AWB (jab integrate hoga tab AWB dikhega) */}
          <p className="mt-4 border-t border-zinc-100 pt-3 text-xs text-zinc-400">
            {order.awb_code
              ? `Tracking (AWB): ${order.awb_code}`
              : 'Shipping tracking number ship hone ke baad dikhega.'}
          </p>
        </div>
      )}

      {/* Order details */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex justify-between text-sm text-zinc-500">
          <span>Order ID</span>
          <span className="font-mono text-xs">{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm text-zinc-500">
          <span>Status</span>
          <span className="font-medium capitalize text-zinc-700">{order.status}</span>
        </div>

        <div className="mt-4 border-t border-zinc-200 pt-4">
          <h2 className="mb-2 text-sm font-semibold text-zinc-800">Items</h2>
          <div className="space-y-2">
            {items?.map((it) => (
              <div key={it.id} className="flex justify-between text-sm">
                <span className="text-zinc-600">
                  {it.product_name} × {it.quantity}
                </span>
                <span className="text-zinc-700">₹{it.price * it.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-between border-t border-zinc-200 pt-4 font-bold text-zinc-800">
          <span>Total</span>
          <span>₹{order.total_amount}</span>
        </div>

        <div className="mt-4 border-t border-zinc-200 pt-4 text-sm text-zinc-600">
          <h2 className="mb-1 font-semibold text-zinc-800">Delivery Address</h2>
          <p>
            {order.shipping_name} — {order.shipping_phone}
          </p>
          <p>
            {order.shipping_address}, {order.shipping_city}, {order.shipping_state} -{' '}
            {order.shipping_pincode}
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          href="/products"
          className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          Continue Shopping
        </Link>
        <Link
          href="/orders"
          className="rounded-lg border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          My Orders
        </Link>
      </div>
    </div>
  )
}
