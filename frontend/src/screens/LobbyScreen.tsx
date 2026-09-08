import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@/api'
import type { Participant, Quiz } from '@/api/types'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/Button'
import { MeterBar } from '@/components/MeterBar'
import { ParticipantRow } from '@/components/ParticipantRow'
import { useSession } from '@/context/useSession'
import { usePolling } from '@/hooks/usePolling'

const MIN_REQUIRED = 3

interface LobbyData {
  quiz: Quiz
  participants: Participant[]
}

export function LobbyScreen() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const { user } = useSession()

  const { data } = usePolling<LobbyData>(
    async () => {
      if (!quizId) throw new Error('no id')
      const quiz = await api.getQuiz(quizId)
      const participants = await api.getParticipants(quizId).catch(() => [] as Participant[])
      return { quiz, participants }
    },
    { intervalMs: 4000 },
  )

  // countdown ring: fix the total window once when the screen opens
  const [now, setNow] = useState(() => Date.now())
  const [openedAt] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const quiz = data?.quiz
  const participants = useMemo(() => data?.participants ?? [], [data])
  const confirmed = participants.length
  const isCreator = quiz?.creatorId === user?.id

  if (!quiz) {
    return (
      <AppShell>
        <div className="flex flex-col gap-3">
          <div className="h-40 animate-pulse rounded-card bg-white/70" />
          <div className="h-64 animate-pulse rounded-card bg-white/70" />
        </div>
      </AppShell>
    )
  }

  const isLive = quiz.status === 'LIVE'
  const startsAtMs = quiz.startsAt ? Date.parse(quiz.startsAt) : null
  const totalWindow = startsAtMs !== null ? Math.max(1, startsAtMs - openedAt) : 1
  const remainingMs = startsAtMs ? Math.max(0, startsAtMs - now) : 0
  const ringFraction = Math.min(1, remainingMs / totalWindow)

  const minutes = Math.floor(remainingMs / 60_000)
  const seconds = Math.floor((remainingMs % 60_000) / 1000)
  const countdownText = `${minutes}:${seconds.toString().padStart(2, '0')}`

  const readyToStart = confirmed >= MIN_REQUIRED
  const roomClosed = ['VALIDATING', 'ENDED', 'FINALIZED', 'SETTLED'].includes(quiz.status)

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <header className="text-center">
          <h1 className="font-display text-2xl font-black text-ink">{quiz.title}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {quiz.entryAmount} NIM stake · {quiz.questionCount} questions ·{' '}
            {Math.round(quiz.durationSeconds / 60)} min
          </p>
        </header>

        <section className="flex flex-col items-center gap-3 rounded-card bg-white p-6 shadow-soft">
          {roomClosed ? (
            <>
              <p className="text-4xl" aria-hidden>🏁</p>
              <p className="font-display text-base font-extrabold text-ink">This room has closed</p>
              <Button variant="secondary" onClick={() => navigate(`/quiz/${quizId}/results`)}>
                See results
              </Button>
            </>
          ) : isLive ? (
            <>
              <p className="text-4xl" aria-hidden>🔴</p>
              <p className="font-display text-lg font-black text-danger">Room is live</p>
              <Button size="lg" onClick={() => navigate(`/quiz/${quizId}/play`)}>
                Enter the quiz
              </Button>
            </>
          ) : (
            <>
              <CountdownRing fraction={ringFraction} label={countdownText} />
              <p className="text-xs font-semibold text-ink-muted">
                {remainingMs > 0 ? 'Room opens in' : 'Waiting to start…'}
              </p>
            </>
          )}
        </section>

        <section className="rounded-card bg-white p-5 shadow-soft">
          <MeterBar
            value={confirmed}
            target={MIN_REQUIRED}
            max={Math.max(MIN_REQUIRED, confirmed + 2)}
            label="Confirmed commitments"
          />
          {readyToStart ? (
            <p className="mt-3 rounded-card bg-success-soft px-4 py-2.5 text-xs font-bold text-success">
              ✓ Quorum reached — this quiz is happening
            </p>
          ) : (
            <p className="mt-3 rounded-card bg-amber-soft px-4 py-2.5 text-xs leading-relaxed text-ink">
              Needs {MIN_REQUIRED - confirmed} more{' '}
              {MIN_REQUIRED - confirmed === 1 ? 'player' : 'players'}. If the room opens with
              fewer than {MIN_REQUIRED}, everyone is auto-refunded in full.
            </p>
          )}
        </section>

        <section className="rounded-card bg-white p-5 shadow-soft">
          <h2 className="font-display text-sm font-extrabold tracking-wide text-ink-muted uppercase">
            In the room ({confirmed})
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {participants.map((p) => (
              <ParticipantRow
                key={p.id}
                participant={p}
                isCreator={p.displayName === user?.displayName && isCreator}
              />
            ))}
          </ul>
        </section>

        {isCreator && (
          <p className="rounded-card bg-amber-soft px-4 py-3 text-xs font-semibold leading-relaxed text-ink">
            You're hosting this one — you play blind, same as everyone else. The questions
            lock the moment the room opens.
          </p>
        )}

        {!isLive && !roomClosed && (
          <p className="text-center text-[11px] leading-relaxed text-ink-muted">
            Keep this page open — we'll ping you the moment the room goes live.
          </p>
        )}
      </div>
    </AppShell>
  )
}

function CountdownRing({ fraction, label }: { fraction: number; label: string }) {
  const R = 44
  const C = 2 * Math.PI * R
  return (
    <div className="relative h-28 w-28" role="timer" aria-label={`${label} until start`}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" strokeWidth="8" className="stroke-canvas-deep" />
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className="stroke-primary transition-[stroke-dashoffset] duration-1000"
          style={{ strokeDasharray: C, strokeDashoffset: C * (1 - fraction) }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-xl font-black tabular-nums text-ink">
        {label}
      </span>
    </div>
  )
}
