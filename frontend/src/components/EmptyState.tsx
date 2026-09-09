import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border-2 border-dashed border-line bg-surface-muted px-6 py-12 text-center">
      {icon && <div className="flex h-12 w-12 items-center justify-center rounded-card bg-primary-faint text-primary-dark" aria-hidden>{icon}</div>}
      <h3 className="font-display text-lg font-extrabold text-ink">{title}</h3>
      {description && <p className="max-w-xs text-sm leading-relaxed text-ink-soft">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
