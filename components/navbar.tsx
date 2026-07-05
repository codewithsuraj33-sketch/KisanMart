import { createClient } from '@/lib/supabase/server'
import NavbarClient from './navbar-client'

// Server wrapper — reads auth state, then hands off to the interactive
// (responsive / hamburger) client navbar.
export default async function Navbar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <NavbarClient isLoggedIn={!!user} />
}
