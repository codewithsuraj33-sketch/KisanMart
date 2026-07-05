import { Leaf } from 'lucide-react'
import CountUp from './ui/count-up'

const STATS = [
  { value: 500, suffix: '+', label: 'Quality Products' },
  { value: 10000, suffix: '+', label: 'Happy Farmers' },
  { value: 50, suffix: '+', label: 'Districts Served' },
  { value: 4.8, suffix: '★', label: 'Average Rating', decimals: 1 },
]

// Full-width deep-green band. Numbers count up on scroll.
export default function StatsBar() {
  return (
    <section className="relative overflow-hidden bg-brand-dark">
      <div className="pointer-events-none absolute inset-0 bg-dots opacity-[0.07]" />
      <div className="relative w-full px-4 py-12 sm:px-6 lg:px-10">
        <p className="flex items-center justify-center gap-2 text-center font-script text-2xl text-brand-light sm:text-3xl">
          <Leaf size={20} /> Trusted by thousands of happy farmers
        </p>
        <div className="mt-8 grid grid-cols-2 gap-y-8 md:grid-cols-4 md:divide-x md:divide-white/15">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center px-2 text-center md:px-6">
              <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-brand-light">
                <Leaf size={19} />
              </span>
              <p className="font-display text-3xl font-extrabold text-white sm:text-4xl">
                <CountUp value={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
              </p>
              <p className="mt-1 text-sm font-medium text-brand-light/90">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
