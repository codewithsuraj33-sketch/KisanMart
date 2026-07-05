import Link from 'next/link'
import { ArrowUpRight, IndianRupee, Package, ShoppingBag, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import RealtimeRefresh from '@/components/realtime-refresh'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const [{ count: productCount }, { count: orderCount }, { count: customerCount }, { data: paidOrders }] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', false),
    supabase.from('orders').select('total_amount').eq('payment_status', 'paid'),
  ])
  const revenue = (paidOrders ?? []).reduce((sum, order) => sum + Number(order.total_amount), 0)
  const stats = [
    { label: 'Total orders', value: orderCount ?? 0, icon: ShoppingBag, top: 'from-sky-500 to-blue-600', iconBg: 'bg-sky-50 text-sky-600' },
    { label: 'Paid revenue', value: `₹${revenue.toLocaleString('en-IN')}`, icon: IndianRupee, top: 'from-emerald-500 to-green-600', iconBg: 'bg-emerald-50 text-emerald-600' },
    { label: 'Products', value: productCount ?? 0, icon: Package, top: 'from-amber-400 to-amber-600', iconBg: 'bg-amber-50 text-amber-600' },
    { label: 'Customers', value: customerCount ?? 0, icon: Users, top: 'from-violet-500 to-purple-600', iconBg: 'bg-violet-50 text-violet-600' },
  ]
  return (
    <div className="w-full p-5 sm:p-8 lg:px-10">
      <RealtimeRefresh tables={['products', 'orders']} />
      <div className="mb-7"><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Business overview</p><h1 className="mt-2 text-3xl font-extrabold text-ink">Dashboard</h1><p className="mt-1 text-sm text-body">A quick pulse check on your KisanMart store.</p></div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((item) => <article key={item.label} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-card"><div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.top}`} /><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconBg}`}><item.icon size={21} /></span><p className="mt-5 font-display text-2xl font-extrabold text-ink sm:text-3xl">{item.value}</p><p className="mt-1 text-xs font-semibold text-muted sm:text-sm">{item.label}</p></article>)}
      </div>
      <div className="mt-7 grid gap-5 lg:grid-cols-2"><AdminShortcut href="/admin/products" title="Manage product catalog" description="Add products, adjust inventory and update pricing." /><AdminShortcut href="/admin/orders" title="Review incoming orders" description="Track payment and move orders through fulfilment." /></div>
    </div>
  )
}

function AdminShortcut({ href, title, description }: { href: string; title: string; description: string }) {
  return <Link href={href} className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:border-brand/20 hover:shadow-soft"><div><h2 className="font-display text-lg font-bold text-ink">{title}</h2><p className="mt-1 text-sm text-body">{description}</p></div><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-ink transition group-hover:bg-brand group-hover:text-white"><ArrowUpRight size={18} /></span></Link>
}
