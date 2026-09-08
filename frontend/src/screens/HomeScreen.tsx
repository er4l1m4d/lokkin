import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api'
import type { Quiz } from '@/api/types'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
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
      <div className="flex flex-col gap-5">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold tracking-wide text-ink-muted uppercase">
              {mode === 'commitment' ? 'Commitment mode' : mode === 'practice' ? 'Practice mode' : 'Demo mode'}
            </p>
            <h1 className="font-display text-2xl font-black text-ink">
              {greeting()}, {user?.displayName.split(' ')[0]}
            </h1>
          </div>
          <Link
            to="/profile"
            className="flex h-11 w-11 items-center justify-center rounded-pill bg-primary-soft font-display text-base font-extrabold text-primary-dark"
            aria-label="Your profile"
          >
            {user?.displayName.charAt(0).toUpperCase()}
          </Link>
        </header>

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
              className={`shrink-0 rounded-pill px-4 py-2 text-xs font-bold transition-colors ${
                filter === f.id
                  ? 'bg-ink text-white'
                  : 'bg-white text-ink-soft shadow-tap'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && !quizzes ? (
          <EmptyState
            icon="📡"
            title="Can't reach the quizzes"
            description="Check your connection — we keep trying."
          />
        ) : filtered.length === 0 ? (
          quizzes === null ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-card bg-white/70" />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="🎯"
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
