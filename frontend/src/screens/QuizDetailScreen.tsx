import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '@/api'
import type { Participant, Quiz } from '@/api/types'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { MeterBar } from '@/components/MeterBar'
import { StatusPill } from '@/components/StatusPill'
import { TimerPill } from '@/components/TimerPill'
import { useSession } from '@/context/useSession'
import { usePolling } from '@/hooks/usePolling'

interface QuizDetailData {
  quiz: Quiz
  participants: Participant[]
}

export function QuizDetailScreen() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const { user } = useSession()

  const { data, error } = usePolling<QuizDetailData>(
    async () => {
      if (!quizId) throw new Error('Missing quiz id')
      const quiz = await api.getQuiz(quizId)
      const participants = await api.getParticipants(quizId).catch(() => [] as Participant[])
      return { quiz, participants }
    },
    { intervalMs: 6000 },
  )

  const quiz = data?.quiz
  const participants = useMemo(() => data?.participants ?? [], [data])
  const joined = useMemo(
    () => participants.some((p) => p.displayName === user?.displayName),
    [participants, user?.displayName],
  )

  if (error && !quiz) {
    return (
      <AppShell>
        <div className="rounded-card bg-surface p-8 text-center shadow-soft">
          <Icon name="alert" className="text-amber" size={30} />
          <h1 className="mt-2 font-display text-lg font-extrabold text-ink">Quiz not found</h1>
          <p className="mt-1 text-sm text-ink-soft">It may have been removed.</p>
          <Button className="mt-4" size="sm" onClick={() => navigate('/home')}>
            Back to Home
          </Button>
        </div>
      </AppShell>
    )
  }

  if (!quiz) {
    return (
      <AppShell>
        <div className="h-72 animate-pulse rounded-card bg-surface-muted" />
      </AppShell>
    )
  }

  const isCreator = quiz.creatorId === user?.id
  const minRequired = 3
  const confirmed = participants.length

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <Link to="/home" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-muted hover:text-primary-dark">
          <Icon name="arrow-left" size={17} /> All quizzes
        </Link>

        <section className="rounded-card bg-surface p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-xl font-black text-ink">{quiz.title}</h1>
            <StatusPill status={quiz.status} />
          </div>
          {quiz.description && (
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{quiz.description}</p>
          )}

          <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-card bg-primary-faint px-2 py-3">
              <dt className="text-[10px] font-bold tracking-wide text-ink-muted uppercase">Stake</dt>
              <dd className="font-display text-base font-extrabold text-primary-dark">
                {quiz.entryAmount} NIM
              </dd>
            </div>
            <div className="rounded-card bg-primary-faint px-2 py-3">
              <dt className="text-[10px] font-bold tracking-wide text-ink-muted uppercase">Questions</dt>
              <dd className="font-display text-base font-extrabold text-primary-dark">
                {quiz.questionCount}
              </dd>
            </div>
            <div className="rounded-card bg-primary-faint px-2 py-3">
              <dt className="text-[10px] font-bold tracking-wide text-ink-muted uppercase">Duration</dt>
              <dd className="font-display text-base font-extrabold text-primary-dark">
                {Math.round(quiz.durationSeconds / 60)} min
              </dd>
            </div>
          </dl>

          {quiz.startsAt && isUpcoming(quiz.startsAt) && quiz.status === 'OPEN' && (
            <div className="mt-4 flex items-center justify-between rounded-card bg-amber-soft px-4 py-3">
              <span className="text-xs font-bold text-ink">Starts in</span>
              <TimerPill until={new Date(quiz.startsAt)} warnUnderSeconds={60} />
            </div>
          )}
        </section>

        <section className="rounded-card bg-white p-5 shadow-soft">
          <h2 className="font-display text-sm font-extrabold tracking-wide text-ink-muted uppercase">
            The pot
          </h2>
          <p className="mt-1 font-display text-2xl font-black text-ink">
            {(quiz.entryAmount * Math.max(confirmed, 1)).toLocaleString()} NIM
            <span className="ml-2 text-xs font-semibold text-ink-muted">
              if {Math.max(confirmed, minRequired)} join
            </span>
          </p>
          <div className="mt-3">
            <MeterBar
              value={confirmed}
              target={minRequired}
              max={Math.max(minRequired, confirmed + 2)}
              label="Confirmed commitments"
            />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
            Needs {minRequired} to run. Fewer than that and everyone is auto-refunded. Top 3
            split the pool 50 / 30 / 10; everyone else gets 80% back.
          </p>
        </section>

        {participants.length > 0 && (
          <section className="rounded-card bg-white p-5 shadow-soft">
            <h2 className="font-display text-sm font-extrabold tracking-wide text-ink-muted uppercase">
              Players ({participants.length})
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {participants.map((p) => (
                <li
                  key={p.id}
                  className="rounded-pill bg-primary-faint px-3 py-1.5 text-xs font-bold text-ink"
                >
                  {p.displayName}
                </li>
              ))}
            </ul>
          </section>
        )}

        {isCreator && (
          <p className="rounded-card bg-amber-soft px-4 py-3 text-xs font-semibold leading-relaxed text-ink">
            You created this quiz — you play blind, same as everyone else. You never see the
            questions before the room goes live.
          </p>
        )}

        <div className="sticky bottom-24">
          {joined ? (
            <Button size="lg" onClick={() => navigate(`/quiz/${quizId}/lobby`)}>
              {quiz.status === 'LIVE' ? 'Return to the quiz' : 'Go to lobby'}
            </Button>
          ) : quiz.status === 'OPEN' ? (
            <Button size="lg" onClick={() => navigate(`/quiz/${quizId}/commit`)}>
              Commit {quiz.entryAmount} NIM
            </Button>
          ) : quiz.status === 'LIVE' ? (
            <Button size="lg" disabled>
              Already live — join earlier next time
            </Button>
          ) : quiz.status === 'VALIDATING' || quiz.status === 'ENDED' || quiz.status === 'FINALIZED' || quiz.status === 'SETTLED' ? (
            <Button size="lg" variant="secondary" onClick={() => navigate(`/quiz/${quizId}/results`)}>
              See results
            </Button>
          ) : (
            <Button size="lg" disabled>
              Not open for entries
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  )
}

function isUpcoming(iso: string): boolean {
  return Date.parse(iso) > Date.now()
}
