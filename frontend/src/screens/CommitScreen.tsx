import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@/api'
import type { Quiz } from '@/api/types'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { MemoCard } from '@/components/MemoCard'
import { useSession } from '@/context/useSession'
import { generateMemoCode } from '@/lib/generator'

type Stage = 'summary' | 'confirming' | 'confirmed'

const MOCK_ESCROW = 'NQ02 4RCH AXQ1 P50Y 2LJV F9RN 0FCX 4VKM YYQ0'

export function CommitScreen() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const { user } = useSession()

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [stage, setStage] = useState<Stage>('summary')
  const [memo] = useState(() => generateMemoCode())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!quizId) return
    let cancelled = false
    api
      .getQuiz(quizId)
      .then((q) => {
        if (!cancelled) setQuiz(q)
      })
      .catch(() => {
        if (!cancelled) setError('Quiz not found')
      })
    return () => {
      cancelled = true
    }
  }, [quizId])

  const confirm = async () => {
    if (!quizId || !user) return
    setStage('confirming')
    setError(null)
    try {
      // mock payments mode: transaction instantly CONFIRMED
      await new Promise((r) => setTimeout(r, 1400))
      await api.joinQuiz(quizId, user.id)
      setStage('confirmed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Commitment failed — try again')
      setStage('summary')
    }
  }

  if (error && !quiz) {
    return (
      <AppShell>
        <div className="rounded-card bg-surface p-8 text-center shadow-soft">
          <Icon name="alert" className="text-danger" size={30} />
          <h1 className="mt-2 font-display text-lg font-extrabold text-ink">Can't commit</h1>
          <p className="mt-1 text-sm text-ink-soft">{error}</p>
          <Button className="mt-4" size="sm" onClick={() => navigate(quizId ? `/quiz/${quizId}` : '/home')}>
            Back
          </Button>
        </div>
      </AppShell>
    )
  }

  if (!quiz) {
    return (
      <AppShell>
          <div className="h-64 animate-pulse rounded-card bg-surface-muted" />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <header>
          <h1 className="font-display text-2xl font-black text-ink">Lock in your stake</h1>
          <p className="mt-1 text-sm text-ink-soft">{quiz.title}</p>
        </header>

        {error && (
          <p className="rounded-card bg-danger-soft px-4 py-3 text-sm font-semibold text-danger" role="alert">
            {error}
          </p>
        )}

        {stage === 'summary' && (
          <>
            <section className="rounded-card bg-surface p-6 text-center shadow-soft">
              <p className="text-xs font-bold tracking-wide text-ink-muted uppercase">
                You're committing
              </p>
              <p className="mt-2 font-display text-4xl font-black text-primary-dark">
                {quiz.entryAmount} NIM
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                {quiz.questionCount} questions · {Math.round(quiz.durationSeconds / 60)} min
              </p>
            </section>

            <section className="rounded-card bg-surface p-5 shadow-soft">
              <h2 className="font-display text-sm font-extrabold tracking-wide text-ink-muted uppercase">
                How payouts work
              </h2>
              <ul className="mt-3 flex flex-col gap-2.5 text-sm text-ink">
                <PayoutRow icon="trophy" text="Finish top 3 — get 100% back plus your share of the pool (50 / 30 / 10)" />
                <PayoutRow icon="podium" text="Finish outside the top 3 — get 80% back, 20% feeds the pool" />
                <PayoutRow icon="check" text="Complete the quiz — split a 10% completion bonus with everyone who finished" />
                <PayoutRow icon="clock" text="No-show — 50% back, 50% to the pool. Locking in means showing up" />
              </ul>
              <p className="mt-4 rounded-card bg-amber-soft px-3.5 py-2.5 text-xs leading-relaxed text-ink">
                Needs at least 3 commitments to run — otherwise everyone is auto-refunded in
                full.
              </p>
            </section>

            <Button size="lg" onClick={() => void confirm()}>
              Commit {quiz.entryAmount} NIM
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/quiz/${quizId}`)}>
              Not yet
            </Button>
          </>
        )}

        {stage === 'confirming' && (
          <section className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-card bg-surface p-8 shadow-soft">
            <div className="h-14 w-14 animate-spin rounded-pill border-4 border-primary-soft border-t-primary" />
            <p className="font-display text-base font-extrabold text-ink">
              Confirming transaction…
            </p>
            <p className="text-xs text-ink-muted">Mock payments mode — instant confirmation</p>
          </section>
        )}

        {stage === 'confirmed' && (
          <>
            <section className="flex flex-col items-center gap-2 rounded-card bg-success-soft px-6 py-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-white/60 text-success" aria-hidden>
                <Icon name="check" size={28} strokeWidth={2.4} />
              </span>
              <h2 className="font-display text-xl font-black text-ink">You're in</h2>
              <p className="text-sm text-ink-soft">
                {quiz.entryAmount} NIM committed and confirmed.
              </p>
            </section>

            <MemoCard code={memo} address={MOCK_ESCROW} />

            <Button size="lg" onClick={() => navigate(`/quiz/${quizId}/lobby`)}>
              Go to the lobby
            </Button>
          </>
        )}
      </div>
    </AppShell>
  )
}

function PayoutRow({ icon, text }: { icon: 'trophy' | 'podium' | 'check' | 'clock'; text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-primary-faint text-primary-dark" aria-hidden>
        <Icon name={icon} size={14} />
      </span>
      <span className="leading-relaxed">{text}</span>
    </li>
  )
}
