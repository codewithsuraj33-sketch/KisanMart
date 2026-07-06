import Link from 'next/link'
import { AlertTriangle, ArrowUpRight, IndianRupee, Package, ShoppingBag, TrendingUp, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import RealtimeRefresh from '@/components/realtime-refresh'

type DashboardOrder = {
  id: string; total_amount: number; created_at: string; payment_status: string
  order_items: Array<{ product_name: string; quantity: number }> | null
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const [{ count: productCount }, { count: orderCount }, { count: customerCount }, { data: orderRows }, { data: lowStock }] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', false),
    supabase.from('orders').select('id, total_amount, created_at, payment_status, order_items(product_name, quantity)').order('created_at', { ascending: false }),
    supabase.from('products').select('id, name, stock').eq('is_active', true).lt('stock', 10).order('stock').limit(8),
  ])
  const orders = (orderRows ?? []) as DashboardOrder[]
  const paidOrders = orders.filter((order) => order.payment_status === 'paid')
  const revenue = paidOrders.reduce((sum, order) => sum + Number(order.total_amount), 0)
  const productSales = new Map<string, number>()
  paidOrders.forEach((order) => order.order_items?.forEach((item) => productSales.set(item.product_name, (productSales.get(item.product_name) ?? 0) + item.quantity)))
  const topProducts = [...productSales.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  const days = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (6 - offset))
    const next = new Date(date); next.setDate(next.getDate() + 1)
    const value = paidOrders.filter((order) => { const created = new Date(order.created_at); return created >= date && created < next }).reduce((sum, order) => sum + Number(order.total_amount), 0)
    return { label: date.toLocaleDateString('en-IN', { weekday: 'short' }), value }
  })
  const maxRevenue = Math.max(...days.map((day) => day.value), 1)
  const stats = [
    { label: 'Total orders', value: orderCount ?? 0, icon: ShoppingBag, tone: 'bg-sky-50 text-sky-600' },
    { label: 'Paid revenue', value: `₹${revenue.toLocaleString('en-IN')}`, icon: IndianRupee, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Products', value: productCount ?? 0, icon: Package, tone: 'bg-amber-50 text-amber-600' },
    { label: 'Customers', value: customerCount ?? 0, icon: Users, tone: 'bg-violet-50 text-violet-600' },
  ]
  return <main className="w-full p-5 sm:p-8 lg:px-10"><RealtimeRefresh tables={['products', 'orders']} /><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Business overview</p><h1 className="mt-2 text-3xl font-extrabold text-ink">Dashboard</h1><p className="mt-1 text-sm text-body">Sales, stock aur fulfilment ka live pulse.</p>
    <div className="mt-7 grid grid-cols-2 gap-4 xl:grid-cols-4">{stats.map((item) => <article key={item.label} className="rounded-2xl border border-line bg-white p-5 shadow-card"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.tone}`}><item.icon size={21} /></span><p className="mt-5 font-display text-2xl font-extrabold text-ink sm:text-3xl">{item.value}</p><p className="mt-1 text-xs font-semibold text-muted sm:text-sm">{item.label}</p></article>)}</div>
    <div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_0.8fr]"><section className="rounded-2xl border border-line bg-white p-6 shadow-card"><h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink"><TrendingUp size={18} className="text-brand" /> Last 7 days revenue</h2><div className="mt-7 flex h-52 items-end gap-3">{days.map((day) => <div key={day.label} className="flex h-full flex-1 flex-col justify-end text-center"><span className="mb-2 text-[10px] font-bold text-muted">{day.value ? `₹${Math.round(day.value).toLocaleString('en-IN')}` : ''}</span><div className="min-h-1 rounded-t-lg bg-gradient-to-t from-brand to-brand-light" style={{ height: `${Math.max(3, day.value / maxRevenue * 100)}%` }} /><span className="mt-2 text-xs font-semibold text-body">{day.label}</span></div>)}</div></section><section className="rounded-2xl border border-line bg-white p-6 shadow-card"><h2 className="font-display text-lg font-bold text-ink">Top products</h2><div className="mt-4 space-y-3">{topProducts.map(([name, units], index) => <div key={name} className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-sage text-xs font-bold text-brand">{index + 1}</span><p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{name}</p><span className="text-xs font-bold text-muted">{units} sold</span></div>)}{!topProducts.length && <p className="text-sm text-muted">Paid orders ke baad top products yahan aayenge.</p>}</div></section></div>
    <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-6"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-display text-lg font-bold text-amber-900"><AlertTriangle size={19} /> Low-stock alerts</h2><Link href="/admin/products" className="text-xs font-bold text-amber-800">Manage inventory →</Link></div><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{(lowStock ?? []).map((product) => <Link key={product.id} href={`/admin/products/${product.id}/edit`} className="flex items-center justify-between rounded-xl border border-amber-200 bg-white p-3"><span className="truncate text-sm font-semibold text-ink">{product.name}</span><span className={`ml-3 text-xs font-extrabold ${product.stock === 0 ? 'text-danger' : 'text-amber-700'}`}>{product.stock === 0 ? 'OUT' : `${product.stock} left`}</span></Link>)}{!lowStock?.length && <p className="text-sm text-amber-800">All active products have healthy stock.</p>}</div></section>
    <div className="mt-5 grid gap-5 lg:grid-cols-2"><Shortcut href="/admin/products" title="Manage product catalog" description="Products, pricing aur inventory update karein." /><Shortcut href="/admin/orders" title="Review incoming orders" description="Payment aur fulfilment status manage karein." /></div>
  </main>
}

function Shortcut({ href, title, description }: { href: string; title: string; description: string }) { return <Link href={href} className="group flex items-center justify-between rounded-2xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-0.5"><div><h2 className="font-display text-lg font-bold text-ink">{title}</h2><p className="mt-1 text-sm text-body">{description}</p></div><span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface group-hover:bg-brand group-hover:text-white"><ArrowUpRight size={18} /></span></Link> }
