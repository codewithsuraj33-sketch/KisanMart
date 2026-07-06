import { createClient } from '@/lib/supabase/server'
import NavbarClient from './navbar-client'

// Server wrapper — reads auth state, then hands off to the interactive
// (responsive / hamburger) client navbar.
export default async function Navbar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { count } = user
    ? await supabase.from('notifications').select('*', { count: 'exact', head: true }).is('read_at', null)
    : { count: 0 }

  return <NavbarClient isLoggedIn={!!user} unreadNotifications={count ?? 0} />
}
