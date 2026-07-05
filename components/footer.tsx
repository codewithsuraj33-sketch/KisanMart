import Link from 'next/link'
import { Leaf, Mail, Phone, MapPin } from 'lucide-react'

// Brand/social icons as inline SVGs
function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z" />
    </svg>
  )
}
function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
      <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4a3.8 3.8 0 0 1-1.4-.9 3.8 3.8 0 0 1-.9-1.4c-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.2.4-.3 1-.4 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1a3.5 3.5 0 0 0-.8-1.3 3.5 3.5 0 0 0-1.3-.8c-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1Zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm0 8.1a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm6.2-8.3a1.1 1.1 0 1 1-2.3 0 1.1 1.1 0 0 1 2.3 0Z" />
    </svg>
  )
}
function IconTwitter() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M18.2 2.3h3.3l-7.2 8.2 8.5 11.2h-6.7l-5.2-6.8-6 6.8H1.6l7.7-8.8L1.1 2.3H8l4.7 6.2 5.5-6.2Zm-1.2 17.6h1.8L7.1 4.1H5.2l11.8 15.8Z" />
    </svg>
  )
}
function IconYoutube() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
      <path d="M23 7.5s-.2-1.6-.9-2.3c-.9-.9-1.9-.9-2.3-1C16.5 4 12 4 12 4s-4.5 0-7.8.2c-.4.1-1.4.1-2.3 1-.7.7-.9 2.3-.9 2.3S.8 9.3.8 11.1v1.7c0 1.9.2 3.7.2 3.7s.2 1.6.9 2.3c.9.9 2 .9 2.5 1 1.8.1 7.6.2 7.6.2s4.5 0 7.8-.2c.4-.1 1.4-.1 2.3-1 .7-.7.9-2.3.9-2.3s.2-1.9.2-3.7v-1.7c0-1.8-.2-3.6-.2-3.6ZM9.7 14.8V9l4.9 2.9-4.9 2.9Z" />
    </svg>
  )
}

const SOCIALS = [
  { Icon: IconFacebook, href: 'https://facebook.com', label: 'Facebook' },
  { Icon: IconInstagram, href: 'https://instagram.com', label: 'Instagram' },
  { Icon: IconTwitter, href: 'https://twitter.com', label: 'Twitter' },
  { Icon: IconYoutube, href: 'https://youtube.com', label: 'Youtube' },
]

const CATEGORIES = ['Seeds', 'Fertilizers', 'Pesticides', 'Tools', 'Irrigation']

function PayBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-7 items-center justify-center rounded-md bg-white px-2 text-[11px] font-bold tracking-tight text-ink shadow-sm">
      {children}
    </span>
  )
}

export default function Footer() {
  return (
    <footer id="about" className="mt-auto border-t-[3px] border-brand bg-ink text-slate-400">
      <div className="w-full px-4 py-14 sm:px-6 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 font-display text-xl font-extrabold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
                <Leaf size={20} />
              </span>
              <span>
                <span className="text-brand">Kisan</span>
                <span className="text-accent">Mart</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Empowering Indian farmers with quality-tested seeds, fertilizers and
              tools — delivered to your doorstep.
            </p>
            <div className="mt-5 flex gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-300 transition hover:bg-brand hover:text-white"
                >
                  <s.Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">Quick Links</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { href: '/', label: 'Home' },
                { href: '/products', label: 'All Products' },
                { href: '/#categories', label: 'Categories' },
                { href: '/orders', label: 'My Orders' },
                { href: '/wishlist', label: 'Wishlist' },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="transition hover:text-brand">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">Categories</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <Link href="/products" className="transition hover:text-brand">{c}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + app */}
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">Get in Touch</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="text-brand" /> support@kisanmart.in
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="text-brand" /> +91 98765 43210
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="mt-0.5 shrink-0 text-brand" /> Krishi Bhavan, New Delhi, India
              </li>
            </ul>
            <div className="mt-5 flex gap-2">
              <span className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300">
                📱 App — Coming Soon
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} KisanMart. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="mr-1 text-xs text-slate-500">We accept</span>
            <PayBadge>VISA</PayBadge>
            <PayBadge>
              <span className="text-red-500">●</span>
              <span className="-ml-1 text-amber-500">●</span>
            </PayBadge>
            <PayBadge>UPI</PayBadge>
            <PayBadge>Razorpay</PayBadge>
          </div>
        </div>
      </div>
    </footer>
  )
}
