'use client'

import { useActionState, useState } from 'react'
import { Check, ShoppingCart, Trash2 } from 'lucide-react'
import { useCart } from './cart-provider'
import { useLanguage } from './language-provider'
import { cancelOrder, type OrderState } from '@/app/orders/actions'

type OrderLineItem = {
  id: string
  product_id: string | null
  product_name: string
  price: number
  quantity: number
  products?: {
    id: string
    name: string
    price: number
    image_url: string | null
    weight_grams: number
    stock: number
  } | null
}

const initialState: OrderState = {}
const reasons = ['Changed my mind', 'Ordered by mistake', 'Found a better price', 'Need to adjust quantity']

export default function OrderActions({
  orderId,
  status,
  paymentStatus,
  items,
}: {
  orderId: string
  status: string
  paymentStatus: string
  items: OrderLineItem[]
}) {
  const { addToCart } = useCart()
  const { t } = useLanguage()
  const [cancelState, cancelAction, cancelPending] = useActionState(cancelOrder, initialState)
  const [added, setAdded] = useState(false)
  const cancellable = !['shipped', 'delivered', 'cancelled'].includes(status)
  const canRefund = paymentStatus === 'paid' || paymentStatus === 'pending' || paymentStatus === 'cod_pending'

  function buyAgain() {
    items.forEach((item) => {
      const product = item.products
      const quantity = Math.max(1, item.quantity)
      addToCart(
        {
          id: product?.id ?? item.product_id ?? item.id,
          name: product?.name ?? item.product_name,
          price: Number(product?.price ?? item.price),
          image_url: product?.image_url ?? null,
          stock: Math.max(product?.stock ?? quantity, quantity),
          weight_grams: product?.weight_grams ?? 0,
          variant_id: null,
          variant_label: null,
        },
        quantity
      )
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start">
      <button
        type="button"
        onClick={buyAgain}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
      >
        {added ? <Check size={18} /> : <ShoppingCart size={18} />} {added ? 'Added again' : t('buyAgain')}
      </button>

      {cancellable && (
        <form action={cancelAction} className="rounded-xl border border-line bg-surface p-4 sm:min-w-[280px] sm:flex-1">
          <input type="hidden" name="order_id" value={orderId} />
          <p className="text-sm font-bold text-ink">Cancel order</p>
          <p className="mt-1 text-xs text-body">
            {canRefund
              ? 'Paid order cancel karne par refund tracker create hoga.'
              : 'COD / pending order ko yahan se cancel kiya ja sakta hai.'}
          </p>
          <select name="reason" className="mt-3 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm">
            {reasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
          {cancelState.error && <p className="mt-2 text-xs text-danger">{cancelState.error}</p>}
          {cancelState.success && <p className="mt-2 text-xs text-brand-dark">{cancelState.success}</p>}
          <button
            type="submit"
            disabled={cancelPending}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/10 px-4 py-2 text-sm font-bold text-danger transition hover:bg-danger/15 disabled:opacity-60"
          >
            <Trash2 size={16} /> {cancelPending ? 'Cancelling...' : 'Cancel order'}
          </button>
        </form>
      )}
    </div>
  )
}
