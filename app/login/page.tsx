'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react'
import { login, type AuthState } from '@/app/auth/actions'
import AuthShell from '@/components/auth-shell'
import { buttonClasses } from '@/components/ui/button'

const initialState: AuthState = {}
const inputClass = 'peer w-full rounded-xl border border-line bg-white px-11 pb-2.5 pt-5 text-sm text-ink outline-none transition placeholder:text-transparent focus:border-brand focus:ring-4 focus:ring-brand/10'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState)

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to track orders, manage your wishlist and shop faster.">
      <form action={formAction} className="space-y-4">
        <label className="relative block">
          <Mail className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted" size={18} />
          <input name="email" type="email" required autoComplete="email" placeholder="Email address" className={inputClass} />
          <span className="pointer-events-none absolute left-11 top-2 text-[11px] font-semibold text-muted transition peer-focus:text-brand">Email address</span>
        </label>

        <label className="relative block">
          <LockKeyhole className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted" size={18} />
          <input name="password" type="password" required autoComplete="current-password" placeholder="Password" className={inputClass} />
          <span className="pointer-events-none absolute left-11 top-2 text-[11px] font-semibold text-muted transition peer-focus:text-brand">Password</span>
        </label>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 font-medium text-body">
            <input type="checkbox" className="h-4 w-4 rounded border-line accent-brand" /> Remember me
          </label>
          <span className="font-semibold text-brand">Secure sign in</span>
        </div>

        {state.error && <p className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{state.error}</p>}

        <button type="submit" disabled={pending} className={`${buttonClasses('primary', 'lg')} w-full`}>
          {pending ? 'Signing you in…' : <>Sign in <ArrowRight size={18} /></>}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-body">
        New to KisanMart?{' '}
        <Link href="/signup" className="font-bold text-brand hover:underline">Create an account</Link>
      </p>
    </AuthShell>
  )
}
