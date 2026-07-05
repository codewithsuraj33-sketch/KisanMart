'use client'

import { usePathname } from 'next/navigation'

// Customer navbar ko /admin routes pe hide karta hai
// (admin ka apna alag nav hai — admin/layout.tsx mein)
export default function NavbarGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null
  return <>{children}</>
}
