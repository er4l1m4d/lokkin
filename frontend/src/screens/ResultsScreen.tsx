import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '@/api'
import type { Quiz, QuizResults, ResultRow, QuizStatus } from '@/api/types'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { PodiumSlot } from '@/components/PodiumSlot'
import { StatusPill } from '@/components/StatusPill'
import { useSession } from '@/context/useSession'
import { usePolling } from '@/hooks/usePolling'

interface ResultsData {
  quiz: Quiz
  results: QuizResults | null
}

const STEPPER: ReadonlyArray<{ status: QuizStatus; label: string; hint: string }> = [
  { status: 'VALIDATING', label: 'Validating', hint: 'Dispute window — results can still change' },
  { status: 'FINALIZED', label: 'Finalized', hint: 'Scores are locked in' },
  { status: 'SETTLED', label: 'Settled', hint: 'Payouts are on their way' },
]

const PAYOUT_LABELS: Record<ResultRow['payoutKind'], string> = {
  winner: 'Winner',
  consolation: '80% back',
  refund: '50% back',
  bonus: 'Bonus',
  none: '—',
}

export function ResultsScreen() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const { user } = useSession()

  const { data, error } = usePolling<ResultsData>(
    async () => {
      if (!quizId) throw new Error('Missing quiz id')
      const quiz = await api.getQuiz(quizId)
      const results = await api.getResults(quizId).catch(() => null)
      return { quiz, results }
    },
    { intervalMs: 5000 },
  )

  if (error && !data) {
    return (
      <AppShell>
        <EmptyState
          icon={<Icon name="alert" size={28} />}
          title="Quiz not found"
          description="It may have been removed."
          action={
            <Link to="/home">
              <Button size="sm">Back to Home</Button>
            </Link>
          }
        />
      </AppShell>
    )
  }

  const quiz = data?.quiz
  if (!quiz) {
    return (
      <AppShell>
        <div className="flex flex-col gap-3">
          <div className="h-28 animate-pulse rounded-card bg-surface-muted" />
          <div className="h-56 animate-pulse rounded-card bg-surface-muted" />
          <div className="h-40 animate-pulse rounded-card bg-surface-muted" />
        </div>
      </AppShell>
    )
  }

  const results = data?.results ?? null
  const rows = results?.rows ?? []
  const podium = rows.slice(0, 3)
  const myRow = rows.find((r) => r.displayName === user?.displayName)

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-black text-ink">{quiz.title}</h1>
            <p className="mt-0.5 text-xs text-ink-soft">
              {quiz.entryAmount} NIM stake · {quiz.questionCount} questions
            </p>
          </div>
          <StatusPill status={quiz.status} />
        </header>

        <StatusStepper current={quiz.status} />

        {results === null ? (
          <section className="flex flex-col items-center gap-3 rounded-card bg-surface p-8 text-center shadow-soft">
            <div className="flex h-12 w-12 items-center justify-center rounded-pill bg-primary-faint text-primary-dark" aria-hidden>
              <Icon name="refresh" size={22} className="animate-spin" />
            </div>
            <h2 className="font-display text-lg font-extrabold text-ink">
              {quiz.status === 'LIVE' ? 'Still in play…' : 'Calculating results…'}
            </h2>
            <p className="max-w-xs text-sm leading-relaxed text-ink-soft">
              Results unlock the moment everyone finishes or the clock runs out. This page
              updates automatically.
            </p>
          </section>
        ) : (
          <>
            {myRow && (
                <section
                className={`rounded-card p-5 text-center shadow-soft ${
                  myRow.payoutKind === 'winner' ? 'bg-primary-faint' : 'bg-surface'
                }`}
                aria-label="Your result"
              >
                <p className="text-xs font-bold tracking-wide text-ink-muted uppercase">
                  You finished {ordinal(myRow.rank)}
                </p>
                <p className="mt-1 font-display text-3xl font-black text-ink">
                  {myRow.correctAnswers}/{myRow.totalQuestions}
                </p>
                <p className="mt-1 text-sm font-semibold text-ink-soft">
                  {myRow.payout >= myRow.entryAmount ? (
                    <>
                      <span className="text-success">{myRow.payout.toFixed(2)} NIM back</span>
                      {myRow.payout > myRow.entryAmount && (
                        <span className="text-success">
                          {' '}
                          (+{(myRow.payout - myRow.entryAmount).toFixed(2)} won)
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-danger">
                      {myRow.payout.toFixed(2)} NIM back (−
                      {(myRow.entryAmount - myRow.payout).toFixed(2)})
                    </span>
                  )}
                </p>
              </section>
            )}

            <section className="rounded-card bg-surface p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-extrabold tracking-wide text-ink-muted uppercase">
                  The podium
                </h2>
                <span className="rounded-pill bg-primary-soft px-3 py-1 font-display text-xs font-extrabold text-primary-dark">
                  {results.prizePool.toFixed(2)} NIM pool
                </span>
              </div>
              <div className="mt-4 flex items-end gap-2">
                <PodiumSlot place={2} row={podium[1] ?? null} />
                <PodiumSlot place={1} row={podium[0] ?? null} />
                <PodiumSlot place={3} row={podium[2] ?? null} />
              </div>
              <p className="mt-3 text-center text-[11px] text-ink-muted">
                Pool splits 50 / 30 / 10 — ties split their rank's share
              </p>
            </section>

            <section className="rounded-card bg-surface p-5 shadow-soft">
              <h2 className="font-display text-sm font-extrabold tracking-wide text-ink-muted uppercase">
                Full ranking
              </h2>
              <ol className="mt-3 flex flex-col gap-2">
                {rows.map((row) => {
                  const isMe = row.displayName === user?.displayName
                  const tied = rows.filter((r) => r.rank === row.rank).length > 1
                  return (
                    <li
                      key={row.participantId}
                      className={`flex items-center gap-3 rounded-card px-4 py-3 ${
                        isMe ? 'bg-primary-faint ring-2 ring-primary/30' : 'bg-canvas'
                      }`}
                    >
                      <span className="w-8 font-display text-sm font-black text-ink-muted">
                        {row.rank <= 3 ? <Icon name="trophy" size={18} /> : `#${row.rank}`}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-sm font-bold text-ink">
                          {row.displayName}
                          {isMe && <span className="ml-1.5 text-[10px] text-primary-dark">(you)</span>}
                        </span>
                        <span className="text-xs text-ink-soft">
                          {row.correctAnswers}/{row.totalQuestions} correct
                          {tied && <span className="ml-1.5 text-amber">· tied</span>}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block font-display text-sm font-extrabold text-ink">
                          {row.payout.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-bold tracking-wide text-ink-muted uppercase">
                          {PAYOUT_LABELS[row.payoutKind]}
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ol>
            </section>
          </>
        )}

        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            variant={results ? 'primary' : 'secondary'}
            disabled={results === null}
            onClick={() => navigate(quizId ? `/quiz/${quizId}/review` : '/home')}
          >
            Review your answers
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
            Back to Home
          </Button>
        </div>
      </div>
    </AppShell>
  )
}

function StatusStepper({ current }: { current: QuizStatus }) {
  const activeIdx = STEPPER.findIndex((s) => s.status === current)
  return (
    <ol className="flex items-center justify-between rounded-card bg-surface px-5 py-4 shadow-soft">
      {STEPPER.map((step, i) => {
        const state = activeIdx === -1 ? 'todo' : i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'todo'
        return (
          <li key={step.status} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-pill font-display text-xs font-extrabold ${
                  state === 'done'
                    ? 'bg-success text-white'
                    : state === 'active'
                      ? 'bg-primary text-white'
                      : 'bg-canvas-deep text-ink-muted'
                }`}
              >
                {state === 'done' ? '✓' : i + 1}
              </span>
              <span
                className={`text-xs font-bold ${state === 'active' ? 'text-ink' : 'text-ink-muted'}`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPPER.length - 1 && (
              <span className="mx-2 h-0.5 flex-1 rounded-full bg-line" aria-hidden />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function ordinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (suffixes[(v - 20) % 10] ?? suffixes[v] ?? suffixes[0])
}
