const KEY = 'nivora.streak'
const LAST = 'nivora.streak.last'

/** Read the current streak count (0 = never played) */
export function getStreak(): number {
  try {
    return Number(localStorage.getItem(KEY) ?? '0') || 0
  } catch {
    return 0
  }
}

/**
 * Mock-level streak: bump once per calendar day when a quiz session is
 * submitted. Consecutive days grow the streak; a skipped day resets it.
 */
export function bumpStreak(): void {
  try {
    const today = new Date().toDateString()
    const last = localStorage.getItem(LAST)
    if (last === today) return
    const yesterday = new Date(Date.now() - 86_400_000).toDateString()
    const next = last === yesterday ? getStreak() + 1 : 1
    localStorage.setItem(KEY, String(next))
    localStorage.setItem(LAST, today)
  } catch {
    /* non-essential */
  }
}
