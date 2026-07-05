import { createAdminClient } from '@/lib/supabase/admin'
import AdminCustomersTable, { type AdminCustomerRow } from '@/components/admin-customers-table'

type Profile = {
  id: string
  full_name: string | null
  phone: string | null
  is_admin: boolean
  created_at: string
}

type CustomerOrder = {
  user_id: string | null
  total_amount: number
  payment_status: string
}

export default async function AdminUsersPage() {
  const admin = createAdminClient()
  const [{ data: profiles }, { data: authList }, { data: orders }] = await Promise.all([
    admin.from('profiles').select('*').order('created_at', { ascending: false }),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from('orders').select('user_id, total_amount, payment_status'),
  ])

  const emailById = new Map<string, string | null>(
    (authList?.users ?? []).map((user) => [user.id, user.email ?? null])
  )
  const orderStats = new Map<string, { count: number; spent: number }>()

  for (const order of (orders ?? []) as CustomerOrder[]) {
    if (!order.user_id) continue
    const current = orderStats.get(order.user_id) ?? { count: 0, spent: 0 }
    current.count += 1
    if (order.payment_status === 'paid') current.spent += Number(order.total_amount)
    orderStats.set(order.user_id, current)
  }

  const customers: AdminCustomerRow[] = ((profiles ?? []) as Profile[]).map((profile) => {
    const stats = orderStats.get(profile.id) ?? { count: 0, spent: 0 }
    return {
      ...profile,
      email: emailById.get(profile.id) ?? null,
      order_count: stats.count,
      amount_spent: stats.spent,
    }
  })
  const adminCount = customers.filter((customer) => customer.is_admin).length

  return (
    <div className="mx-auto w-full max-w-7xl p-5 sm:p-8">
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Accounts</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink">Customers</h1>
        <p className="mt-1 text-sm text-body">
          {customers.length} users · {adminCount} {adminCount === 1 ? 'admin' : 'admins'}
        </p>
      </div>

      <AdminCustomersTable customers={customers} />
    </div>
  )
}
