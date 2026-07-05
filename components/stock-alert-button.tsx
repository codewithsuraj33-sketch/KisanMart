'use client'

import { useActionState } from 'react'
import { Bell } from 'lucide-react'
import { requestStockAlert, type ProductActionState } from '@/app/products/actions'

const initialState: ProductActionState = {}

export default function StockAlertButton({ productId }: { productId: string }) {
  const boundAction = requestStockAlert.bind(null, productId)
  const [state, action, pending] = useActionState(boundAction, initialState)

  return (
    <form action={action} className="mt-3">
      <button
        disabled={pending || Boolean(state.success)}
        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
      >
        <Bell size={16} /> {state.success ? 'Alert Set ✓' : pending ? 'Saving...' : 'Notify Me'}
      </button>
      {state.error && <p className="mt-2 text-xs text-red-600">{state.error}</p>}
      {state.success && <p className="mt-2 text-xs text-green-700">{state.success}</p>}
    </form>
  )
}
