import type { QuizStatus } from '@/api/types'
import { Icon } from './Icon'

const STATUS_STYLES: Record<QuizStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-paper-deep text-ink-muted' },
  PUBLISHED: { label: 'Coming soon', className: 'bg-volt-faint text-ink' },
  OPEN: { label: 'Open', className: 'bg-volt text-ink' },
  LIVE: { label: 'Live', className: 'bg-ink text-volt' },
  ENDED: { label: 'Ended', className: 'bg-amber-soft text-ink' },
  VALIDATING: { label: 'Validating', className: 'bg-amber-soft text-ink' },
  FINALIZED: { label: 'Finalized', className: 'bg-success-soft text-success' },
  SETTLED: { label: 'Settled', className: 'bg-success-soft text-success' },
  CANCELLED: { label: 'Cancelled', className: 'bg-paper-deep text-ink-muted' },
  REFUNDING: { label: 'Refunding', className: 'bg-amber-soft text-ink' },
  REFUNDED: { label: 'Refunded', className: 'bg-paper-deep text-ink-muted' },
}

export function StatusPill({ status, className = '' }: { status: QuizStatus; className?: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-bold ${style.className} ${className}`}
    >
      {status === 'LIVE' ? (
        <Icon name="lightning" size={11} weight="bold" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-pill bg-current" aria-hidden />
      )}
      {style.label}
    </span>
  )
}
