'use client'

import { useEffect, useRef, useState } from 'react'

// Counts from 0 → `value` once the element scrolls into view.
// `prefix`/`suffix` wrap the number (e.g. "₹", "+", "★").
export default function CountUp({
  value,
  duration = 1600,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}: {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return
        started.current = true

        const start = performance.now()
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1)
          // easeOutCubic — fast then settle (no bounce)
          const eased = 1 - Math.pow(1 - progress, 3)
          setDisplay(value * eased)
          if (progress < 1) requestAnimationFrame(tick)
          else setDisplay(value)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.4 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [value, duration])

  const formatted = display.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
