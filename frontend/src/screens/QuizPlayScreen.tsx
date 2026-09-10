import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@/api'
import { friendlyError } from '@/api/errors'
import type { OptionKey, PlayerQuestion } from '@/api/types'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/Button'
import { ErrorBanner } from '@/components/ErrorState'
import { Icon } from '@/components/Icon'
import { OptionButton } from '@/components/OptionButton'
import { TimerPill } from '@/components/TimerPill'
import { useSession } from '@/context/useSession'
import { usePolling } from '@/hooks/usePolling'

const REVEAL_MS = 900

interface PlaySession {
  participantId: string
  questions: PlayerQuestion[]
  startedAt: number
  durationSeconds: number
}

const SESSION_KEY = (quizId: string) => `lokkin.play.${quizId}`

export function QuizPlayScreen() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const { user } = useSession()

  const [session, setSession] = useState<PlaySession | null>(() => {
    if (!quizId) return null
    try {
      const raw = sessionStorage.getItem(SESSION_KEY(quizId))
      return raw ? (JSON.parse(raw) as PlaySession) : null
    } catch {
      return null
    }
  })
  const [booting, setBooting] = useState(!session)
  const [bootError, setBootError] = useState<string | null>(null)

  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<OptionKey | null>(null)
  const [reveal, setReveal] = useState<{ picked: OptionKey; correct: boolean } | null>(null)
  const [answers, setAnswers] = useState<Record<string, { picked: OptionKey; correct: boolean }>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)
  const submitLock = useRef(false)

  // Poll quiz state — the server owns the clock
  const { data: state } = usePolling(
    () =>
      quizId
        ? api.getQuizState(quizId, user?.id)
        : Promise.reject(new Error('no id')),
    { intervalMs: 5000, disabled: !quizId },
  )

  const deadline = useMemo(() => {
    if (session) return session.startedAt + session.durationSeconds * 1000
    if (state?.deadline) return state.deadline * 1000
    return null
  }, [session, state?.deadline])

  // Boot the play session: join (idempotent) + load questions + start
  useEffect(() => {
    if (!quizId || !user || session) return
    let cancelled = false
    ;(async () => {
      try {
        const quiz = await api.getQuiz(quizId)
        const { participantId } = await api.joinQuiz(quizId, user.id)
        // Only the creator may start the room early; otherwise it goes LIVE
        // automatically at starts_at once quorum is met.
        if (quiz.status !== 'LIVE' && quiz.creatorId === user.id) {
          await api.startQuiz(quizId).catch(() => {})
        }
        const questions = await api.getQuestions(quizId, user.id)
        if (cancelled) return
        if (questions.length === 0) throw new Error('This quiz has no active questions')
        const started: PlaySession = {
          participantId,
          questions,
          startedAt: Date.now(),
          durationSeconds: quiz.durationSeconds,
        }
        sessionStorage.setItem(SESSION_KEY(quizId), JSON.stringify(started))
        setSession(started)
        setBooting(false)
      } catch (err) {
        if (cancelled) return
        setBootError(err instanceof Error ? err.message : 'Could not start the quiz')
        setBooting(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [quizId, user, session])

  const question = session?.questions[index] ?? null
  const total = session?.questions.length ?? 0
  const correctCount = Object.values(answers).filter((a) => a.correct).length

  const confirmAnswer = useCallback(
    async (key: OptionKey) => {
      if (!session || !question || reveal || submitting || submitLock.current) return
      submitLock.current = true
      setSubmitting(true)
      setSelected(key)
      setSubmitError(null)
      try {
        const res = await api.submitAnswer(quizId!, {
          participantId: session.participantId,
          questionId: question.id,
          selectedOption: key,
        })
        setReveal({ picked: key, correct: res.correct })
        setAnswers((prev) => ({ ...prev, [question.id]: { picked: key, correct: res.correct } }))
      } catch (err) {
        // Never fake a network failure as a wrong answer — the pick was not
        // recorded, so let the player retry.
        setSubmitError(friendlyError(err, "Couldn't save that answer — try again"))
      } finally {
        setSubmitting(false)
        submitLock.current = false
      }
    },
    [session, question, reveal, submitting, quizId],
  )

  const advance = useCallback(() => {
    if (!session) return
    if (index + 1 >= session.questions.length) {
      setFinished(true)
      sessionStorage.removeItem(SESSION_KEY(quizId!))
    } else {
      setIndex((i) => i + 1)
      setSelected(null)
      setReveal(null)
      setSubmitError(null)
    }
  }, [session, index, quizId])

  // auto-advance shortly after reveal
  useEffect(() => {
    if (!reveal) return
    const t = setTimeout(() => advance(), REVEAL_MS)
    return () => clearTimeout(t)
  }, [reveal, advance])

  const onExpire = useCallback(() => {
    if (!finished && session) {
      setFinished(true)
      sessionStorage.removeItem(SESSION_KEY(quizId!))
    }
  }, [finished, session, quizId])

  if (bootError) {
    return (
      <AppShell hideNav>
        <div className="rounded-card bg-surface p-8 text-center shadow-soft">
          <Icon name="alert" className="text-danger" size={30} />
          <h1 className="mt-2 font-display text-lg font-extrabold text-ink">Can't enter the quiz</h1>
          <p className="mt-1 text-sm text-ink-soft">{bootError}</p>
          <div className="mt-4 flex flex-col items-center gap-2">
            <Button size="sm" onClick={() => {
              setBootError(null)
              setBooting(true)
            }}>
              Try again
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate(quizId ? `/quiz/${quizId}` : '/home')}>
              Back to the quiz page
            </Button>
          </div>
        </div>
      </AppShell>
    )
  }

  if (booting || !session || !question) {
    return (
      <AppShell hideNav>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-pill border-4 border-primary-soft border-t-primary" />
          <p className="text-sm font-semibold text-ink-soft">Getting you into the room…</p>
        </div>
      </AppShell>
    )
  }

  if (finished) {
    return (
      <AppShell hideNav>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
          <Icon name="podium" className="text-primary-dark" size={44} />
          <h1 className="font-display text-2xl font-black text-ink">Answers locked in</h1>
          <p className="max-w-xs text-sm leading-relaxed text-ink-soft">
            You answered {Object.keys(answers).length} of {total} questions — {correctCount} correct.
            Results are calculated once everyone finishes.
          </p>
          <Button size="lg" onClick={() => navigate(quizId ? `/quiz/${quizId}/results` : '/home')}>
            See results
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell hideNav>
      <div className="flex flex-col gap-5">
        <header className="flex items-center justify-between">
          {/* screen heading — visually a label, semantically the h1 */}
          <h1 className="font-display text-sm font-extrabold text-ink-muted">
            Question {index + 1}
            <span className="text-ink-muted"> / {total}</span>
          </h1>
          {deadline && <TimerPill until={new Date(deadline)} onExpire={onExpire} />}
        </header>

        <div className="h-2 overflow-hidden rounded-pill bg-canvas-deep">
          <div
            className="h-full rounded-pill bg-primary transition-all duration-500"
            style={{ width: `${((index + (reveal ? 1 : 0)) / total) * 100}%` }}
          />
        </div>

        <section className="rounded-card bg-surface p-6 shadow-soft">
          <h2 className="font-display text-lg leading-snug font-extrabold text-ink">
            {question.questionText}
          </h2>
          <div className="mt-5 flex flex-col gap-2.5" aria-live="polite">
            {question.options.map((opt) => {
              let optReveal: 'correct' | 'wrong' | 'missed' | undefined
              if (reveal) {
                if (opt.key === reveal.picked) {
                  optReveal = reveal.correct ? 'correct' : 'wrong'
                } else {
                  optReveal = 'missed'
                }
              }
              return (
                <OptionButton
                  key={opt.key}
                  optionKey={opt.key}
                  text={opt.text}
                  selected={selected === opt.key}
                  disabled={reveal !== null || submitting}
                  reveal={optReveal}
                  onSelect={(k) => {
                    if (!reveal && !submitting) setSelected(k)
                  }}
                />
              )
            })}
          </div>
        </section>

        {submitError && <ErrorBanner>{submitError}</ErrorBanner>}

        {!reveal ? (
          <Button
            size="lg"
            disabled={selected === null || submitting}
            onClick={() => selected && void confirmAnswer(selected)}
          >
            {submitting ? 'Locking answer…' : selected ? 'Lock answer' : 'Pick an option'}
          </Button>
        ) : (
          <p
            className={`text-center text-sm font-bold ${reveal.correct ? 'text-success' : 'text-danger'}`}
            role="status"
          >
            {reveal.correct ? 'Correct ✓' : 'Not quite ✗'}
          </p>
        )}

        <p className="text-center text-[11px] leading-relaxed text-ink-muted">
          One answer per question — locked the moment you confirm. No going back.
        </p>
      </div>
    </AppShell>
  )
}
