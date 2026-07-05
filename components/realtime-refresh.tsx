'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Subscribes to Postgres changes on the given tables and refreshes the current
// route's server data (router.refresh) whenever anything changes — so the admin
// panel and storefront stay in sync with the DB without a manual page reload.
// Requires the tables to be added to the `supabase_realtime` publication
// (see supabase/realtime-setup.sql).
export default function RealtimeRefresh({ tables }: { tables: string[] }) {
  const router = useRouter()
  // Stable string key so the effect doesn't resubscribe on every render.
  const key = tables.join(',')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const names = key.split(',')

    // Debounce: a bulk change (e.g. an UPDATE touching many rows) fires one
    // event per row — coalesce them into a single refresh.
    const refresh = () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => router.refresh(), 300)
    }

    const channel = supabase.channel(`realtime-${key}`)
    for (const table of names) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, refresh)
    }
    channel.subscribe()

    return () => {
      if (timer.current) clearTimeout(timer.current)
      supabase.removeChannel(channel)
    }
  }, [router, key])

  return null
}
