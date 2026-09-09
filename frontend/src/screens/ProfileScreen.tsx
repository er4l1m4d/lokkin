import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/api'
import type { HistoryEntry, QuizMode } from '@/api/types'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { StatusPill } from '@/components/StatusPill'
import { useSession } from '@/context/useSession'
import { usePolling } from '@/hooks/usePolling'

const MODES: ReadonlyArray<{ id: QuizMode; label: string }> = [
  { id: 'demo', label: 'Demo' },
  { id: 'practice', label: 'Practice' },
  { id: 'commitment', label: 'Commitment' },
]

export function ProfileScreen() {
  const navigate = useNavigate()
  const { user, mode, setMode, signOut } = useSession()

  const { data: history } = usePolling<HistoryEntry[]>(
    () => (user ? api.getMyHistory(user.id) : Promise.resolve([])),
    { intervalMs: 10_000, disabled: !user },
  )

  const stats = useMemo(() => {
    const entries = history ?? []
    const played = entries.length
    const podiums = entries.filter((e) => e.rank !== null && e.rank <= 3).length
    const net = entries.reduce((sum, e) => sum + (e.payout - e.entryAmount), 0)
    return { played, podiums, net }
  }, [history])

  if (!user) return null

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <header className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-pill bg-primary-soft font-display text-2xl font-black text-primary-dark"
            aria-hidden
          >
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-black text-ink">
              {user.displayName}
            </h1>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-pill bg-canvas-deep px-3 py-1 text-[11px] font-bold text-ink-soft">
              <Icon name="wallet" size={14} />
              {user.walletAddress
                ? `${user.walletAddress.slice(0, 8)}…`
                : 'No wallet — links with Nimiq in real mode'}
            </span>
          </div>
        </header>

        <section className="grid grid-cols-3 gap-3">
          <StatCard label="Quizzes" value={`${stats.played}`} />
          <StatCard label="Podiums" value={`${stats.podiums}`} />
          <StatCard
            label="Net NIM"
            value={`${stats.net >= 0 ? '+' : ''}${stats.net.toFixed(2)}`}
            tone={stats.net > 0 ? 'positive' : stats.net < 0 ? 'negative' : 'neutral'}
          />
        </section>

        <section className="rounded-card bg-surface p-5 shadow-soft">
          <h2 className="font-display text-sm font-extrabold tracking-wide text-ink-muted uppercase">
            Mode
          </h2>
          <div className="mt-3 flex gap-2" role="group" aria-label="Session mode">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                aria-pressed={mode === m.id}
                className={`flex-1 rounded-pill px-3 py-2.5 text-xs font-bold transition-colors ${
                  mode === m.id ? 'bg-ink text-white' : 'bg-canvas-deep text-ink-soft'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="mt-2.5 text-[11px] leading-relaxed text-ink-muted">
            {mode === 'commitment'
              ? 'Commitments use real NIM once the Nimiq wallet is linked.'
              : mode === 'practice'
                ? 'Free solo practice — no stakes, no payouts.'
                : 'Play money only — everything resets on refresh.'}
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-sm font-extrabold tracking-wide text-ink-muted uppercase">
            History
          </h2>
          {(history ?? []).length === 0 ? (
            <EmptyState
              icon={<Icon name="podium" size={28} />}
              title="No quizzes yet"
              description="Join or create your first quiz and your results will show up here."
              action={
                <Link to="/home">
                  <Button size="sm">Find a quiz</Button>
                </Link>
              }
            />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {(history ?? []).map((entry) => (
                <li key={entry.quizId}>
                  <Link
                    to={`/quiz/${entry.quizId}/results`}
                    className="block rounded-card bg-surface p-4 shadow-tap transition-shadow hover:shadow-soft"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate font-display text-sm font-bold text-ink">
                        {entry.title}
                      </span>
                      <StatusPill status={entry.status} />
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-ink-soft">
                      <span className="font-bold text-ink">
                        {entry.correctAnswers}/{entry.questionCount}
                      </span>
                      {entry.rank !== null && (
                        <span>
                          {entry.rank <= 3 ? <Icon name="trophy" className="mr-1 inline-block" size={14} /> : `#${entry.rank}`} place
                        </span>
                      )}
                      <span
                        className={`ml-auto font-bold ${
                          entry.payout > entry.entryAmount
                            ? 'text-success'
                            : entry.payout < entry.entryAmount
                              ? 'text-danger'
                              : 'text-ink-soft'
                        }`}
                      >
                        {entry.payout > entry.entryAmount ? '+' : ''}
                        {(entry.payout - entry.entryAmount).toFixed(2)} NIM
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Button
          variant="secondary"
          onClick={() => {
            signOut()
            navigate('/')
          }}
        >
          Sign out
        </Button>

        <p className="text-center text-[11px] text-ink-muted">
          Lokkin · commitment-based study quizzes · v0.1
        </p>
      </div>
    </AppShell>
  )
}

function StatCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: string
  tone?: 'positive' | 'negative' | 'neutral'
}) {
  const toneClass =
    tone === 'positive' ? 'text-success' : tone === 'negative' ? 'text-danger' : 'text-ink'
  return (
    <div className="rounded-card bg-surface px-3 py-4 text-center shadow-soft">
      <p className={`font-display text-xl font-black ${toneClass}`}>{value}</p>
      <p className="mt-0.5 text-[10px] font-bold tracking-wide text-ink-muted uppercase">
        {label}
      </p>
    </div>
  )
}
