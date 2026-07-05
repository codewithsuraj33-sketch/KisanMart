'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X, TrendingUp, Loader2 } from 'lucide-react'
import ProductImage from './product-image'

type Suggestion = { id: string; name: string; price: number; image_url: string | null }

// Full-width search overlay that fetches live product suggestions.
export default function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [popular, setPopular] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Focus input + lock scroll while open; Esc to close.
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => inputRef.current?.focus(), 60)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  // Debounced suggestions fetch.
  useEffect(() => {
    if (!open) return
    const handle = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search-suggestions?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setSuggestions(data.suggestions ?? [])
        setPopular(data.popular ?? [])
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 220)
    return () => clearTimeout(handle)
  }, [query, open])

  function go(path: string) {
    onClose()
    setQuery('')
    router.push(path)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    go(q ? `/products?q=${encodeURIComponent(q)}` : '/products')
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] bg-ink/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="mx-auto w-full max-w-3xl px-4 pt-24"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-[0_20px_70px_rgba(15,23,42,0.25)]">
              <form onSubmit={submit} className="flex items-center gap-3 border-b border-line px-5 py-4">
                <Search size={20} className="shrink-0 text-brand" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search seeds, fertilizers, tools…"
                  className="w-full bg-transparent text-lg text-ink outline-none placeholder:text-muted"
                />
                {loading && <Loader2 size={18} className="animate-spin text-muted" />}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close search"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-surface hover:text-ink"
                >
                  <X size={18} />
                </button>
              </form>

              <div className="max-h-[50vh] overflow-y-auto p-2">
                {suggestions.length > 0 ? (
                  suggestions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => go(`/products/${s.id}`)}
                      className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-surface"
                    >
                      <ProductImage
                        src={s.image_url}
                        alt={s.name}
                        className="h-11 w-11 shrink-0 rounded-lg object-cover"
                      />
                      <span className="flex-1 text-sm font-medium text-ink">{s.name}</span>
                      <span className="text-sm font-semibold text-brand">₹{s.price}</span>
                    </button>
                  ))
                ) : (
                  <div className="p-3">
                    <p className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
                      <TrendingUp size={13} /> Popular searches
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {popular.map((term) => (
                        <button
                          key={term}
                          onClick={() => go(`/products?q=${encodeURIComponent(term)}`)}
                          className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-body transition hover:border-brand/40 hover:text-brand"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
