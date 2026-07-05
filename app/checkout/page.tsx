'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/components/cart-provider'
import { createClient } from '@/lib/supabase/client'
import { calcShipping } from '@/lib/shipping'

// Razorpay checkout.js jo window pe aata hai — minimal type
type RazorpayResponse = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}
interface RazorpayInstance {
  open: () => void
}
interface RazorpayConstructor {
  new (options: Record<string, unknown>): RazorpayInstance
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function CheckoutPage() {
  const { items, totalAmount, clearCart } = useCart()
  const router = useRouter()

  // undefined = check ho raha, null = logged out, string = logged in email
  const [userEmail, setUserEmail] = useState<string | null | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  })

  // Login check
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUserEmail(data.user?.email ?? null))
  }, [])

  const shippingCost = calcShipping(totalAmount)
  const grandTotal = totalAmount + shippingCost

  function updateField(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // 1) Server pe order banao (server total khud calculate karega)
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            id: i.id,
            quantity: i.quantity,
            variantId: i.variant_id ?? null,
          })),
          shipping: form,
        }),
      })

      if (res.status === 401) {
        router.push('/login')
        return
      }

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Kuch galat ho gaya')
        setLoading(false)
        return
      }

      // 2) Razorpay script load
      const ok = await loadRazorpayScript()
      if (!ok) {
        setError('Razorpay load nahi hua. Internet check karo.')
        setLoading(false)
        return
      }

      // 3) Razorpay checkout modal kholo
      const Razorpay = (window as unknown as { Razorpay: RazorpayConstructor })
        .Razorpay
      const rzp = new Razorpay({
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'KisanMart',
        description: 'Order Payment',
        order_id: data.razorpayOrderId,
        prefill: { name: form.name, contact: form.phone, email: userEmail ?? '' },
        theme: { color: '#16a34a' },
        handler: async (response: RazorpayResponse) => {
          // 4) Payment ke baad server pe VERIFY karo
          const vres = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, dbOrderId: data.dbOrderId }),
          })
          if (vres.ok) {
            clearCart()
            router.push(`/orders/${data.dbOrderId}`)
          } else {
            setError('Payment verify nahi hua. Paisa kata ho to support se baat karo.')
            setLoading(false)
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      })
      rzp.open()
    } catch {
      setError('Network error. Dobara try karo.')
      setLoading(false)
    }
  }

  // ----- UI states -----

  if (userEmail === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center py-16 text-zinc-500">
        Loading...
      </main>
    )
  }

  if (userEmail === null) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-zinc-800">Login zaroori hai</h1>
        <p className="text-sm text-zinc-500">Order place karne ke liye login karo.</p>
        <Link
          href="/login"
          className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          Login
        </Link>
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-zinc-800">Cart khaali hai</h1>
        <Link
          href="/products"
          className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          Browse Products
        </Link>
      </main>
    )
  }

  const inputClass =
    'w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100'

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-800">Checkout</h1>

      <form onSubmit={handlePayment} className="grid gap-6 lg:grid-cols-3">
        {/* Address form */}
        <div className="space-y-3 lg:col-span-2">
          <h2 className="font-semibold text-zinc-800">Delivery Address</h2>

          <input name="name" required placeholder="Poora naam" value={form.name} onChange={updateField} className={inputClass} />
          <input name="phone" required type="tel" placeholder="Phone number" value={form.phone} onChange={updateField} className={inputClass} />
          <input name="address" required placeholder="Poora address (house, street, area)" value={form.address} onChange={updateField} className={inputClass} />
          <div className="grid grid-cols-2 gap-3">
            <input name="city" required placeholder="City" value={form.city} onChange={updateField} className={inputClass} />
            <input name="state" required placeholder="State" value={form.state} onChange={updateField} className={inputClass} />
          </div>
          <input name="pincode" required placeholder="Pincode" value={form.pincode} onChange={updateField} className={inputClass} />
        </div>

        {/* Summary + Pay */}
        <div className="h-fit rounded-xl border border-green-100 bg-green-50 p-4">
          <h2 className="mb-3 font-semibold text-gray-800">Order Summary</h2>
          <div className="space-y-1 text-sm text-zinc-600">
            <div className="flex justify-between">
              <span>Items ({items.length})</span>
              <span>₹{totalAmount}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}</span>
            </div>
          </div>
          <div className="mt-3 flex justify-between border-t border-green-200 pt-3 font-bold text-gray-800">
            <span>Total</span>
            <span className="text-green-700">₹{grandTotal}</span>
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
          >
            {loading ? 'Processing...' : `Pay ₹${grandTotal}`}
          </button>
          <p className="mt-2 text-center text-xs text-gray-400">
            🔒 Secure payment via Razorpay
          </p>
        </div>
      </form>
    </div>
  )
}
