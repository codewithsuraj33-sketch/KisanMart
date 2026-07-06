import { redirect } from 'next/navigation'
import { CalendarDays, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import AccountSettingsForm from '@/components/account-settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: preferences }, { data: farmProfile }, { data: deletionRequest }] = await Promise.all([
    supabase.from('profiles').select('full_name, phone, created_at').eq('id', user.id).single(),
    supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('farm_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('account_deletion_requests')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-10">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-green-700">
            <Settings size={19} />
            <span className="text-sm font-semibold uppercase tracking-wide">My Account</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Account Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Profile aur security details yahan se manage karein.
          </p>
        </div>

        {profile?.created_at && (
          <p className="flex items-center gap-1.5 text-xs text-gray-500">
            <CalendarDays size={14} /> Member since{' '}
            {new Date(profile.created_at).toLocaleDateString('en-IN', {
              month: 'short',
              year: 'numeric',
            })}
          </p>
        )}
      </div>

      <AccountSettingsForm
        email={user.email ?? ''}
        fullName={profile?.full_name ?? String(user.user_metadata.full_name ?? '')}
        phone={profile?.phone ?? String(user.user_metadata.phone ?? '')}
        preferences={preferences}
        farmProfile={farmProfile}
        deletionRequest={deletionRequest}
      />
    </div>
  )
}
