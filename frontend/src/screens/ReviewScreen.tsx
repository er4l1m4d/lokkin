import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '@/api'
import type { ReviewQuestion } from '@/api/types'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState, StaleBanner } from '@/components/ErrorState'
import { Icon } from '@/components/Icon'
import { OptionButton } from '@/components/OptionButton'
import { useSession } from '@/context/useSession'
import { usePolling } from '@/hooks/usePolling'

export function ReviewScreen() {
  const { quizId } = useParams<{ quizId: string }>()
  const { user } = useSession()

  const { data: review, error, refresh } = usePolling<ReviewQuestion[]>(
    () => (quizId && user ? api.getReview(quizId, user.id) : Promise.reject(new Error('no session'))),
    { intervalMs: 8000 },
  )

  if (error && !review) {
    // 409 = answers sealed until validation ends; anything else = transient
    const locked = error instanceof ApiError && error.status === 409
    return (
      <AppShell>
        {locked ? (
          <EmptyState
            icon={<Icon name="clock" size={28} />}
            title="Review unlocks when the quiz ends"
            description="Answers stay sealed until everyone finishes and results are validated."
            action={
              <Link to={quizId ? `/quiz/${quizId}` : '/home'}>
                <Button size="sm">Back to the quiz</Button>
              </Link>
            }
          />
        ) : (
          <ErrorState
            title="Review didn't load"
            description={
              user
                ? "Either you didn't take part in this quiz, or the page just couldn't reach it."
                : 'Your session expired — sign in again to see your review.'
            }
            hint="Check your connection"
            onRetry={() => void refresh()}
            action={
              <Link to={quizId ? `/quiz/${quizId}/results` : '/home'}>
                <Button variant="ghost" size="sm">Back to results</Button>
              </Link>
            }
          />
        )}
      </AppShell>
    )
  }

  if (!review) {
    return (
      <AppShell>
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-card bg-surface-muted" />
          ))}
        </div>
      </AppShell>
    )
  }

  const answered = review.filter((q) => q.myAnswer !== null)
  const correctCount = review.filter((q) => q.wasCorrect === true).length
  const pct = review.length > 0 ? Math.round((correctCount / review.length) * 100) : 0

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        {error && review && <StaleBanner />}

        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-black text-ink">Review</h1>
            <p className="mt-0.5 text-sm text-ink-soft">
              {correctCount}/{review.length} correct · {pct}%
            </p>
          </div>
          <Link
            to={quizId ? `/quiz/${quizId}/results` : '/home'}
            className="inline-flex min-h-11 items-center gap-1 px-1 text-sm font-semibold text-primary-dark"
          >
            Results <Icon name="arrow-right" size={15} />
          </Link>
        </header>

        {answered.length === 0 && (
          <p className="rounded-card bg-amber-soft px-4 py-3 text-sm font-semibold text-ink" role="status">
            You didn't answer any questions in this quiz — here's what was asked.
          </p>
        )}

        {review.map((q, i) => (
          <ReviewCard key={q.id} question={q} index={i + 1} />
        ))}

        <Button variant="secondary" size="sm" onClick={() => window.history.back()}>
          Back
        </Button>
      </div>
    </AppShell>
  )
}

function ReviewCard({ question: q, index }: { question: ReviewQuestion; index: number }) {
  return (
    <article className="rounded-card bg-surface p-5 shadow-soft">
      <header className="flex items-center justify-between">
        <span className="font-display text-xs font-extrabold tracking-wide text-ink-muted uppercase">
          Question {index}
        </span>
        {q.wasCorrect !== null && (
          <span
            className={`rounded-pill px-3 py-1 text-[10px] font-bold tracking-wide uppercase ${
              q.wasCorrect ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
            }`}
          >
            {q.wasCorrect ? 'Correct' : 'Missed'}
          </span>
        )}
      </header>

      <h2 className="mt-3 font-display text-base leading-snug font-extrabold text-ink">
        {q.questionText}
      </h2>

      <div className="mt-4 flex flex-col gap-2">
        {q.options.map((opt) => {
          let reveal: 'correct' | 'wrong' | 'missed' | undefined
          if (opt.key === q.correctOption) {
            reveal = 'correct'
          } else if (q.myAnswer === opt.key) {
            reveal = 'wrong'
          } else {
            reveal = 'missed'
          }
          return (
            <OptionButton
              key={opt.key}
              optionKey={opt.key}
              text={opt.text}
              selected={q.myAnswer === opt.key}
              reveal={reveal}
              disabled
              onSelect={() => {}}
            />
          )
        })}
      </div>

      {q.myAnswer && q.myAnswer !== q.correctOption && (
        <p className="mt-3 text-xs font-semibold text-danger">
          You picked {q.myAnswer} — the answer was {q.correctOption}.
        </p>
      )}

      {q.explanation && (
        <div className="mt-3 rounded-card bg-amber-soft px-4 py-3">
          <p className="text-[10px] font-bold tracking-wide text-ink uppercase">Why</p>
          <p className="mt-1 text-xs leading-relaxed text-ink">{q.explanation}</p>
        </div>
      )}
    </article>
  )
}
