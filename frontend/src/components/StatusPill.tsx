import type { QuizStatus } from '@/api/types'

const STATUS_STYLES: Record<QuizStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-canvas-deep text-ink-muted' },
  PUBLISHED: { label: 'Coming soon', className: 'bg-primary-faint text-ink-soft' },
  OPEN: { label: 'Open', className: 'bg-primary-soft text-primary-deep' },
  LIVE: { label: 'Live', className: 'bg-danger-soft text-danger' },
  ENDED: { label: 'Ended', className: 'bg-amber-soft text-ink' },
  VALIDATING: { label: 'Validating', className: 'bg-amber-soft text-ink' },
  FINALIZED: { label: 'Finalized', className: 'bg-success-soft text-success' },
  SETTLED: { label: 'Settled', className: 'bg-success-soft text-success' },
  CANCELLED: { label: 'Cancelled', className: 'bg-canvas-deep text-ink-muted' },
  REFUNDING: { label: 'Refunding', className: 'bg-amber-soft text-ink' },
  REFUNDED: { label: 'Refunded', className: 'bg-canvas-deep text-ink-muted' },
}

export function StatusPill({ status, className = '' }: { status: QuizStatus; className?: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT
  return (
    <span
      className={`inline-flex items-center rounded-pill px-3 py-1 text-xs font-bold tracking-wide uppercase ${style.className} ${className}`}
    >
      {style.label}
    </span>
  )
}
