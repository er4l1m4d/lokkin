import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api'
import type { Quiz } from '@/api/types'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { QuizCard } from '@/components/QuizCard'
import { useSession } from '@/context/useSession'
import { usePolling } from '@/hooks/usePolling'

type Filter = 'ALL' | 'OPEN' | 'LIVE' | 'VALIDATING' | 'SETTLED'

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'OPEN', label: 'Open' },
  { id: 'LIVE', label: 'Live' },
  { id: 'VALIDATING', label: 'Validating' },
  { id: 'SETTLED', label: 'Settled' },
]

/** Sort: joinable first (OPEN, then LIVE), then by soonest start, rest after */
function sortQuizzes(quizzes: Quiz[]): Quiz[] {
  const weight = (q: Quiz) => {
    if (q.status === 'OPEN') return 0
    if (q.status === 'LIVE') return 1
    if (q.status === 'VALIDATING' || q.status === 'ENDED' || q.status === 'FINALIZED') return 2
    return 3
  }
  return [...quizzes].sort((a, b) => {
    const w = weight(a) - weight(b)
    if (w !== 0) return w
    const at = a.startsAt ? Date.parse(a.startsAt) : Number.POSITIVE_INFINITY
    const bt = b.startsAt ? Date.parse(b.startsAt) : Number.POSITIVE_INFINITY
    return at - bt
  })
}

export function HomeScreen() {
  const { user, mode } = useSession()
  const [filter, setFilter] = useState<Filter>('ALL')

  const { data: quizzes, error } = usePolling<Quiz[]>(() => api.listQuizzes(), {
    intervalMs: 6000,
  })

  const filtered = useMemo(() => {
    const list = quizzes ?? []
    const sorted = sortQuizzes(list)
    if (filter === 'ALL') return sorted
    if (filter === 'VALIDATING') {
      return sorted.filter((q) => q.status === 'VALIDATING' || q.status === 'ENDED' || q.status === 'FINALIZED')
    }
    return sorted.filter((q) => q.status === filter)
  }, [quizzes, filter])

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold tracking-wide text-primary-dark uppercase">
              {mode === 'commitment' ? 'Commitment mode' : mode === 'practice' ? 'Practice mode' : 'Demo mode'}
            </p>
            <h1 className="font-display text-2xl font-black text-ink">
              {greeting()}, {user?.displayName.split(' ')[0]}
            </h1>
          </div>
          <Link
            to="/profile"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-pill bg-primary-soft font-display text-base font-extrabold text-primary-dark transition-colors hover:bg-primary hover:text-white"
            aria-label="Your profile"
          >
            {user?.displayName.charAt(0).toUpperCase()}
          </Link>
        </header>

        <section className="relative overflow-hidden rounded-card bg-surface p-5 shadow-soft">
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-pill bg-primary-faint" aria-hidden />
          <div className="relative flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-primary text-white" aria-hidden>
              <Icon name="spark" size={20} />
            </div>
            <div>
              <h2 className="text-lg text-ink">What will you lock in today?</h2>
              <p className="mt-1 max-w-[34ch] text-sm leading-relaxed text-ink-soft">
                Pick a challenge, trust your prep, and make every answer count.
              </p>
            </div>
          </div>
        </section>

        <div
          className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5"
          role="tablist"
          aria-label="Filter quizzes by status"
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`min-h-11 shrink-0 cursor-pointer rounded-pill px-4 py-2 text-xs font-bold transition-colors ${
                filter === f.id
                  ? 'bg-ink text-white'
                  : 'bg-surface text-ink-soft shadow-tap'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && !quizzes ? (
          <EmptyState
            icon={<Icon name="refresh" size={26} />}
            title="Can't reach the quizzes"
            description="Check your connection — we keep trying."
          />
        ) : filtered.length === 0 ? (
          quizzes === null ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-card bg-surface-muted" />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Icon name="podium" size={26} />}
              title={filter === 'ALL' ? 'No quizzes yet' : `No ${filter.toLowerCase()} quizzes`}
              description="Be the first — turn your study material into a challenge."
              action={
                <Link to="/create">
                  <Button size="sm">Create a quiz</Button>
                </Link>
              }
            />
          )
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        )}
        <div className="pointer-events-none sticky bottom-24 z-30 flex justify-end">
          <Link
            to="/create"
            className="pointer-events-auto flex min-h-12 items-center gap-2 rounded-pill bg-primary-dark px-5 font-bold text-white shadow-lift transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <Icon name="spark" size={17} />
            Create quiz
          </Link>
        </div>
      </div>
    </AppShell>
  )
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
