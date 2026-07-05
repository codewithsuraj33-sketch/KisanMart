'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, MapPin, XCircle } from 'lucide-react'

type DeliveryResult = { available: boolean; message: string; estimatedDate?: string; codAvailable?: boolean }

export default function DeliveryChecker() {
  const [pincode, setPincode] = useState('')
  const [result, setResult] = useState<DeliveryResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function check(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setResult(null)
    try {
      const response = await fetch(`/api/delivery-check?pincode=${encodeURIComponent(pincode)}`)
      setResult((await response.json()) as DeliveryResult)
    } catch {
      setResult({ available: false, message: 'Could not check this pincode. Please try again.' })
    } finally { setLoading(false) }
  }

  return (
    <div className="mt-6 rounded-2xl border border-line bg-card p-4 shadow-card">
      <p className="flex items-center gap-2 text-sm font-bold text-ink"><MapPin size={17} className="text-brand" /> Delivery estimate</p>
      <form onSubmit={check} className="mt-3 flex gap-2">
        <input value={pincode} onChange={(event) => setPincode(event.target.value.replace(/\D/g, '').slice(0, 6))} required pattern="[0-9]{6}" inputMode="numeric" placeholder="Enter 6-digit pincode" className="min-w-0 flex-1 rounded-xl border border-line px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" />
        <button disabled={loading} className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:scale-[1.02] active:scale-[0.97] disabled:opacity-60">Check</button>
      </form>
      {loading && <div className="mt-3 h-9 animate-pulse rounded-xl bg-slate-100" />}
      {result && !loading && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ${result.available ? 'bg-brand/8 text-brand-dark' : 'bg-danger/5 text-danger'}`}>
          {result.available ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand" /> : <XCircle size={18} className="mt-0.5 shrink-0" />}
          <div><p className="font-semibold">{result.message}</p>{result.estimatedDate && <p className="mt-0.5 text-xs">Expected by {result.estimatedDate} · COD {result.codAvailable ? 'available' : 'unavailable'}</p>}</div>
        </motion.div>
      )}
    </div>
  )
}
