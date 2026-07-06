import { redirect } from 'next/navigation'
import { Gift, Star, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ReferralCopy from '@/components/referral-copy'

export default async function RewardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const [{ data: profile }, { data: transactions }, { count: referrals }] = await Promise.all([
    supabase.from('profiles').select('loyalty_points, referral_code').eq('id', user.id).single(),
    supabase.from('loyalty_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
    supabase.from('referral_rewards').select('*', { count: 'exact', head: true }).eq('referrer_id', user.id),
  ])
  return <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6"><p className="text-xs font-bold uppercase tracking-wider text-brand">Kisan rewards</p><h1 className="mt-2 font-display text-3xl font-extrabold text-ink">Grow more, earn more</h1><p className="mt-1 text-sm text-muted">Har delivered order par ₹100 spend ke liye 1 point. Successful referral par 100 points.</p><div className="mt-7 grid gap-4 sm:grid-cols-3"><Stat icon={Star} label="Available points" value={String(profile?.loyalty_points ?? 0)} /><Stat icon={Users} label="Successful referrals" value={String(referrals ?? 0)} /><Stat icon={Gift} label="Your referral code" value={profile?.referral_code ?? '—'} /></div><section className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-brand/20 bg-brand/5 p-6 sm:flex-row sm:items-center"><div><h2 className="font-display text-xl font-bold text-ink">Invite a fellow farmer</h2><p className="mt-1 text-sm text-body">Unka pehla order deliver hote hi aapko 100 points milenge.</p></div>{profile?.referral_code && <ReferralCopy code={profile.referral_code} />}</section><section className="mt-6 rounded-2xl border border-line bg-card p-6 shadow-card"><h2 className="font-display text-xl font-bold text-ink">Points history</h2><div className="mt-4 divide-y divide-line">{(transactions ?? []).map((item) => <div key={item.id} className="flex items-center justify-between py-3"><div><p className="text-sm font-semibold text-ink">{item.note || item.kind}</p><p className="text-xs text-muted">{new Date(item.created_at).toLocaleDateString('en-IN')}</p></div><span className={`font-extrabold ${item.points >= 0 ? 'text-brand' : 'text-danger'}`}>{item.points >= 0 ? '+' : ''}{item.points}</span></div>)}{!transactions?.length && <p className="py-8 text-center text-sm text-muted">Points activity delivered order ke baad yahan dikhegi.</p>}</div></section></main>
}

function Stat({ icon: Icon, label, value }: { icon: typeof Gift; label: string; value: string }) { return <article className="rounded-2xl border border-line bg-card p-5 shadow-card"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage text-brand"><Icon size={19} /></span><p className="mt-4 font-display text-2xl font-extrabold text-ink">{value}</p><p className="text-xs font-semibold text-muted">{label}</p></article> }
