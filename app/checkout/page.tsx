'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Banknote, Check, CreditCard, MapPin, Tag } from 'lucide-react'
import { useCart } from '@/components/cart-provider'
import { createClient } from '@/lib/supabase/client'
import { calcShipping } from '@/lib/shipping'
import type { Address } from '@/lib/types'

type RazorpayResponse = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}
interface RazorpayInstance { open: () => void }
interface RazorpayConstructor { new (options: Record<string, unknown>): RazorpayInstance }

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

const emptyForm = { name: '', phone: '', address: '', city: '', state: '', pincode: '' }

export default function CheckoutPage() {
  const { items, totalAmount, clearCart } = useCart()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null | undefined>(undefined)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [form, setForm] = useState(emptyForm)
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('cod')
  const [codAvailable, setCodAvailable] = useState(true)
  const [deliveryMessage, setDeliveryMessage] = useState('')
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null)
  const [couponMessage, setCouponMessage] = useState('')
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [redeemPoints, setRedeemPoints] = useState(false)
  const [saveAddress, setSaveAddress] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user
      setUserEmail(user?.email ?? null)
      if (!user) return
      const [{ data: saved }, { data: profile }] = await Promise.all([
        supabase.from('addresses').select('*').order('is_default', { ascending: false }).order('created_at'),
        supabase.from('profiles').select('full_name, phone, loyalty_points').eq('id', user.id).maybeSingle(),
      ])
      const addressList = (saved ?? []) as Address[]
      setAddresses(addressList)
      setLoyaltyPoints(Number(profile?.loyalty_points ?? 0))
      const selected = addressList.find((address) => address.is_default) ?? addressList[0]
      if (selected) selectAddress(selected)
      else setForm((current) => ({
        ...current,
        name: profile?.full_name ?? String(user.user_metadata.full_name ?? ''),
        phone: profile?.phone ?? String(user.user_metadata.phone ?? ''),
      }))
    })
  }, [])

  useEffect(() => {
    if (!/^\d{6}$/.test(form.pincode)) {
      return
    }
    const controller = new AbortController()
    fetch(`/api/delivery-check?pincode=${form.pincode}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        setDeliveryMessage(data.available ? `Delivery: ${data.estimatedDate}` : data.message)
        setCodAvailable(Boolean(data.available && data.codAvailable))
        if (!data.codAvailable) setPaymentMethod('online')
      })
      .catch(() => undefined)
    return () => controller.abort()
  }, [form.pincode])

  const shippingCost = calcShipping(totalAmount)
  const pointsToUse = redeemPoints ? Math.min(loyaltyPoints, Math.floor(totalAmount * 0.2)) : 0
  const grandTotal = useMemo(
    () => Math.max(0, totalAmount - (coupon?.discount ?? 0) - pointsToUse + shippingCost),
    [totalAmount, coupon, pointsToUse, shippingCost]
  )

  function selectAddress(address: Address) {
    setForm({
      name: address.full_name, phone: address.phone, address: address.address_line,
      city: address.city, state: address.state, pincode: address.pincode,
    })
    setSaveAddress(false)
  }

  async function applyCoupon() {
    setCouponMessage('Checking coupon…')
    const response = await fetch('/api/coupons/validate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponInput, subtotal: totalAmount }),
    })
    const data = await response.json()
    if (!response.ok) {
      setCoupon(null)
      setCouponMessage(data.error ?? 'Coupon apply nahi hua')
      return
    }
    setCoupon({ code: data.code, discount: Number(data.discount) })
    setCouponInput(data.code)
    setCouponMessage(data.message)
  }

  async function handleOrder(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const response = await fetch('/api/create-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({ id: item.id, quantity: item.quantity, variantId: item.variant_id ?? null })),
          shipping: form, paymentMethod, couponCode: coupon?.code ?? '', saveAddress,
          addressLabel: 'Home', makeDefaultAddress: addresses.length === 0, redeemPoints,
        }),
      })
      if (response.status === 401) return router.push('/login')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Order place nahi hua')

      if (data.cod) {
        clearCart()
        router.push(`/orders/${data.dbOrderId}`)
        return
      }

      if (!(await loadRazorpayScript())) throw new Error('Razorpay load nahi hua. Internet check karein.')
      const Razorpay = (window as unknown as { Razorpay: RazorpayConstructor }).Razorpay
      const payment = new Razorpay({
        key: data.key, amount: data.amount, currency: data.currency, name: 'KisanMart',
        description: coupon ? `Order · ${coupon.code} applied` : 'Order payment',
        order_id: data.razorpayOrderId,
        prefill: { name: form.name, contact: form.phone, email: userEmail ?? '' },
        theme: { color: '#16803c' },
        handler: async (result: RazorpayResponse) => {
          const verify = await fetch('/api/verify-payment', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...result, dbOrderId: data.dbOrderId }),
          })
          if (!verify.ok) {
            setError('Payment verify nahi hua. Paisa kata ho to support se sampark karein.')
            setLoading(false)
            return
          }
          clearCart()
          router.push(`/orders/${data.dbOrderId}`)
        },
        modal: { ondismiss: () => setLoading(false) },
      })
      payment.open()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Network error. Dobara try karein.')
      setLoading(false)
    }
  }

  if (userEmail === undefined) return <main className="flex flex-1 items-center justify-center py-20 text-muted">Checkout loading…</main>
  if (userEmail === null) return <Empty title="Order ke liye login zaroori hai" href="/login" action="Login" />
  if (!items.length) return <Empty title="Aapka cart khaali hai" href="/products" action="Products dekhein" />

  const inputClass = 'w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10'

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold text-ink">Secure checkout</h1>
      <p className="mt-1 text-sm text-muted">Address, offer aur payment option confirm karein.</p>
      <form onSubmit={handleOrder} className="mt-7 grid gap-7 lg:grid-cols-[1fr_390px]">
        <div className="space-y-6">
          {addresses.length > 0 && (
            <section className="rounded-2xl border border-line bg-card p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 font-bold text-ink"><MapPin size={18} className="text-brand" /> Saved addresses</h2><Link href="/addresses" className="text-xs font-bold text-brand">Manage</Link></div>
              <div className="grid gap-3 sm:grid-cols-2">
                {addresses.map((address) => {
                  const active = form.address === address.address_line && form.pincode === address.pincode
                  return <button key={address.id} type="button" onClick={() => selectAddress(address)} className={`rounded-xl border p-3 text-left text-sm transition ${active ? 'border-brand bg-brand/5 ring-2 ring-brand/10' : 'border-line hover:border-brand/30'}`}><span className="flex items-center justify-between font-bold text-ink">{address.label}{active && <Check size={16} className="text-brand" />}</span><span className="mt-1 block text-xs leading-5 text-body">{address.address_line}, {address.city} · {address.pincode}</span></button>
                })}
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-line bg-card p-5 shadow-card">
            <h2 className="mb-4 font-bold text-ink">Delivery address</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="name" required placeholder="Poora naam" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} />
              <input name="phone" required type="tel" placeholder="Phone number" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={inputClass} />
              <input name="address" required placeholder="House, street, village/area" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className={`${inputClass} sm:col-span-2`} />
              <input name="city" required placeholder="City / District" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className={inputClass} />
              <input name="state" required placeholder="State" value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} className={inputClass} />
              <div><input name="pincode" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="6-digit pincode" value={form.pincode} onChange={(event) => { const pincode = event.target.value.replace(/\D/g, ''); setForm({ ...form, pincode }); if (pincode.length < 6) { setDeliveryMessage(''); setCodAvailable(true) } }} className={inputClass} />{deliveryMessage && <p className={`mt-1.5 text-xs ${deliveryMessage.startsWith('Delivery:') ? 'text-brand' : 'text-danger'}`}>{deliveryMessage}</p>}</div>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm text-body"><input type="checkbox" checked={saveAddress} onChange={(event) => setSaveAddress(event.target.checked)} className="accent-brand" /> Is address ko future orders ke liye save karein</label>
          </section>

          <section className="rounded-2xl border border-line bg-card p-5 shadow-card">
            <h2 className="mb-4 font-bold text-ink">Payment method</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <PaymentOption active={paymentMethod === 'cod'} disabled={!codAvailable} onClick={() => setPaymentMethod('cod')} icon={Banknote} title="Cash on Delivery" note={codAvailable ? 'Delivery par cash/UPI dein' : 'Is pincode par unavailable'} />
              <PaymentOption active={paymentMethod === 'online'} onClick={() => setPaymentMethod('online')} icon={CreditCard} title="Pay online" note="UPI, cards, netbanking via Razorpay" />
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-brand/15 bg-card p-5 shadow-soft lg:sticky lg:top-28">
          <h2 className="font-display text-xl font-bold text-ink">Order summary</h2>
          <div className="mt-4 flex gap-2"><div className="relative flex-1"><Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={couponInput} onChange={(event) => setCouponInput(event.target.value.toUpperCase())} placeholder="Coupon code" className="h-11 w-full rounded-xl border border-line pl-9 pr-3 text-sm uppercase outline-none focus:border-brand" /></div><button type="button" onClick={applyCoupon} disabled={!couponInput.trim()} className="rounded-xl bg-ink px-4 text-xs font-bold text-white disabled:opacity-40">Apply</button></div>
          {couponMessage && <p className={`mt-2 text-xs ${coupon ? 'text-brand' : 'text-danger'}`}>{couponMessage}</p>}
          {loyaltyPoints > 0 && <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-xl border border-brand/15 bg-brand/5 p-3"><input type="checkbox" checked={redeemPoints} onChange={(event) => setRedeemPoints(event.target.checked)} className="mt-0.5 accent-brand" /><span><strong className="block text-xs text-ink">Use Kisan Rewards</strong><small className="text-xs text-body">{loyaltyPoints} points available · up to 20% order value</small></span></label>}
          <div className="mt-5 space-y-2 text-sm text-body">
            <Row label={`Items (${items.reduce((sum, item) => sum + item.quantity, 0)})`} value={`₹${totalAmount.toLocaleString('en-IN')}`} />
            <Row label="Shipping" value={shippingCost ? `₹${shippingCost}` : 'FREE'} />
            {coupon && <Row label={`Discount (${coupon.code})`} value={`−₹${coupon.discount.toLocaleString('en-IN')}`} green />}
            {pointsToUse > 0 && <Row label={`Rewards (${pointsToUse} points)`} value={`−₹${pointsToUse.toLocaleString('en-IN')}`} green />}
          </div>
          <div className="mt-4 flex justify-between border-t border-line pt-4 text-lg font-extrabold text-ink"><span>Total</span><span className="text-brand">₹{grandTotal.toLocaleString('en-IN')}</span></div>
          {error && <p className="mt-4 rounded-xl border border-danger/20 bg-danger/5 p-3 text-sm text-danger">{error}</p>}
          <button type="submit" disabled={loading || (paymentMethod === 'cod' && !codAvailable)} className="mt-5 w-full rounded-xl bg-accent py-3.5 text-sm font-extrabold text-ink transition hover:brightness-95 disabled:opacity-50">{loading ? 'Processing…' : paymentMethod === 'cod' ? `Place COD Order · ₹${grandTotal.toLocaleString('en-IN')}` : `Pay ₹${grandTotal.toLocaleString('en-IN')}`}</button>
          <p className="mt-3 text-center text-xs text-muted">Price and coupon are verified securely on the server.</p>
        </aside>
      </form>
    </main>
  )
}

function Empty({ title, href, action }: { title: string; href: string; action: string }) {
  return <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center"><h1 className="text-2xl font-bold text-ink">{title}</h1><Link href={href} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white">{action}</Link></main>
}

function Row({ label, value, green = false }: { label: string; value: string; green?: boolean }) {
  return <div className="flex justify-between"><span>{label}</span><span className={green ? 'font-bold text-brand' : 'font-medium text-ink'}>{value}</span></div>
}

function PaymentOption({ active, disabled, onClick, icon: Icon, title, note }: { active: boolean; disabled?: boolean; onClick: () => void; icon: typeof Banknote; title: string; note: string }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={`flex items-center gap-3 rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${active ? 'border-brand bg-brand/5 ring-2 ring-brand/10' : 'border-line hover:border-brand/30'}`}><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-brand text-white' : 'bg-sage text-brand'}`}><Icon size={19} /></span><span><strong className="block text-sm text-ink">{title}</strong><small className="text-xs text-muted">{note}</small></span></button>
}
