'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ExternalLink, Home, Leaf, LogOut, MessageSquareQuote, Package, RotateCcw, ShoppingBag, TicketPercent, Users } from 'lucide-react'
import { logout } from '@/app/auth/actions'

const LINKS = [
  { href: '/admin/dashboard', label: 'Overview', icon: Home },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/coupons', label: 'Coupons', icon: TicketPercent },
  { href: '/admin/returns', label: 'Returns', icon: RotateCcw },
  { href: '/admin/quotes', label: 'Bulk Quotes', icon: MessageSquareQuote },
  { href: '/admin/users', label: 'Customers', icon: Users },
]

// Top navigation bar for the admin console — frees full horizontal width for
// the data tables below.
export default function AdminNav() {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-brand-dark text-white">
      <div className="flex h-16 w-full items-center gap-3 px-4 sm:px-6 lg:px-10">
        {/* Brand */}
        <Link href="/admin/dashboard" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
            <Leaf size={19} />
          </span>
          <span className="leading-none">
            <span className="block font-display text-lg font-extrabold">
              Kisan<span className="text-brand-light">Mart</span>
            </span>
            <span className="block text-[9px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Admin Console
            </span>
          </span>
        </Link>

        {/* Tabs */}
        <nav className="no-scrollbar ml-2 flex flex-1 items-center gap-1 overflow-x-auto">
          {LINKS.map((item) => {
            const active = pathname?.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? 'bg-white/15 text-white'
                    : 'text-white/65 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon size={17} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right actions */}
        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/"
            className="hidden items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white sm:flex"
          >
            <ExternalLink size={16} /> Storefront
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut size={16} /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
