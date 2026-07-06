import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Bell, CheckCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { markAllRead } from './actions'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100)
  return <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-brand">Updates</p><h1 className="mt-2 font-display text-3xl font-extrabold text-ink">Notifications</h1></div>{data?.some((item) => !item.read_at) && <form action={markAllRead}><button className="flex items-center gap-1.5 text-xs font-bold text-brand"><CheckCheck size={16} /> Mark all read</button></form>}</div><div className="mt-6 space-y-2">{(data ?? []).map((item) => { const content = <article className={`rounded-2xl border p-4 transition ${item.read_at ? 'border-line bg-card' : 'border-brand/25 bg-brand/5'}`}><div className="flex gap-3"><span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.read_at ? 'bg-surface text-muted' : 'bg-brand text-white'}`}><Bell size={16} /></span><div><h2 className="text-sm font-bold text-ink">{item.title}</h2><p className="mt-1 text-sm leading-6 text-body">{item.message}</p><p className="mt-2 text-[11px] text-muted">{new Date(item.created_at).toLocaleString('en-IN')}</p></div></div></article>; return item.link ? <Link key={item.id} href={item.link}>{content}</Link> : <div key={item.id}>{content}</div> })}{!data?.length && <div className="rounded-2xl border border-dashed border-line py-14 text-center"><Bell className="mx-auto text-muted" /><p className="mt-3 text-sm text-muted">Abhi koi notification nahi hai.</p></div>}</div></main>
}
