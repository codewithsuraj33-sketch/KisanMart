'use client'

import { useActionState, useEffect, useState } from 'react'
import { KeyRound, Languages, Leaf, Save, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import {
  cancelDeletionRequest,
  changePassword,
  requestDeletion,
  updateFarmProfile,
  updatePreferences,
  updateProfile,
  type SettingsState,
} from '@/app/settings/actions'

type PreferencesRow = {
  locale: string
  order_email: boolean
  order_sms: boolean
  order_whatsapp: boolean
  push_notifications: boolean
  stock_alerts: boolean
  price_alerts: boolean
  marketing_messages: boolean
  personalized_recommendations: boolean
  text_size: 'normal' | 'large'
  high_contrast: boolean
}

type FarmProfileRow = {
  farm_name: string | null
  acreage: number | null
  crops: string[] | null
  soil_type: string | null
  irrigation: string | null
  district: string | null
  state: string | null
  organisation: string | null
  gstin: string | null
}

type DeletionRow = {
  status: 'requested' | 'cancelled' | 'completed'
  scheduled_for: string | null
  reason: string | null
}

const initialState: SettingsState = {}
const inputClass =
  'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10'
const checkboxClass = 'h-4 w-4 rounded border-line text-brand focus:ring-brand'
const localeOptions = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिंदी' },
  { value: 'pa', label: 'ਪੰਜਾਬੀ' },
  { value: 'mr', label: 'मराठी' },
  { value: 'gu', label: 'ગુજરાતી' },
  { value: 'te', label: 'తెలుగు' },
  { value: 'ta', label: 'தமிழ்' },
  { value: 'kn', label: 'ಕನ್ನಡ' },
] as const

function ResultMessage({ state }: { state: SettingsState }) {
  if (state.error) {
    return <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
  }
  if (state.success) {
    return <p className="rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand-dark">{state.success}</p>
  }
  return null
}

export default function AccountSettingsForm({
  email,
  fullName,
  phone,
  preferences,
  farmProfile,
  deletionRequest,
}: {
  email: string
  fullName: string
  phone: string
  preferences?: PreferencesRow | null
  farmProfile?: FarmProfileRow | null
  deletionRequest?: DeletionRow | null
}) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, initialState)
  const [passwordState, passwordAction, passwordPending] = useActionState(changePassword, initialState)
  const [preferencesState, preferencesAction, preferencesPending] = useActionState(
    updatePreferences,
    initialState
  )
  const [farmState, farmAction, farmPending] = useActionState(updateFarmProfile, initialState)
  const [deletionState, deletionAction, deletionPending] = useActionState(requestDeletion, initialState)
  const [cancelDeletionState, cancelDeletionAction, cancelDeletionPending] = useActionState(
    cancelDeletionRequest,
    initialState
  )

  const [locale, setLocale] = useState(preferences?.locale ?? 'en')
  const [textSize, setTextSize] = useState<PreferencesRow['text_size']>(
    preferences?.text_size ?? 'normal'
  )
  const defaultDeletionDate = new Date()
  defaultDeletionDate.setDate(defaultDeletionDate.getDate() + 7)

  useEffect(() => {
    if (!preferencesState.success) return
    window.localStorage.setItem('kisanmart-language', locale)
    document.documentElement.lang = locale
  }, [preferencesState.success, locale])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-line bg-card p-5 shadow-card sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <UserRound size={20} />
          </span>
          <div>
            <h2 className="font-bold text-ink">Personal information</h2>
            <p className="text-xs text-muted">Basic account details yahan se manage karein.</p>
          </div>
        </div>

        <form action={profileAction} className="space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
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
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
              <ShieldCheck size={14} /> Phone number
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
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
              <ShieldCheck size={14} /> Email
            </label>
            <input value={email} readOnly className={`${inputClass} cursor-not-allowed bg-surface`} />
            <p className="mt-1 text-xs text-muted">Email login identity hai, isliye read-only hai.</p>
          </div>

          <ResultMessage state={profileState} />

          <button
            type="submit"
            disabled={profilePending}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            <Save size={16} /> {profilePending ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-line bg-card p-5 shadow-card sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent-dark">
            <KeyRound size={20} />
          </span>
          <div>
            <h2 className="font-bold text-ink">Change password</h2>
            <p className="text-xs text-muted">Account ke liye naya secure password set karein.</p>
          </div>
        </div>

        <form action={passwordAction} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">New password</label>
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
            <label className="mb-1.5 block text-sm font-medium text-ink">Confirm password</label>
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
            className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:opacity-60"
          >
            <KeyRound size={16} /> {passwordPending ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-line bg-card p-5 shadow-card sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Languages size={20} />
          </span>
          <div>
            <h2 className="font-bold text-ink">Language & accessibility</h2>
            <p className="text-xs text-muted">Regional language support aur reading preferences.</p>
          </div>
        </div>

        <form action={preferencesAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Language</label>
              <select
                name="locale"
                value={locale}
                onChange={(event) => setLocale(event.target.value)}
                className={inputClass}
              >
                {localeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Text size</label>
              <select
                name="text_size"
                value={textSize}
                onChange={(event) => setTextSize(event.target.value as PreferencesRow['text_size'])}
                className={inputClass}
              >
                <option value="normal">Normal</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['order_email', 'Order emails', preferences?.order_email ?? true],
              ['order_sms', 'Order SMS', preferences?.order_sms ?? true],
              ['order_whatsapp', 'Order WhatsApp', preferences?.order_whatsapp ?? false],
              ['push_notifications', 'Push notifications', preferences?.push_notifications ?? true],
              ['stock_alerts', 'Stock alerts', preferences?.stock_alerts ?? true],
              ['price_alerts', 'Price alerts', preferences?.price_alerts ?? true],
              ['marketing_messages', 'Marketing messages', preferences?.marketing_messages ?? false],
              ['personalized_recommendations', 'Personalized recommendations', preferences?.personalized_recommendations ?? true],
              ['high_contrast', 'High contrast', preferences?.high_contrast ?? false],
            ].map(([name, label, checked]) => (
              <label
                key={String(name)}
                className="flex items-start gap-2 rounded-xl border border-line bg-surface/60 px-3 py-3 text-sm text-ink"
              >
                <input
                  type="checkbox"
                  name={String(name)}
                  defaultChecked={Boolean(checked)}
                  className={checkboxClass}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <p className="rounded-xl bg-brand/5 px-3 py-3 text-xs leading-5 text-body">
            Save karne ke baad language preference browser aur account dono mein remembered rahegi.
          </p>

          <ResultMessage state={preferencesState} />

          <button
            type="submit"
            disabled={preferencesPending}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            <Save size={16} /> {preferencesPending ? 'Saving...' : 'Save preferences'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-line bg-card p-5 shadow-card sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Leaf size={20} />
          </span>
          <div>
            <h2 className="font-bold text-ink">Farm profile</h2>
            <p className="text-xs text-muted">Per-acre planning aur recommendations ke liye profile fill karein.</p>
          </div>
        </div>

        <form action={farmAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="farm_name"
              defaultValue={farmProfile?.farm_name ?? ''}
              placeholder="Farm name"
              className={inputClass}
            />
            <input
              name="acreage"
              type="number"
              step="0.01"
              min="0"
              defaultValue={farmProfile?.acreage ?? ''}
              placeholder="Acreage"
              className={inputClass}
            />
            <input
              name="crops"
              defaultValue={farmProfile?.crops?.join(', ') ?? ''}
              placeholder="Crops (comma separated)"
              className={`${inputClass} sm:col-span-2`}
            />
            <input
              name="soil_type"
              defaultValue={farmProfile?.soil_type ?? ''}
              placeholder="Soil type"
              className={inputClass}
            />
            <input
              name="irrigation"
              defaultValue={farmProfile?.irrigation ?? ''}
              placeholder="Irrigation type"
              className={inputClass}
            />
            <input
              name="district"
              defaultValue={farmProfile?.district ?? ''}
              placeholder="District"
              className={inputClass}
            />
            <input
              name="state"
              defaultValue={farmProfile?.state ?? ''}
              placeholder="State"
              className={inputClass}
            />
            <input
              name="organisation"
              defaultValue={farmProfile?.organisation ?? ''}
              placeholder="Organisation / FPO"
              className={inputClass}
            />
            <input
              name="gstin"
              defaultValue={farmProfile?.gstin ?? ''}
              placeholder="GSTIN"
              className={`${inputClass} sm:col-span-2`}
            />
          </div>

          <ResultMessage state={farmState} />

          <button
            type="submit"
            disabled={farmPending}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            <Save size={16} /> {farmPending ? 'Saving...' : 'Save farm profile'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-line bg-card p-5 shadow-card sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger">
            <Trash2 size={20} />
          </span>
          <div>
            <h2 className="font-bold text-ink">Account deletion</h2>
            <p className="text-xs text-muted">Optional self-service deletion request tracker.</p>
          </div>
        </div>

        {deletionRequest?.status === 'requested' ? (
          <div className="rounded-xl border border-danger/15 bg-danger/5 p-4">
            <p className="text-sm font-semibold text-ink">Deletion request pending</p>
            <p className="mt-1 text-xs text-body">
              Scheduled for{' '}
              {deletionRequest.scheduled_for
                ? new Date(deletionRequest.scheduled_for).toLocaleDateString('en-IN')
                : 'soon'}
            </p>
            {deletionRequest.reason && (
              <p className="mt-2 text-xs text-body">Reason: {deletionRequest.reason}</p>
            )}
            <form action={cancelDeletionAction} className="mt-4">
              <button
                type="submit"
                disabled={cancelDeletionPending}
                className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-danger/30 hover:text-danger disabled:opacity-60"
              >
                {cancelDeletionPending ? 'Cancelling...' : 'Cancel request'}
              </button>
            </form>
            <ResultMessage state={cancelDeletionState} />
          </div>
        ) : (
          <form action={deletionAction} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Reason</label>
              <textarea
                name="reason"
                rows={4}
                placeholder="Aap kyu account delete karna chahte hain?"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Schedule date</label>
              <input
                name="scheduled_for"
                type="date"
                defaultValue={defaultDeletionDate.toISOString().slice(0, 10)}
                className={inputClass}
              />
            </div>

            <p className="rounded-xl bg-danger/5 px-3 py-3 text-xs leading-5 text-danger">
              Request submit karne ke baad deletion review state mein chala jayega.
            </p>

            <ResultMessage state={deletionState} />

            <button
              type="submit"
              disabled={deletionPending}
              className="inline-flex items-center gap-2 rounded-xl bg-danger px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
            >
              <Trash2 size={16} /> {deletionPending ? 'Submitting...' : 'Request deletion'}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
