'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Leaf,
  Search,
  ShoppingCart,
  Heart,
  Menu,
  X,
  User,
  LogOut,
  Package,
  Settings,
  Truck,
  ShieldCheck,
} from 'lucide-react'
import { useCart } from './cart-provider'
import { useWishlist } from './wishlist-provider'
import { logout } from '@/app/auth/actions'
import { buttonClasses } from './ui/button'
import SearchOverlay from './search-overlay'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/#categories', label: 'Categories' },
  { href: '/#about', label: 'About' },
]

function CountBadge({ count, tone }: { count: number; tone: 'brand' | 'accent' }) {
  if (count <= 0) return null
  return (
    <span
      className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
        tone === 'brand' ? 'bg-brand' : 'bg-accent'
      }`}
    >
      {count > 9 ? '9+' : count}
    </span>
  )
}

export default function NavbarClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { totalItems } = useCart()
  const { savedIds } = useWishlist()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const wishlistCount = savedIds.size

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-brand-dark text-[13px] text-white/90">
        <div className="flex w-full items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-10">
          <span className="flex items-center gap-2 font-medium">
            <Truck size={15} className="text-brand-light" />
            Free delivery on orders above ₹999
          </span>
          <span className="hidden items-center gap-4 font-medium sm:flex">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-brand-light" /> 100% Genuine Products
            </span>
            <span className="text-white/25">|</span>
            <span>Trusted by 10,000+ Farmers</span>
          </span>
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? 'border-line bg-surface/90 shadow-[0_4px_24px_rgba(20,49,31,0.08)] backdrop-blur-xl'
            : 'border-line/60 bg-surface/80 backdrop-blur-md'
        }`}
      >
        <nav className="flex h-[74px] w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white shadow-sm">
              <Leaf size={20} />
            </span>
            <span className="leading-none">
              <span className="block font-display text-[22px] font-extrabold tracking-tight">
                <span className="text-ink">Kisan</span><span className="text-brand">Mart</span>
              </span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
                Grow · Nourish · Harvest
              </span>
            </span>
          </Link>

          {/* Center links with animated underline */}
          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="group relative py-1 text-sm font-semibold text-ink/80 transition-colors hover:text-brand"
              >
                {l.label}
                <span className="absolute -bottom-0.5 left-0 h-0.5 w-full origin-left scale-x-0 rounded-full bg-brand transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink/70 transition hover:bg-brand/10 hover:text-brand"
            >
              <Search size={20} />
            </button>

            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink/70 transition hover:bg-brand/10 hover:text-brand"
            >
              <Heart size={20} />
              <CountBadge count={wishlistCount} tone="accent" />
            </Link>

            <Link
              href="/cart"
              aria-label="Cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink/70 transition hover:bg-brand/10 hover:text-brand"
            >
              <ShoppingCart size={20} />
              <CountBadge count={totalItems} tone="brand" />
            </Link>

            {/* Profile / Login (desktop) */}
            <div className="ml-1 hidden md:block">
              {isLoggedIn ? (
                <div className="group relative">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-semibold text-ink transition hover:border-brand/40 hover:text-brand"
                  >
                    <User size={16} /> Account
                  </button>
                  <div className="invisible absolute right-0 top-full z-50 w-48 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                    <div className="overflow-hidden rounded-xl border border-line bg-card py-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.12)]">
                      {[
                        { href: '/orders', icon: Package, label: 'My Orders' },
                        { href: '/wishlist', icon: Heart, label: 'Wishlist' },
                        { href: '/settings', icon: Settings, label: 'Settings' },
                      ].map((m) => (
                        <Link
                          key={m.href}
                          href={m.href}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-body transition hover:bg-surface hover:text-brand"
                        >
                          <m.icon size={16} /> {m.label}
                        </Link>
                      ))}
                      <form action={logout} className="border-t border-line">
                        <button
                          type="submit"
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-body transition hover:bg-surface hover:text-danger"
                        >
                          <LogOut size={16} /> Logout
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ) : (
                <Link href="/login" className={buttonClasses('outline', 'sm')}>
                  Login
                </Link>
              )}
            </div>

            {/* Hamburger (mobile) */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-brand/10 md:hidden"
            >
              <Menu size={22} />
            </button>
          </div>
        </nav>
      </header>

      {/* Search overlay */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile slide-in drawer (from right) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[80] bg-ink/40 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              className="absolute right-0 top-0 flex h-full w-[80%] max-w-xs flex-col bg-card shadow-2xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <span className="font-display text-lg font-extrabold">
                  <span className="text-brand">Kisan</span>
                  <span className="text-accent">Mart</span>
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-surface hover:text-ink"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
                {NAV_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-3 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface hover:text-brand"
                  >
                    {l.label}
                  </Link>
                ))}

                <div className="mt-2 border-t border-line pt-3">
                  {isLoggedIn ? (
                    <>
                      {[
                        { href: '/orders', icon: Package, label: 'My Orders' },
                        { href: '/wishlist', icon: Heart, label: 'Wishlist' },
                        { href: '/settings', icon: Settings, label: 'Settings' },
                      ].map((m) => (
                        <Link
                          key={m.href}
                          href={m.href}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-body transition hover:bg-surface hover:text-brand"
                        >
                          <m.icon size={17} /> {m.label}
                        </Link>
                      ))}
                      <form action={logout}>
                        <button
                          type="submit"
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-body transition hover:bg-surface hover:text-danger"
                        >
                          <LogOut size={17} /> Logout
                        </button>
                      </form>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className={`${buttonClasses('primary', 'md')} w-full`}
                    >
                      Login
                    </Link>
                  )}
                </div>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
