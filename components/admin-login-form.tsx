'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Leaf, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { adminLogin, type AuthState } from '@/app/auth/actions'
import { buttonClasses } from '@/components/ui/button'

const initialState: AuthState = {}

export default function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminLogin, initialState)
  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-ink px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-dots opacity-[0.035]" />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white p-7 shadow-[0_30px_80px_rgba(0,0,0,0.3)] sm:p-9">
        <div className="flex items-center justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white"><ShieldCheck size={24} /></span><Link href="/" className="flex items-center gap-1.5 text-xs font-bold text-body hover:text-brand"><ArrowLeft size={14} /> Storefront</Link></div>
        <div className="mt-7"><div className="flex items-center gap-2 font-display text-sm font-extrabold"><Leaf className="text-brand" size={17} /><span className="text-brand">Kisan<span className="text-brand-dark">Mart</span></span></div><h1 className="mt-3 text-3xl font-extrabold text-ink">Admin access</h1><p className="mt-2 text-sm leading-6 text-body">Sign in with an authorised administrator account.</p></div>
        <form action={formAction} className="mt-7 space-y-4">
          <label className="relative block"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} /><input name="email" type="email" required autoComplete="email" placeholder="Admin email" className="w-full rounded-xl border border-line py-3.5 pl-11 pr-4 text-sm text-ink outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" /></label>
          <label className="relative block"><LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} /><input name="password" type="password" required autoComplete="current-password" placeholder="Password" className="w-full rounded-xl border border-line py-3.5 pl-11 pr-4 text-sm text-ink outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" /></label>
          {state.error && <p className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{state.error}</p>}
          <button type="submit" disabled={pending} className={`${buttonClasses('dark', 'lg')} w-full`}>{pending ? 'Verifying…' : 'Continue to dashboard'}</button>
        </form>
        <p className="mt-5 text-center text-xs text-muted">Protected area · Access attempts may be logged</p>
      </div>
    </main>
  )
}
