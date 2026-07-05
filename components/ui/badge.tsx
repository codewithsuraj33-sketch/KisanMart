// Category / status tag — green-100 pill
export default function Badge({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 ${className}`}
    >
      {children}
    </span>
  )
}
