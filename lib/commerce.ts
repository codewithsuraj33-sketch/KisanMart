export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'paid',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
] as const

export const TRACKING_STEPS = [
  { key: 'confirmed', label: 'Confirmed', labelHi: 'पुष्टि' },
  { key: 'packed', label: 'Packed', labelHi: 'पैक हुआ' },
  { key: 'shipped', label: 'Shipped', labelHi: 'भेजा गया' },
  { key: 'delivered', label: 'Delivered', labelHi: 'पहुंच गया' },
] as const

export function statusProgress(status: string) {
  if (status === 'cancelled') return -1
  if (status === 'pending') return 0
  if (status === 'confirmed' || status === 'paid') return 1
  if (status === 'packed') return 2
  if (status === 'shipped') return 3
  if (status === 'delivered') return 4
  return 0
}

export function money(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value)
}

export function expectedDeliveryDate(days = 6) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}
