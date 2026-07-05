'use client'

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
type Toast = { id: number; message: string; type: ToastType }

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const STYLES: Record<ToastType, { icon: typeof CheckCircle2; ring: string; iconColor: string }> = {
  success: { icon: CheckCircle2, ring: 'border-brand/30', iconColor: 'text-brand' },
  error: { icon: XCircle, ring: 'border-danger/30', iconColor: 'text-danger' },
  info: { icon: Info, ring: 'border-line', iconColor: 'text-body' },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++counter.current
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3200)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:right-6 sm:top-6">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const { icon: Icon, ring, iconColor } = STYLES[t.type]
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 40, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-card px-4 py-3 shadow-[0_8px_30px_rgba(15,23,42,0.12)] ${ring}`}
              >
                <Icon size={20} className={`mt-0.5 shrink-0 ${iconColor}`} />
                <p className="text-sm font-medium text-ink">{t.message}</p>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx.toast
}
