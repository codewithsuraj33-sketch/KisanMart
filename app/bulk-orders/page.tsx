import { BadgeIndianRupee, Building2, PackageCheck, Truck } from 'lucide-react'
import BulkQuoteForm from '@/components/bulk-quote-form'

const benefits = [
  { icon: BadgeIndianRupee, title: 'Volume pricing', text: 'Quantity ke hisaab se transparent wholesale rates.' },
  { icon: PackageCheck, title: 'Verified supply', text: 'Quality-checked products aur batch-level coordination.' },
  { icon: Truck, title: 'Planned delivery', text: 'Farm, dealer ya FPO location tak delivery scheduling.' },
]

export default function BulkOrdersPage() {
  return <main className="flex-1"><section className="bg-brand-dark px-4 py-16 text-white sm:px-6"><div className="mx-auto max-w-6xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-light">For FPOs, dealers & large farms</p><h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold sm:text-5xl">Bulk farm inputs, sensible prices, one dependable team.</h1><p className="mt-4 max-w-2xl text-white/65">Seeds, crop protection, fertilizers aur tools ke large orders ke liye custom quotation paayein.</p></div></section><section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.75fr_1.25fr]"><div><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage text-brand"><Building2 /></span><h2 className="mt-4 font-display text-2xl font-bold text-ink">Built for serious buying</h2><div className="mt-6 space-y-5">{benefits.map((benefit) => <div key={benefit.title} className="flex gap-3"><benefit.icon className="mt-0.5 shrink-0 text-brand" size={19} /><div><h3 className="font-bold text-ink">{benefit.title}</h3><p className="mt-1 text-sm leading-6 text-body">{benefit.text}</p></div></div>)}</div></div><BulkQuoteForm /></section></main>
}
