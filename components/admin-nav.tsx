'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ExternalLink, Home, Leaf, LogOut, Package, ShoppingBag, Users } from 'lucide-react'
import { logout } from '@/app/auth/actions'

const LINKS = [
  { href: '/admin/dashboard', label: 'Overview', icon: Home },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/users', label: 'Customers', icon: Users },
]

export default function AdminNav() {
  const pathname = usePathname()
  return (
    <aside className="z-30 flex shrink-0 flex-col bg-ink text-white md:sticky md:top-0 md:h-screen md:w-64">
      <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white"><Leaf size={21} /></span>
        <div><p className="font-display text-base font-extrabold">Kisan<span className="text-accent">Mart</span></p><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Admin console</p></div>
      </div>
      <nav className="no-scrollbar flex gap-1 overflow-x-auto p-3 md:flex-col md:overflow-visible md:py-6">
        {LINKS.map((item) => {
          const active = pathname?.startsWith(item.href)
          return <Link key={item.href} href={item.href} className={`relative flex shrink-0 items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition ${active ? 'bg-white/10 text-white before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-accent' : 'text-white/60 hover:bg-white/[0.06] hover:text-white'}`}><item.icon size={18} />{item.label}</Link>
        })}
      </nav>
      <div className="mt-auto hidden border-t border-white/10 p-3 md:block">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-white/55 transition hover:bg-white/[0.06] hover:text-white"><ExternalLink size={17} /> View storefront</Link>
        <form action={logout}><button type="submit" className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm font-medium text-white/55 transition hover:bg-white/[0.06] hover:text-white"><LogOut size={17} /> Sign out</button></form>
      </div>
    </aside>
  )
}
