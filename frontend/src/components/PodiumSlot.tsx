import type { ResultRow } from '@/api/types'
import { Icon } from './Icon'

interface PodiumSlotProps {
  /** 1, 2 or 3 — determines podium height and medal */
  place: 1 | 2 | 3
  row: ResultRow | null
}

const MEDALS: Record<1 | 2 | 3, { label: string; block: string; iconClass: string }> = {
  1: { label: '1st', block: 'bg-amber', iconClass: 'text-amber-dark' },
  2: { label: '2nd', block: 'bg-primary', iconClass: 'text-primary-dark' },
  3: { label: '3rd', block: 'bg-accent', iconClass: 'text-accent-dark' },
}

const HEIGHTS: Record<1 | 2 | 3, string> = {
  1: 'h-24',
  2: 'h-16',
  3: 'h-12',
}

export function PodiumSlot({ place, row }: PodiumSlotProps) {
  const medal = MEDALS[place]
  const displayPlace = place === 1 ? 'order-2' : place === 2 ? 'order-1' : 'order-3'

  return (
    <div className={`flex flex-1 flex-col items-center justify-end gap-2 ${displayPlace}`}>
      <div className="text-center" aria-label={`${medal.label} place`}>
        <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-pill bg-canvas-deep ${medal.iconClass}`} aria-hidden>
          <Icon name="trophy" size={19} strokeWidth={2.1} />
        </div>
        {row ? (
          <>
            <p className="mt-1 max-w-24 truncate font-display text-sm font-extrabold text-ink">
              {row.displayName}
            </p>
            <p className="text-xs font-semibold text-ink-soft">
              {row.correctAnswers}/{row.totalQuestions}
            </p>
            <p className="font-display text-sm font-extrabold text-success">
              {(row.payout - row.entryAmount).toFixed(2)} NIM won
            </p>
          </>
        ) : (
          <p className="mt-1 text-xs font-semibold text-ink-muted">Unclaimed</p>
        )}
      </div>
      <div
        className={`w-full max-w-28 rounded-t-card ${HEIGHTS[place]} ${medal.block} shadow-tap`}
        aria-hidden
      />
    </div>
  )
}
