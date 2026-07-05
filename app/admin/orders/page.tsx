import { createClient } from '@/lib/supabase/server'
import AdminOrdersTable, { type AdminOrderRow } from '@/components/admin-orders-table'
import RealtimeRefresh from '@/components/realtime-refresh'

export default async function AdminOrdersPage() {
  const supabase = await createClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  const list = (orders ?? []) as AdminOrderRow[]

  return (
    <div className="w-full p-5 sm:p-8 lg:px-10">
      <RealtimeRefresh tables={['orders']} />
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Fulfilment</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink">Orders</h1>
        <p className="mt-1 text-sm text-body">{list.length} total orders</p>
      </div>

      <AdminOrdersTable orders={list} />
    </div>
  )
}
