import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminLoginForm from '@/components/admin-login-form'

// If an admin is already signed in, skip the login screen (and its nav-less
// layout) and send them straight to the dashboard.
export default async function AdminLoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (profile?.is_admin) redirect('/admin/dashboard')
  }
  return <AdminLoginForm />
}
