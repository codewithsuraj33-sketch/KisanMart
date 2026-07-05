// Consistent section header: uppercase green eyebrow, big bold heading with a
// decorative underline under the first word, and optional muted subtext.
export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  underlineFirstWord = true,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'left' | 'center'
  underlineFirstWord?: boolean
}) {
  const [firstWord, ...rest] = title.split(' ')
  const centered = align === 'center'

  return (
    <div className={centered ? 'text-center' : 'text-left'}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        <span className="relative inline-block">
          {firstWord}
          {underlineFirstWord && (
            <span
              className={`absolute -bottom-1 left-0 h-1 w-full rounded-full bg-brand/70 ${
                centered ? 'mx-auto' : ''
              }`}
            />
          )}
        </span>{' '}
        {rest.join(' ')}
      </h2>
      {subtitle && (
        <p
          className={`mt-3 max-w-xl text-base text-body ${centered ? 'mx-auto' : ''}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
