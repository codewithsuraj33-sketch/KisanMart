import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

// Per-category colour theme. Falls back to brand green for unknown slugs.
const THEMES: Record<
  string,
  { bg: string; border: string; text: string; shadow: string }
> = {
  seeds: {
    bg: 'bg-green-50',
    border: 'border-green-200 hover:border-green-400',
    text: 'text-green-700',
    shadow: 'hover:shadow-[0_16px_40px_rgba(22,163,74,0.18)]',
  },
  fertilizers: {
    bg: 'bg-amber-50',
    border: 'border-amber-200 hover:border-amber-400',
    text: 'text-amber-700',
    shadow: 'hover:shadow-[0_16px_40px_rgba(245,158,11,0.18)]',
  },
  pesticides: {
    bg: 'bg-sky-50',
    border: 'border-sky-200 hover:border-sky-400',
    text: 'text-sky-700',
    shadow: 'hover:shadow-[0_16px_40px_rgba(14,165,233,0.16)]',
  },
  tools: {
    bg: 'bg-orange-50',
    border: 'border-orange-200 hover:border-orange-400',
    text: 'text-orange-700',
    shadow: 'hover:shadow-[0_16px_40px_rgba(249,115,22,0.16)]',
  },
  irrigation: {
    bg: 'bg-cyan-50',
    border: 'border-cyan-200 hover:border-cyan-400',
    text: 'text-cyan-700',
    shadow: 'hover:shadow-[0_16px_40px_rgba(6,182,212,0.16)]',
  },
}

const FALLBACK = {
  bg: 'bg-green-50',
  border: 'border-green-200 hover:border-green-400',
  text: 'text-green-700',
  shadow: 'hover:shadow-[0_16px_40px_rgba(22,163,74,0.18)]',
}

export default function CategoryCard({
  href,
  icon,
  label,
  slug,
  count,
}: {
  href: string
  icon: string
  label: string
  slug: string
  count?: number
}) {
  const theme = THEMES[slug] ?? FALLBACK

  return (
    <Link
      href={href}
      className={`group flex flex-col items-start gap-4 rounded-[20px] border p-6 transition-all duration-300 hover:-translate-y-1 ${theme.bg} ${theme.border} ${theme.shadow}`}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-4xl shadow-sm transition-transform duration-300 group-hover:scale-110">
        {icon}
      </span>

      <div className="w-full">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-ink">{label}</h3>
          <ArrowRight
            size={18}
            className={`-translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 ${theme.text}`}
          />
        </div>
        <p className="mt-0.5 text-sm text-muted">
          {typeof count === 'number' ? `${count} products` : 'Explore range'}
        </p>
      </div>
    </Link>
  )
}
