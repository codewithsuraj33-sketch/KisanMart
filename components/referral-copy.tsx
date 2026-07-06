'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export default function ReferralCopy({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    const url = `${window.location.origin}/signup?ref=${encodeURIComponent(code)}`
    await navigator.clipboard.writeText(`KisanMart join karein! Signup par referral code ${code} use karein: ${url}`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }
  return <button type="button" onClick={copy} className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white">{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copied' : 'Share referral'}</button>
}
