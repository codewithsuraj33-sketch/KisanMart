'use client'

import { useActionState } from 'react'
import { KeyRound, Mail, Phone, Save, UserRound } from 'lucide-react'
import {
  changePassword,
  updateProfile,
  type SettingsState,
} from '@/app/settings/actions'

const initialState: SettingsState = {}
const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100'

function ResultMessage({ state }: { state: SettingsState }) {
  if (state.error) {
    return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
  }
  if (state.success) {
    return (
      <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
        {state.success}
      </p>
    )
  }
  return null
}

export default function AccountSettingsForm({
  email,
  fullName,
  phone,
}: {
  email: string
  fullName: string
  phone: string
}) {
  const [profileState, profileAction, profilePending] = useActionState(
    updateProfile,
    initialState
  )
  const [passwordState, passwordAction, passwordPending] = useActionState(
    changePassword,
    initialState
  )

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
            <UserRound size={20} />
          </span>
          <div>
            <h2 className="font-bold text-gray-900">Personal Information</h2>
            <p className="text-xs text-gray-500">Apni basic account details manage karein.</p>
          </div>
        </div>

        <form action={profileAction} className="space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <UserRound size={14} /> Full name
            </label>
            <input
              name="full_name"
              required
              minLength={2}
              maxLength={80}
              defaultValue={fullName}
              autoComplete="name"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <Phone size={14} /> Phone number
            </label>
            <input
              name="phone"
              type="tel"
              defaultValue={phone}
              autoComplete="tel"
              placeholder="e.g. 9876543210"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <Mail size={14} /> Email
            </label>
            <input value={email} readOnly className={`${inputClass} cursor-not-allowed bg-gray-50`} />
            <p className="mt-1 text-xs text-gray-400">Email login identity hai, isliye read-only hai.</p>
          </div>

          <ResultMessage state={profileState} />

          <button
            type="submit"
            disabled={profilePending}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            <Save size={16} /> {profilePending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </section>

      <section className="h-fit rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
            <KeyRound size={20} />
          </span>
          <div>
            <h2 className="font-bold text-gray-900">Change Password</h2>
            <p className="text-xs text-gray-500">Account ke liye naya secure password set karein.</p>
          </div>
        </div>

        <form action={passwordAction} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">New password</label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Confirm password</label>
            <input
              name="confirm_password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className={inputClass}
            />
          </div>

          <ResultMessage state={passwordState} />

          <button
            type="submit"
            disabled={passwordPending}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
          >
            <KeyRound size={16} /> {passwordPending ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </section>
    </div>
  )
}
