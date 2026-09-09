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
  primary: 'bg-primary-dark text-white shadow-lift hover:bg-primary-deep active:bg-primary-deep',
  secondary: 'border-2 border-line bg-surface text-ink hover:border-primary-soft hover:bg-primary-faint active:bg-primary-soft',
  danger: 'bg-danger-dark text-white shadow-tap hover:bg-danger',
  ghost: 'bg-transparent text-primary-dark hover:bg-primary-faint',
}

const sizes: Record<Size, string> = {
  sm: 'min-h-11 px-4 py-2 text-sm',
  md: 'min-h-11 px-6 py-3 text-base',
  lg: 'min-h-12 w-full px-6 py-3.5 text-lg font-extrabold',
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
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-pill font-semibold transition-all duration-200 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
