import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ProductImage from './product-image'

// Image-led category card: photo on top, label + count + arrow below.
export default function CategoryCard({
  href,
  image,
  label,
  count,
}: {
  href: string
  image?: string | null
  label: string
  count?: number
}) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-3xl border border-line bg-card shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <ProductImage
          src={image}
          alt={label}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/45 via-transparent to-transparent" />
      </div>

      <div className="flex items-center justify-between gap-2 px-4 py-3.5">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-bold text-ink">{label}</h3>
          <p className="text-xs text-muted">
            {typeof count === 'number' ? `${count} products` : 'Explore range'}
          </p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand transition-all duration-300 group-hover:bg-brand group-hover:text-white">
          <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  )
}
