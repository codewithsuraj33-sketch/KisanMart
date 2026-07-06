import Link from 'next/link'
import { redirect } from 'next/navigation'
import { RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { money } from '@/lib/commerce'

export default async function ReturnsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: returns }, { data: refunds }] = await Promise.all([
    supabase
      .from('return_requests')
      .select('*, orders(total_amount), order_items(product_name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('refunds')
      .select('*, orders(total_amount), orders(status)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-wider text-brand">After-sales support</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">Returns & refunds</h1>

      <section className="mt-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-ink">Return requests</p>
            <p className="text-xs text-muted">Delivered orders ke requests yahan dikhenge.</p>
          </div>
          <p className="text-xs text-muted">{returns?.length ?? 0} requests</p>
        </div>

        <div className="mt-3 space-y-3">
          {(returns ?? []).map((item) => (
            <article key={item.id} className="rounded-2xl border border-line bg-card p-5 shadow-card">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-ink">{item.order_items?.product_name ?? 'Entire order'}</p>
                  <Link href={`/orders/${item.order_id}`} className="mt-1 block font-mono text-xs text-brand">
                    Order #{item.order_id.slice(0, 8).toUpperCase()}
                  </Link>
                </div>
                <span className="h-fit rounded-full bg-sage px-2.5 py-1 text-xs font-bold capitalize text-brand-dark">
                  {item.status.replace('_', ' ')}
                </span>
              </div>
              <p className="mt-3 text-sm text-body">{item.reason}</p>
              {item.refund_amount != null && (
                <p className="mt-2 text-sm font-bold text-brand">Refund: {money(Number(item.refund_amount))}</p>
              )}
              <p className="mt-3 text-xs text-muted">Requested {new Date(item.created_at).toLocaleDateString('en-IN')}</p>
            </article>
          ))}
          {!returns?.length && (
            <div className="rounded-2xl border border-dashed border-line py-14 text-center">
              <RotateCcw className="mx-auto text-muted" />
              <p className="mt-3 text-sm text-muted">Koi return request nahi hai.</p>
            </div>
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-ink">Refund tracker</p>
            <p className="text-xs text-muted">Cancelled prepaid orders aur processed refunds yahan show honge.</p>
          </div>
          <p className="text-xs text-muted">{refunds?.length ?? 0} refunds</p>
        </div>

        <div className="mt-3 space-y-3">
          {(refunds ?? []).map((item) => (
            <article key={item.id} className="rounded-2xl border border-line bg-card p-5 shadow-card">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-ink">{item.orders?.status === 'cancelled' ? 'Cancelled order refund' : 'Refund request'}</p>
                  <Link href={`/orders/${item.order_id}`} className="mt-1 block font-mono text-xs text-brand">
                    Order #{item.order_id.slice(0, 8).toUpperCase()}
                  </Link>
                </div>
                <span className="h-fit rounded-full bg-brand/10 px-2.5 py-1 text-xs font-bold capitalize text-brand-dark">
                  {item.status.replace('_', ' ')}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-body sm:grid-cols-2">
                <p>Amount: {money(Number(item.amount))}</p>
                <p>Provider: {item.provider ?? 'manual'}</p>
              </div>
              <p className="mt-2 text-sm text-body">{item.reason}</p>
              {item.failure_reason && <p className="mt-2 text-xs text-danger">{item.failure_reason}</p>}
              <p className="mt-3 text-xs text-muted">Updated {new Date(item.updated_at).toLocaleString('en-IN')}</p>
            </article>
          ))}
          {!refunds?.length && (
            <div className="rounded-2xl border border-dashed border-line py-14 text-center">
              <RotateCcw className="mx-auto text-muted" />
              <p className="mt-3 text-sm text-muted">Koi refund tracker nahi hai.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
