import { Link, useParams } from 'react-router-dom'
import { api } from '@/api'
import type { ReviewQuestion } from '@/api/types'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { OptionButton } from '@/components/OptionButton'
import { useSession } from '@/context/useSession'
import { usePolling } from '@/hooks/usePolling'

export function ReviewScreen() {
  const { quizId } = useParams<{ quizId: string }>()
  const { user } = useSession()

  const { data: review, error } = usePolling<ReviewQuestion[]>(
    () => (quizId && user ? api.getReview(quizId, user.id) : Promise.reject(new Error('no session'))),
    { intervalMs: 8000 },
  )

  if (error && !review) {
    const locked = error instanceof Error && error.message.includes('unlocks')
    return (
      <AppShell>
        <EmptyState
          icon={locked ? '⏳' : '🤷'}
          title={locked ? 'Review unlocks when the quiz ends' : 'Nothing to review'}
          description={
            locked
              ? 'Answers stay sealed until everyone finishes and results are validated.'
              : 'This quiz may not exist, or you did not take part.'
          }
          action={
            <Link to={quizId ? `/quiz/${quizId}` : '/home'}>
              <Button size="sm">Back to the quiz</Button>
            </Link>
          }
        />
      </AppShell>
    )
  }

  if (!review) {
    return (
      <AppShell>
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-card bg-white/70" />
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
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-black text-ink">Review</h1>
            <p className="mt-0.5 text-sm text-ink-soft">
              {correctCount}/{review.length} correct · {pct}%
            </p>
          </div>
          <Link
            to={quizId ? `/quiz/${quizId}/results` : '/home'}
            className="text-sm font-semibold text-primary-dark"
          >
            Results →
          </Link>
        </header>

        {answered.length === 0 && (
          <p className="rounded-card bg-amber-soft px-4 py-3 text-sm font-semibold text-ink">
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
    <article className="rounded-card bg-white p-5 shadow-soft">
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
