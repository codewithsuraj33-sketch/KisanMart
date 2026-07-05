import { createBrowserClient } from '@supabase/ssr'

// Browser side Supabase client
// Ye customer facing pages mein use hoga
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}