'use client'

import { useMemo, useState } from 'react'
import { Search, Shield, SlidersHorizontal, User, Users, X } from 'lucide-react'
import { toggleUserAdmin } from '@/app/admin/actions'
import AdminSortHeader, { type SortDirection } from './admin-sort-header'

export type AdminCustomerRow = {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
  is_admin: boolean
  created_at: string
  order_count: number
  amount_spent: number
}

type SortKey = 'customer' | 'contact' | 'orders' | 'role' | 'joined'

export default function AdminCustomersTable({ customers }: { customers: AdminCustomerRow[] }) {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [activity, setActivity] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('joined')
  const [direction, setDirection] = useState<SortDirection>('desc')

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = customers.filter((customer) => {
      const searchable = `${customer.full_name ?? ''} ${customer.email ?? ''} ${customer.phone ?? ''}`.toLowerCase()
      const matchesRole = role === 'all' || (role === 'admin' ? customer.is_admin : !customer.is_admin)
      const matchesActivity = activity === 'all' || (activity === 'ordered' ? customer.order_count > 0 : customer.order_count === 0)
      return (!query || searchable.includes(query)) && matchesRole && matchesActivity
    })

    return filtered.sort((a, b) => {
      let left: string | number | boolean
      let right: string | number | boolean
      if (sortKey === 'customer') { left = a.full_name ?? ''; right = b.full_name ?? '' }
      else if (sortKey === 'contact') { left = a.email ?? ''; right = b.email ?? '' }
      else if (sortKey === 'orders') { left = a.order_count; right = b.order_count }
      else if (sortKey === 'role') { left = a.is_admin; right = b.is_admin }
      else { left = new Date(a.created_at).getTime(); right = new Date(b.created_at).getTime() }
      const result = typeof left === 'string' ? left.localeCompare(String(right)) : Number(left) - Number(right)
      return direction === 'asc' ? result : -result
    })
  }, [customers, search, role, activity, sortKey, direction])

  function sortBy(key: SortKey) {
    if (sortKey === key) setDirection((value) => value === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setDirection('asc') }
  }

  const hasFilters = Boolean(search || role !== 'all' || activity !== 'all')
  const selectClass = 'h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-ink outline-none focus:border-brand'

  return (
    <div>
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"><SlidersHorizontal size={17} /></span>
          <label className="relative min-w-[240px] flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or phone" className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm text-ink outline-none focus:border-brand" /></label>
          <select value={role} onChange={(event) => setRole(event.target.value)} className={selectClass}><option value="all">All roles</option><option value="customer">Customers</option><option value="admin">Admins</option></select>
          <select value={activity} onChange={(event) => setActivity(event.target.value)} className={selectClass}><option value="all">All activity</option><option value="ordered">Has orders</option><option value="none">No orders</option></select>
          {hasFilters && <button type="button" onClick={() => { setSearch(''); setRole('all'); setActivity('all') }} className="flex h-10 shrink-0 items-center gap-1 rounded-xl px-3 text-xs font-bold text-danger hover:bg-danger/5"><X size={14} /> Clear</button>}
        </div>
      </div>

      <div className="mb-3 text-xs font-semibold text-muted">Showing {rows.length} of {customers.length} users</div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500"><tr>
            <AdminSortHeader label="Customer" active={sortKey === 'customer'} direction={direction} onSort={() => sortBy('customer')} />
            <AdminSortHeader label="Contact" active={sortKey === 'contact'} direction={direction} onSort={() => sortBy('contact')} />
            <AdminSortHeader label="Orders" active={sortKey === 'orders'} direction={direction} onSort={() => sortBy('orders')} />
            <AdminSortHeader label="Role" active={sortKey === 'role'} direction={direction} onSort={() => sortBy('role')} />
            <AdminSortHeader label="Joined" active={sortKey === 'joined'} direction={direction} onSort={() => sortBy('joined')} />
            <th className="px-5 py-4 text-right">Action</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((customer) => <tr key={customer.id} className="transition hover:bg-slate-50/80"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500"><User size={16} /></span><span className="font-bold text-ink">{customer.full_name || 'Unnamed user'}</span></div></td><td className="px-5 py-4"><p className="text-body">{customer.email || '—'}</p><p className="mt-0.5 text-xs text-muted">{customer.phone || 'No phone'}</p></td><td className="px-5 py-4"><p className="font-bold text-ink">{customer.order_count} {customer.order_count === 1 ? 'order' : 'orders'}</p><p className="text-xs text-muted">₹{customer.amount_spent.toLocaleString('en-IN')} paid</p></td><td className="px-5 py-4">{customer.is_admin ? <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand"><Shield size={12} /> Admin</span> : <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600"><User size={12} /> Customer</span>}</td><td className="px-5 py-4 text-body">{new Date(customer.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td><td className="px-5 py-4 text-right"><form action={toggleUserAdmin}><input type="hidden" name="user_id" value={customer.id} /><input type="hidden" name="make_admin" value={customer.is_admin ? 'false' : 'true'} /><button type="submit" className={`rounded-lg px-3 py-2 text-xs font-bold transition ${customer.is_admin ? 'bg-danger/5 text-danger hover:bg-danger/10' : 'bg-brand/10 text-brand hover:bg-brand/15'}`}>{customer.is_admin ? 'Remove admin' : 'Make admin'}</button></form></td></tr>)}
            {!rows.length && <tr><td colSpan={6} className="px-5 py-16 text-center"><Users className="mx-auto text-slate-300" size={30} /><p className="mt-3 font-semibold text-slate-500">No users match these filters</p></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
