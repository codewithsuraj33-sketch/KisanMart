import AdminNav from '@/components/admin-nav'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    isAdmin = !!profile?.is_admin
  }
  if (!isAdmin) return <>{children}</>
  return <div className="min-h-screen bg-slate-50 md:flex"><AdminNav /><main className="min-w-0 flex-1 bg-slate-50">{children}</main></div>
}
