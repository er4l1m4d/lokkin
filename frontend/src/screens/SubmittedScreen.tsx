import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@/api'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/Button'
import { ErrorBanner, StaleBanner } from '@/components/ErrorState'
import { Icon } from '@/components/Icon'
import { StatusPill } from '@/components/StatusPill'
import { useSession } from '@/context/useSession'
import { bumpStreak } from '@/lib/streak'
import { usePolling } from '@/hooks/usePolling'
import type { QuizState } from '@/api/types'

export function SubmittedScreen() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const { user } = useSession()

  useEffect(() => {
    bumpStreak()
  }, [])

  const { data: state, error, refresh } = usePolling<QuizState>(
    () => (quizId ? api.getQuizState(quizId, user?.id) : Promise.reject(new Error('no id'))),
    { intervalMs: 4000 },
  )

  const done =
    state?.status === 'VALIDATING' ||
    state?.status === 'ENDED' ||
    state?.status === 'FINALIZED' ||
    state?.status === 'SETTLED'

  if (error && !state) {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-pill border-2 border-ink bg-danger-soft text-danger" aria-hidden>
            <Icon name="alert" size={34} weight="fill" />
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">Lost the connection</h1>
          <p className="max-w-xs text-sm leading-relaxed text-ink-soft">
            Your answers are saved and sealed on the server — this page just couldn't
            refresh. Nothing is lost.
          </p>
          <ErrorBanner>Couldn't check the room status. Check your connection.</ErrorBanner>
          <Button size="lg" onClick={() => void refresh()}>
            Try again
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-pill border-2 border-ink bg-volt text-ink shadow-press-sm" aria-hidden>
          <Icon name="lock" size={38} weight="fill" />
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
          You're <span className="highlight-swipe">locked in</span>
        </h1>
        <p className="max-w-xs text-sm leading-relaxed text-ink-soft">
          Your answers are submitted and sealed. The moment everyone finishes — or the clock
          runs out — results go live.
        </p>
        {!state ? (
          <div className="flex flex-col items-center gap-2" role="status">
            <div className="h-5 w-5 animate-spin rounded-pill border-2 border-paper-deep border-t-ink" aria-hidden />
            <span className="text-xs font-semibold text-ink-muted">Checking the room…</span>
          </div>
        ) : (
          <div className="flex items-center gap-2" role="status">
            <span className="text-xs font-bold text-ink-muted">Room status</span>
            <StatusPill status={state.status} />
          </div>
        )}
        {error && state && <StaleBanner />}
        {done && (
          <Button size="lg" onClick={() => navigate(quizId ? `/quiz/${quizId}/results` : '/home')}>
            See results
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
          Back to Home
        </Button>
      </div>
    </AppShell>
  )
}
