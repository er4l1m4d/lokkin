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
  primary: 'bg-primary text-white shadow-lift hover:bg-primary-dark active:bg-primary-deep',
  secondary: 'border-2 border-line bg-white text-ink hover:border-primary-soft active:bg-primary-faint',
  danger: 'bg-danger text-white shadow-tap hover:brightness-95',
  ghost: 'bg-transparent text-primary-dark hover:bg-primary-faint',
}

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'w-full px-6 py-4 font-display text-lg font-extrabold',
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
      className={`inline-flex items-center justify-center gap-2 rounded-pill font-semibold transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
