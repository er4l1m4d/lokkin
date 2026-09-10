interface MeterBarProps {
  /** current value */
  value: number
  /** value considered "good enough" — marker shown here */
  target?: number
  max: number
  label?: string
}

export function MeterBar({ value, target, max, label }: MeterBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const targetPct = target !== undefined && max > 0 ? Math.min(100, (target / max) * 100) : null
  const reached = target !== undefined && value >= target

  return (
    <div className="w-full">
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-ink-soft">
          <span>{label}</span>
          <span className={`tabular-nums ${reached ? 'text-success' : ''}`}>
            {value}/{max}
          </span>
        </div>
      )}
      <div className="relative h-3 overflow-visible rounded-pill border-2 border-ink bg-surface">
        <div
          className={`h-full rounded-pill transition-all duration-500 ${reached ? 'bg-success' : 'bg-volt'}`}
          style={{ width: `${pct}%` }}
        />
        {targetPct !== null && (
          <div
            className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-ink"
            style={{ left: `${targetPct}%` }}
            aria-hidden
          />
        )}
      </div>
    </div>
  )
}
