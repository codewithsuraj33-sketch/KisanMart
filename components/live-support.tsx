'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { HelpCircle, Mail, MessageCircle, Phone, X } from 'lucide-react'

export default function LiveSupport() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  if (pathname.startsWith('/admin')) return null
  return <div className="fixed bottom-5 right-5 z-50">{open && <div className="mb-3 w-72 overflow-hidden rounded-2xl border border-line bg-card shadow-lift"><div className="bg-brand-dark p-4 text-white"><div className="flex justify-between"><div><p className="font-bold">KisanMart Support</p><p className="mt-0.5 text-xs text-white/60">Aam taur par kuch minutes mein reply</p></div><button onClick={() => setOpen(false)} aria-label="Close support"><X size={18} /></button></div></div><div className="space-y-2 p-3"><a href="https://wa.me/919876543210?text=Namaste%20KisanMart%2C%20mujhe%20madad%20chahiye" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl bg-green-50 p-3 text-sm font-bold text-green-800"><MessageCircle size={18} /> Chat on WhatsApp</a><a href="tel:+919876543210" className="flex items-center gap-3 rounded-xl bg-surface p-3 text-sm font-bold text-ink"><Phone size={18} /> Call support</a><a href="mailto:support@kisanmart.in" className="flex items-center gap-3 rounded-xl bg-surface p-3 text-sm font-bold text-ink"><Mail size={18} /> Send email</a><Link href="/help" className="flex items-center gap-3 rounded-xl p-3 text-sm font-bold text-brand"><HelpCircle size={18} /> Help center & FAQ</Link></div></div>}<button onClick={() => setOpen((value) => !value)} className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lift transition hover:scale-105" aria-label="Open live support">{open ? <X /> : <MessageCircle />}</button></div>
}
