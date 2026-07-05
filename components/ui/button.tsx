import type { ButtonHTMLAttributes } from 'react'

// Reusable button styling used by both <button> and <Link> CTAs.
// Pill-shaped, brand-coloured, with subtle press/hover scale.
export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'outline' | 'dark'
export type ButtonSize = 'sm' | 'md' | 'lg'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 will-change-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 hover:scale-[1.02] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100'

const VARIANTS: Record<ButtonVariant, string> = {
  // Solid leaf green → deepens to forest green on hover
  primary:
    'bg-brand text-white shadow-sm hover:bg-brand-dark focus-visible:ring-brand',
  // Solid amber
  accent:
    'bg-accent text-white shadow-sm hover:bg-accent-dark focus-visible:ring-accent',
  // Alias of accent (kept for existing call sites)
  secondary:
    'bg-accent text-white shadow-sm hover:bg-accent-dark focus-visible:ring-accent',
  // Ghost with green border
  outline:
    'border border-brand/40 bg-transparent text-brand hover:bg-brand/5 focus-visible:ring-brand',
  // Near-black
  dark: 'bg-ink text-white shadow-sm hover:bg-ink/90 focus-visible:ring-ink',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className = ''
): string {
  return [BASE, VARIANTS[variant], SIZES[size], className].filter(Boolean).join(' ')
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  return <button className={buttonClasses(variant, size, className)} {...props} />
}
