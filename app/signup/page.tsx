'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { ArrowRight, Gift, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react'
import { signup, type AuthState } from '@/app/auth/actions'
import AuthShell from '@/components/auth-shell'
import { buttonClasses } from '@/components/ui/button'

const initialState: AuthState = {}
const inputClass = 'peer w-full rounded-xl border border-line bg-white px-11 pb-2.5 pt-5 text-sm text-ink outline-none transition placeholder:text-transparent focus:border-brand focus:ring-4 focus:ring-brand/10'

function Field({ icon: Icon, label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon: typeof Mail; label: string }) {
  return (
    <label className="relative block">
      <Icon className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted" size={18} />
      <input {...props} placeholder={label} className={inputClass} />
      <span className="pointer-events-none absolute left-11 top-2 text-[11px] font-semibold text-muted transition peer-focus:text-brand">{label}</span>
    </label>
  )
}

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState)

  return (
    <AuthShell title="Create your account" subtitle="Join KisanMart for a simpler, more dependable way to buy farm essentials.">
      <form action={formAction} className="space-y-4">
        <Field icon={UserRound} label="Full name" name="full_name" type="text" required autoComplete="name" />
        <Field icon={Phone} label="Phone (optional)" name="phone" type="tel" autoComplete="tel" />
        <Field icon={Mail} label="Email address" name="email" type="email" required autoComplete="email" />
        <Field icon={LockKeyhole} label="Password · minimum 8 characters" name="password" type="password" required minLength={8} autoComplete="new-password" />
        <Field icon={Gift} label="Referral code (optional)" name="referral_code" type="text" autoComplete="off" />

        {state.error && <p className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{state.error}</p>}
        {state.message && <p className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm text-brand-dark">{state.message}</p>}

        <button type="submit" disabled={pending} className={`${buttonClasses('primary', 'lg')} w-full`}>
          {pending ? 'Creating account…' : <>Create account <ArrowRight size={18} /></>}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-body">
        Already have an account?{' '}
        <Link href="/login" className="font-bold text-brand hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  )
}
