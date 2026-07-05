'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Minus, Plus, ShieldCheck, ShoppingBasket, Trash2, Truck } from 'lucide-react'
import { cartItemKey, useCart } from '@/components/cart-provider'
import ProductImage from '@/components/product-image'
import { buttonClasses } from '@/components/ui/button'
import { calcShipping, FREE_SHIPPING_THRESHOLD } from '@/lib/shipping'

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, totalItems, totalAmount } = useCart()

  if (!items.length) return (
    <main className="flex flex-1 items-center justify-center bg-surface px-4 py-20 text-center">
      <div><span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand/10 text-brand"><ShoppingBasket size={34} /></span><h1 className="mt-5 text-3xl font-extrabold text-ink">Your cart is empty</h1><p className="mt-2 text-sm text-body">Explore quality farm essentials and add what you need.</p><Link href="/products" className={`${buttonClasses('primary', 'lg')} mt-6`}>Browse products</Link></div>
    </main>
  )

  const shipping = calcShipping(totalAmount)
  const grandTotal = totalAmount + shipping
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - totalAmount)
  const progress = Math.min(100, (totalAmount / FREE_SHIPPING_THRESHOLD) * 100)

  return (
    <main className="flex-1 bg-surface">
      <div className="w-full px-4 py-10 sm:px-6 lg:px-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Your basket</p><h1 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">Shopping cart</h1></div><p className="text-sm font-medium text-body">{totalItems} {totalItems === 1 ? 'item' : 'items'}</p></div>

        <div className="grid gap-7 lg:grid-cols-[1fr_360px] lg:items-start">
          <section>
            <div className="mb-4 rounded-2xl border border-brand/15 bg-card p-4">
              <div className="flex items-center gap-2 text-sm"><Truck size={18} className="text-brand" />{remaining > 0 ? <span className="text-body">Add <strong className="text-brand-dark">₹{remaining}</strong> more for free delivery</span> : <strong className="text-brand-dark">You unlocked free delivery</strong>}</div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand/10"><motion.div className="h-full rounded-full bg-gradient-to-r from-brand to-success" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.55, ease: 'easeOut' }} /></div>
            </div>

            <div className="max-h-[720px] space-y-3 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.article key={cartItemKey(item)} layout exit={{ opacity: 0, x: -18 }} className="flex gap-4 rounded-2xl border border-line bg-card p-3 shadow-card sm:p-4">
                    <Link href={`/products/${item.id}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-50 sm:h-28 sm:w-28"><ProductImage src={item.image_url} alt={item.name} className="h-full w-full object-cover transition hover:scale-105" /></Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3"><div><Link href={`/products/${item.id}`} className="clamp-2 text-sm font-bold leading-5 text-ink hover:text-brand sm:text-base">{item.name}</Link>{item.variant_label && <p className="mt-1 text-xs font-medium text-muted">Pack: {item.variant_label}</p>}</div><button onClick={() => removeFromCart(cartItemKey(item))} aria-label={`Remove ${item.name}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-danger/10 hover:text-danger"><Trash2 size={16} /></button></div>
                      <p className="mt-1 font-display text-lg font-extrabold text-brand">₹{item.price}</p>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center rounded-full border border-line bg-white p-0.5"><button onClick={() => updateQuantity(cartItemKey(item), item.quantity - 1)} disabled={item.quantity <= 1} aria-label="Decrease quantity" className="flex h-8 w-8 items-center justify-center rounded-full text-body hover:bg-surface hover:text-brand disabled:opacity-30"><Minus size={14} /></button><motion.span key={item.quantity} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="w-8 text-center text-sm font-bold text-ink">{item.quantity}</motion.span><button onClick={() => updateQuantity(cartItemKey(item), item.quantity + 1)} disabled={item.quantity >= item.stock} aria-label="Increase quantity" className="flex h-8 w-8 items-center justify-center rounded-full text-body hover:bg-surface hover:text-brand disabled:opacity-30"><Plus size={14} /></button></div>
                        <span className="text-sm font-extrabold text-ink sm:text-base">₹{item.price * item.quantity}</span>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
            <Link href="/products" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand hover:gap-2.5"><ArrowLeft size={16} /> Continue shopping</Link>
          </section>

          <aside className="rounded-2xl border border-line bg-card p-5 shadow-soft lg:sticky lg:top-24">
            <h2 className="font-display text-xl font-bold text-ink">Order summary</h2>
            <div className="mt-5 space-y-3 text-sm text-body"><div className="flex justify-between"><span>Subtotal ({totalItems} items)</span><span className="font-semibold text-ink">₹{totalAmount}</span></div><div className="flex justify-between"><span>Delivery</span><span className={shipping === 0 ? 'font-bold text-brand' : 'font-semibold text-ink'}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div></div>
            <div className="mt-5 flex items-center justify-between border-t border-line pt-5"><div><p className="font-bold text-ink">Total</p><p className="text-[11px] text-muted">Inclusive of all taxes</p></div><span className="font-display text-2xl font-extrabold text-brand">₹{grandTotal}</span></div>
            <Link href="/checkout" className={`${buttonClasses('primary', 'lg')} mt-6 w-full`}>Proceed to checkout</Link>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-muted"><ShieldCheck size={14} className="text-brand" /> Secure checkout with Razorpay</p>
          </aside>
        </div>
      </div>
    </main>
  )
}
