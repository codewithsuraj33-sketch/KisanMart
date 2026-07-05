import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRight, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

type OrderItemSummary = {
  id: string
  product_name: string
  price: number
  quantity: number
}

type OrderSummary = {
  id: string
  created_at: string
  status: string
  payment_status: string
  total_amount: number
  order_items: OrderItemSummary[] | null
}

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  paid: 'bg-blue-50 text-blue-700 ring-blue-200',
  shipped: 'bg-violet-50 text-violet-700 ring-violet-200',
  delivered: 'bg-green-50 text-green-700 ring-green-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
}

function money(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value)
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // RLS: sirf apne orders (orders_select_own policy)
  const { data: orders } = await supabase
    .from('orders')
    .select('id, created_at, status, payment_status, total_amount, order_items(id, product_name, price, quantity)')
    .order('created_at', { ascending: false })

  const list = (orders ?? []) as OrderSummary[]

  if (list.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-zinc-800">Abhi koi order nahi</h1>
        <Link
          href="/products"
          className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          Shopping Shuru Karo
        </Link>
      </main>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-800">My Orders</h1>

      <div className="space-y-4">
        {list.map((order) => {
          const items = order.order_items ?? []
          const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0)

          return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="group block overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:border-green-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4 border-b border-zinc-100 bg-zinc-50/70 px-4 py-3">
                <div>
                  <p className="font-mono text-xs font-medium text-zinc-600">
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
                    statusStyles[order.status] ?? 'bg-zinc-100 text-zinc-700 ring-zinc-200'
                  }`}
                >
                  {order.status}
                </span>
              </div>

              <div className="divide-y divide-zinc-100 px-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
                      <Package size={19} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-800">
                        {item.product_name}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        Quantity: {item.quantity} · {money(Number(item.price))} each
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-zinc-700">
                      {money(Number(item.price) * item.quantity)}
                    </p>
                  </div>
                ))}

                {items.length === 0 && (
                  <p className="py-4 text-sm text-zinc-500">Product details available nahi hain.</p>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
                <p className="text-xs text-zinc-500">
                  {totalUnits} {totalUnits === 1 ? 'item' : 'items'} · Payment {order.payment_status}
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold text-zinc-900">
                    Total: {money(Number(order.total_amount))}
                  </p>
                  <ChevronRight
                    size={18}
                    className="text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-green-700"
                  />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
