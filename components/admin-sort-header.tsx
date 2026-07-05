'use client'

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

export type SortDirection = 'asc' | 'desc'

export default function AdminSortHeader({
  label,
  active,
  direction,
  onSort,
  align = 'left',
}: {
  label: string
  active: boolean
  direction: SortDirection
  onSort: () => void
  align?: 'left' | 'right'
}) {
  const Icon = active ? (direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown

  return (
    <th className={`px-5 py-4 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        type="button"
        onClick={onSort}
        className={`inline-flex items-center gap-1.5 transition hover:text-ink ${active ? 'text-brand' : ''}`}
      >
        {label}
        <Icon size={13} />
      </button>
    </th>
  )
}
