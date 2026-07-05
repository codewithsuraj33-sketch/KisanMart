'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'

// GitHub/YouTube-style thin green progress bar that flashes on route change.
export default function TopProgress() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const done = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(done)
  }, [pathname])

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="fixed inset-x-0 top-0 z-[110] h-0.5 origin-left bg-gradient-to-r from-brand via-brand to-accent"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1 }}
          exit={{ scaleX: 1, opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
        />
      )}
    </AnimatePresence>
  )
}
