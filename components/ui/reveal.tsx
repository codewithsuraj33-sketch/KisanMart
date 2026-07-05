'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'

// Fade-in + slight upward reveal when scrolled into view. Runs once.
export default function Reveal({
  children,
  delay = 0,
  className,
  ...rest
}: {
  children: React.ReactNode
  delay?: number
  className?: string
} & HTMLMotionProps<'div'>) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, ease: 'easeOut', delay }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
