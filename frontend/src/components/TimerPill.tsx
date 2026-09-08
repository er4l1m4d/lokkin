import { useEffect, useState } from 'react'

function format(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface TimerPillProps {
  /** deadline as a Date, or seconds remaining */
  until?: Date
  seconds?: number
  /** fires when the countdown hits zero */
  onExpire?: () => void
  /** warn color under this many seconds */
  warnUnderSeconds?: number
}

export function TimerPill({ until, seconds, onExpire, warnUnderSeconds = 30 }: TimerPillProps) {
  const remaining = () => {
    if (seconds !== undefined) return seconds
    if (until) return Math.max(0, Math.floor((until.getTime() - Date.now()) / 1000))
    return 0
  }

  const [left, setLeft] = useState(remaining)

  useEffect(() => {
    const id = setInterval(() => {
      const next = remaining()
      setLeft(next)
      if (next <= 0) {
        clearInterval(id)
        onExpire?.()
      }
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [until?.getTime(), seconds])

  const urgent = left <= warnUnderSeconds

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill px-3 py-1 font-display text-sm font-extrabold tabular-nums ${
        urgent ? 'bg-danger-soft text-danger' : 'bg-amber-soft text-ink'
      }`}
      role="timer"
      aria-label={`${format(left)} remaining`}
    >
      {format(left)}
    </span>
  )
}
