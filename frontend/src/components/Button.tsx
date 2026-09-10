import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  block?: boolean
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'press border-2 border-ink bg-volt text-ink shadow-press hover:bg-volt-deep',
  secondary: 'press border-2 border-ink bg-surface text-ink shadow-press-sm hover:bg-paper-deep',
  danger: 'press border-2 border-ink bg-danger text-white shadow-press-sm hover:bg-danger/90',
  ghost: 'text-ink hover:bg-paper-deep',
}

const sizes: Record<Size, string> = {
  sm: 'min-h-10 px-4 py-2 text-sm',
  md: 'min-h-11 px-5 py-2.5 text-[15px]',
  lg: 'min-h-13 w-full px-6 py-3.5 text-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-pill font-display font-bold tracking-tight transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
