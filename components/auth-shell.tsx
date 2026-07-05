import Link from 'next/link'
import { Leaf, ShieldCheck, Sprout, Star, Truck } from 'lucide-react'

const TRUST_POINTS = [
  { icon: ShieldCheck, label: 'Genuine, quality-tested products' },
  { icon: Truck, label: 'Reliable delivery across India' },
  { icon: Star, label: 'Trusted by 10,000+ farmers' },
]

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <main className="grid min-h-screen flex-1 bg-card lg:grid-cols-[46%_54%]">
      <section className="relative hidden overflow-hidden bg-brand-dark px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-[0.08]" />
        <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full border-[70px] border-white/[0.04]" />

        <Link href="/" className="relative flex items-center gap-2 font-display text-xl font-extrabold">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-dark">
            <Leaf size={21} />
          </span>
          <span>Kisan<span className="text-accent">Mart</span></span>
        </Link>

        <div className="relative max-w-lg py-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-brand-light">
            <Sprout size={15} /> Built for Indian agriculture
          </span>
          <h2 className="mt-6 text-4xl font-extrabold leading-tight text-white xl:text-5xl">
            Empowering Indian farmers, one harvest at a time.
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-white/70">
            Better inputs, honest prices and dependable doorstep delivery—from trusted manufacturers to your farm.
          </p>

          <div className="mt-9 space-y-3">
            {TRUST_POINTS.map((item) => (
              <div key={item.label} className="flex items-center gap-3 text-sm font-medium text-white/85">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-accent">
                  <item.icon size={17} />
                </span>
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs font-medium text-white/45">Fresh choices. Fair prices. Stronger farms.</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 flex items-center gap-2 font-display text-xl font-extrabold lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
              <Leaf size={21} />
            </span>
            <span className="text-brand">Kisan<span className="text-accent">Mart</span></span>
          </Link>
          <div className="mb-8">
            <p className="eyebrow">Welcome to KisanMart</p>
            <h1 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-body">{subtitle}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  )
}
