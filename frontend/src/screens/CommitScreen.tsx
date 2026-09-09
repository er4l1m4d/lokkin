import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@/api'
import type { AppConfig, JoinResult } from '@/api/types'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { MemoCard } from '@/components/MemoCard'
import { useSession } from '@/context/useSession'
import { isWalletAvailable, sendCommitment } from '@/lib/nimiq'

type Stage = 'summary' | 'confirming' | 'send' | 'verifying' | 'confirmed'

export function CommitScreen() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const { user } = useSession()

  const [entry, setEntry] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [stage, setStage] = useState<Stage>('summary')
  const [join, setJoin] = useState<JoinResult | null>(null)
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [walletAvailable, setWalletAvailable] = useState<boolean | null>(null)
  const [pastedHash, setPastedHash] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<string | null>(null)

  useEffect(() => {
    if (!quizId) return
    let cancelled = false
    void api.getConfig().then((c) => {
      if (!cancelled) setConfig(c)
    })
    void api.getQuiz(quizId).then((quiz) => {
      if (!cancelled) {
        setEntry(quiz.entryAmount)
        setTitle(quiz.title)
      }
    }).catch(() => {
      if (!cancelled) setError('Quiz not found')
    })
    return () => {
      cancelled = true
    }
  }, [quizId])

  // wallet availability probe (non-blocking; null = still checking)
  useEffect(() => {
    void isWalletAvailable().then(setWalletAvailable)
  }, [])

  const confirm = useCallback(async () => {
    if (!quizId || !user) return
    setStage('confirming')
    setError(null)
    try {
      const result = await api.joinQuiz(quizId, user.id)
      setJoin(result)
      if (result.status === 'JOINED') {
        setStage('confirmed') // mock mode: instantly confirmed
      } else {
        setStage('send')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Commitment failed — try again')
      setStage('summary')
    }
  }, [quizId, user])

  const submitTxRef = useCallback(async (txRef: string) => {
    if (!quizId || !join) return
    setStage('verifying')
    setError(null)
    setDetail(null)
    try {
      const res = await api.verifyCommitment(quizId, join.participantId, txRef)
      if (res.verified) {
        setStage('confirmed')
      } else {
        setDetail(res.detail)
        setStage('send')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed — try again')
      setStage('send')
    }
  }, [quizId, join])

  const payFromWallet = useCallback(async () => {
    if (!join || !join.escrowAddress || !entry) return
    setDetail(null)
    setError(null)
    const res = await sendCommitment(join.escrowAddress, entry, join.memoCode ?? '')
    if ('txRef' in res) {
      await submitTxRef(res.txRef)
    } else {
      setError(res.error)
    }
  }, [join, entry, submitTxRef])

  if (error && entry === null) {
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

  if (entry === null) {
    return (
      <AppShell>
        <div className="h-64 animate-pulse rounded-card bg-surface-muted" />
      </AppShell>
    )
  }

  const realMode = config?.paymentsMode === 'real'

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <header>
          <h1 className="font-display text-2xl font-black text-ink">Lock in your stake</h1>
          <p className="mt-1 text-sm text-ink-soft">{title}</p>
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
                {entry} NIM
              </p>
              {realMode ? (
                <p className="mt-1 text-xs font-semibold text-ink-soft">
                  Real NIM · sent from your Nimiq wallet · feeless
                </p>
              ) : (
                <p className="mt-1 text-xs text-ink-muted">Play money — instantly confirmed</p>
              )}
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
                Needs at least 3 confirmed commitments to run — otherwise everyone is
                auto-refunded in full.
              </p>
            </section>

            <Button size="lg" onClick={() => void confirm()}>
              Commit {entry} NIM
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
              {realMode ? 'Reserving your spot…' : 'Confirming transaction…'}
            </p>
            <p className="text-xs text-ink-muted">
              {realMode ? 'Generating your commitment code' : 'Mock payments mode — instant confirmation'}
            </p>
          </section>
        )}

        {(stage === 'send' || stage === 'verifying') && join && (
          <>
            {detail && (
              <p className="rounded-card bg-amber-soft px-4 py-3 text-sm font-semibold text-ink" role="status">
                {detail}
              </p>
            )}
            <MemoCard code={join.memoCode ?? ''} address={join.escrowAddress ?? ''} />

            {stage === 'verifying' ? (
              <section className="flex flex-col items-center gap-3 rounded-card bg-surface p-8 text-center shadow-soft">
                <div className="h-12 w-12 animate-spin rounded-pill border-4 border-primary-soft border-t-primary" />
                <p className="font-display text-base font-extrabold text-ink">
                  Verifying on-chain…
                </p>
                <p className="text-xs text-ink-muted">
                  This page keeps checking — you can also come back later.
                </p>
              </section>
            ) : (
              <>
                <Button
                  size="lg"
                  onClick={() => void payFromWallet()}
                  disabled={walletAvailable === false}
                >
                  {walletAvailable === false
                    ? 'No wallet — send manually below'
                    : `Send ${entry} NIM from your wallet`}
                </Button>

                {walletAvailable === false && (
                  <section className="rounded-card bg-surface p-5 shadow-soft">
                    <p className="text-sm font-bold text-ink">Sent it manually?</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                      Send exactly {entry} NIM to the escrow address with your memo code above,
                      then paste the transaction hash here to confirm.
                    </p>
                    <div className="mt-3 flex flex-col gap-2">
                      <input
                        type="text"
                        value={pastedHash}
                        onChange={(e) => setPastedHash(e.target.value)}
                        placeholder="Transaction hash"
                        aria-label="Transaction hash"
                        className="min-h-12 w-full rounded-card border-2 border-line bg-surface px-4 py-3 text-base font-medium text-ink placeholder:text-ink-muted focus:border-primary"
                      />
                      <Button
                        disabled={pastedHash.trim().length < 8}
                        onClick={() => void submitTxRef(pastedHash.trim())}
                      >
                        Verify transaction
                      </Button>
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}

        {stage === 'confirmed' && (
          <>
            <section className="flex flex-col items-center gap-2 rounded-card bg-success-soft px-6 py-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-white/60 text-success" aria-hidden>
                <Icon name="check" size={28} strokeWidth={2.4} />
              </span>
              <h2 className="font-display text-xl font-black text-ink">You're in</h2>
              <p className="text-sm text-ink-soft">
                {entry} NIM committed and {realMode ? 'confirmed on-chain' : 'confirmed'}.
              </p>
            </section>

            {join?.memoCode && <MemoCard code={join.memoCode} address={join.escrowAddress ?? ''} />}

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
