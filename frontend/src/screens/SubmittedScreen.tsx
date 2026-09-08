import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@/api'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/Button'
import { StatusPill } from '@/components/StatusPill'
import { usePolling } from '@/hooks/usePolling'
import type { QuizState } from '@/api/types'

export function SubmittedScreen() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()

  const { data: state } = usePolling<QuizState>(
    () => (quizId ? api.getQuizState(quizId) : Promise.reject(new Error('no id'))),
    { intervalMs: 4000 },
  )

  const done = state?.status === 'VALIDATING' || state?.status === 'ENDED' || state?.status === 'FINALIZED' || state?.status === 'SETTLED'

  return (
    <AppShell>
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-20 w-20 animate-pulse items-center justify-center rounded-pill bg-success-soft text-4xl" aria-hidden>
          ✓
        </div>
        <h1 className="font-display text-2xl font-black text-ink">You're locked in</h1>
        <p className="max-w-xs text-sm leading-relaxed text-ink-soft">
          Your answers are submitted and sealed. The moment everyone finishes — or the clock
          runs out — results go live.
        </p>
        {state && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ink-muted">Room status</span>
            <StatusPill status={state.status} />
          </div>
        )}
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
