import CountUp from './ui/count-up'

const STATS = [
  { value: 500, suffix: '+', label: 'Products' },
  { value: 10000, suffix: '+', label: 'Happy Farmers' },
  { value: 50, suffix: '+', label: 'Districts Served' },
  { value: 4.8, suffix: '★', label: 'Average Rating', decimals: 1 },
]

// Full-width deep-green band under the hero. Numbers count up on scroll.
export default function StatsBar() {
  return (
    <section className="bg-brand-dark">
      <div className="grid w-full grid-cols-2 gap-y-8 px-4 py-10 sm:px-6 md:grid-cols-4 md:divide-x md:divide-white/15 lg:px-10">
        {STATS.map((s) => (
          <div key={s.label} className="px-2 text-center md:px-6">
            <p className="font-display text-3xl font-extrabold text-white sm:text-4xl">
              <CountUp value={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
            </p>
            <p className="mt-1 text-sm font-medium text-brand-light/90">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
