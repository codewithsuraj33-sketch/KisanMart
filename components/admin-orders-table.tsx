'use client'

import { useMemo, useState } from 'react'
import { Search, ShoppingBag, SlidersHorizontal, X } from 'lucide-react'
import { updateOrderStatus } from '@/app/admin/actions'
import AdminSortHeader, { type SortDirection } from './admin-sort-header'

export type AdminOrderRow = {
  id: string
  created_at: string
  shipping_name: string
  shipping_phone: string
  shipping_city: string
  shipping_state: string
  total_amount: number
  payment_status: string
  status: string
}

type SortKey = 'order' | 'customer' | 'total' | 'payment' | 'status'
const STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']

export default function AdminOrdersTable({ orders }: { orders: AdminOrderRow[] }) {
  const [search, setSearch] = useState('')
  const [payment, setPayment] = useState('all')
  const [status, setStatus] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('order')
  const [direction, setDirection] = useState<SortDirection>('desc')

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = orders.filter((order) => {
      const searchable = `${order.id} ${order.shipping_name} ${order.shipping_phone} ${order.shipping_city} ${order.shipping_state}`.toLowerCase()
      return (!query || searchable.includes(query)) &&
        (payment === 'all' || order.payment_status === payment) &&
        (status === 'all' || order.status === status)
    })

    return filtered.sort((a, b) => {
      let left: string | number
      let right: string | number
      if (sortKey === 'order') { left = new Date(a.created_at).getTime(); right = new Date(b.created_at).getTime() }
      else if (sortKey === 'customer') { left = a.shipping_name; right = b.shipping_name }
      else if (sortKey === 'total') { left = Number(a.total_amount); right = Number(b.total_amount) }
      else if (sortKey === 'payment') { left = a.payment_status; right = b.payment_status }
      else { left = a.status; right = b.status }
      const result = typeof left === 'string' ? left.localeCompare(String(right)) : left - Number(right)
      return direction === 'asc' ? result : -result
    })
  }, [orders, search, payment, status, sortKey, direction])

  function sortBy(key: SortKey) {
    if (sortKey === key) setDirection((value) => value === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setDirection('asc') }
  }

  const hasFilters = Boolean(search || payment !== 'all' || status !== 'all')
  const selectClass = 'h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-ink outline-none focus:border-brand'

  return (
    <div>
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"><SlidersHorizontal size={17} /></span>
          <label className="relative min-w-[260px] flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ID, customer, phone or city" className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm text-ink outline-none focus:border-brand" /></label>
          <select value={payment} onChange={(event) => setPayment(event.target.value)} className={selectClass}><option value="all">All payments</option><option value="pending">Payment pending</option><option value="paid">Paid</option><option value="failed">Failed</option></select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className={selectClass}><option value="all">All fulfilment</option>{STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          {hasFilters && <button type="button" onClick={() => { setSearch(''); setPayment('all'); setStatus('all') }} className="flex h-10 shrink-0 items-center gap-1 rounded-xl px-3 text-xs font-bold text-danger hover:bg-danger/5"><X size={14} /> Clear</button>}
        </div>
      </div>

      <div className="mb-3 text-xs font-semibold text-muted">Showing {rows.length} of {orders.length} orders</div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-line bg-sage text-xs font-bold uppercase tracking-wider text-brand-dark/60"><tr>
            <AdminSortHeader label="Order" active={sortKey === 'order'} direction={direction} onSort={() => sortBy('order')} />
            <AdminSortHeader label="Customer" active={sortKey === 'customer'} direction={direction} onSort={() => sortBy('customer')} />
            <AdminSortHeader label="Total" active={sortKey === 'total'} direction={direction} onSort={() => sortBy('total')} />
            <AdminSortHeader label="Payment" active={sortKey === 'payment'} direction={direction} onSort={() => sortBy('payment')} />
            <AdminSortHeader label="Status" active={sortKey === 'status'} direction={direction} onSort={() => sortBy('status')} />
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((order) => <tr key={order.id} className="align-top transition hover:bg-slate-50/80"><td className="px-5 py-4"><p className="font-mono text-xs font-bold text-ink">#{order.id.slice(0, 8).toUpperCase()}</p><p className="mt-1 text-xs text-muted">{new Date(order.created_at).toLocaleDateString('en-IN')}</p></td><td className="px-5 py-4"><p className="font-bold text-ink">{order.shipping_name}</p><p className="mt-0.5 text-xs text-muted">{order.shipping_phone}</p><p className="text-xs text-muted">{order.shipping_city}, {order.shipping_state}</p></td><td className="px-5 py-4 font-extrabold text-ink">₹{order.total_amount}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${order.payment_status === 'paid' ? 'bg-brand/10 text-brand' : order.payment_status === 'failed' ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-amber-700'}`}>{order.payment_status}</span></td><td className="px-5 py-4"><form action={updateOrderStatus} className="flex items-center gap-2"><input type="hidden" name="order_id" value={order.id} /><select name="status" defaultValue={order.status} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-ink outline-none focus:border-brand">{STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}</select><button type="submit" className="rounded-lg bg-ink px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-700">Update</button></form></td></tr>)}
            {!rows.length && <tr><td colSpan={5} className="px-5 py-16 text-center"><ShoppingBag className="mx-auto text-slate-300" size={30} /><p className="mt-3 font-semibold text-slate-500">No orders match these filters</p></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
