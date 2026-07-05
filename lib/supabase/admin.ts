import { createClient } from '@supabase/supabase-js'

// ADMIN / SERVICE-ROLE client — RLS ko bypass karta hai.
// ⚠️ SIRF server-side code mein use karo (API routes). Kabhi
// client/browser mein import mat karna — ye key secret hai.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
