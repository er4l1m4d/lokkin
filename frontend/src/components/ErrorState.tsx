import type { ReactNode } from 'react'
import { Button } from './Button'
import { Icon } from './Icon'

interface ErrorStateProps {
  /** short, calm headline — never raw error text */
  title?: string
  description?: string
  /** extra hint, e.g. "Check your connection" */
  hint?: string
  onRetry?: () => void
  retrying?: boolean
  action?: ReactNode
}

/**
 * Full-screen error card for transient failures. Distinguishes "couldn't load"
 * (retryable) from "doesn't exist" (terminal) via the onRetry prop.
 */
export function ErrorState({
  title = "We couldn't load this",
  description = 'Something went wrong on our end.',
  hint,
  onRetry,
  retrying = false,
  action,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border-2 border-dashed border-line bg-surface-muted px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-card bg-danger-soft text-danger" aria-hidden>
        <Icon name="alert" size={24} />
      </div>
      <h2 className="font-display text-lg font-extrabold text-ink">{title}</h2>
      {description && <p className="max-w-xs text-sm leading-relaxed text-ink-soft">{description}</p>}
      {hint && <p className="text-xs font-semibold text-ink-muted">{hint}</p>}
      {onRetry && (
        <Button className="mt-2" size="sm" variant="secondary" onClick={onRetry} disabled={retrying}>
          {retrying ? 'Trying again…' : 'Try again'}
        </Button>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/** Inline alert banner for action failures (form submit, wallet send, …) */
export function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-card bg-danger-soft px-4 py-3 text-sm font-semibold text-danger" role="alert">
      {children}
    </p>
  )
}

/** Shown alongside existing data when a refresh fails — "connection lost" signal */
export function StaleBanner() {
  return (
    <p className="flex items-center justify-center gap-2 rounded-card bg-amber-soft px-4 py-2.5 text-xs font-semibold text-ink" role="status">
      <Icon name="refresh" size={14} />
      Connection hiccup — showing the latest info we have.
    </p>
  )
}
