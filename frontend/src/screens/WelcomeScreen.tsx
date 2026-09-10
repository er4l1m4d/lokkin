import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/Button'
import { Icon, type IconName } from '@/components/Icon'
import { useSession } from '@/context/useSession'
import type { QuizMode } from '@/api/types'

const MODES: Array<{ id: QuizMode; icon: IconName; title: string; blurb: string }> = [
  {
    id: 'demo',
    icon: 'gamepad',
    title: 'Demo',
    blurb: 'Try the full flow with play money. No wallet needed.',
  },
  {
    id: 'practice',
    icon: 'book',
    title: 'Practice',
    blurb: 'Study solo with AI-generated quizzes. Free, no stakes.',
  },
  {
    id: 'commitment',
    icon: 'flame',
    title: 'Commitment',
    blurb: 'Lock in NIM, compete live. Top 3 take the pool.',
  },
]

export function WelcomeScreen() {
  const navigate = useNavigate()
  const { signIn } = useSession()
  const [name, setName] = useState('')
  const [mode, setLocalMode] = useState<QuizMode>('demo')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const enter = async () => {
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setError('Pick a name — at least 2 characters')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await signIn(trimmed, mode)
      navigate('/home')
    } catch {
      setError('Could not start your session. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell hideNav>
      <div className="flex flex-col gap-6">
        <header className="relative overflow-hidden rounded-card bg-primary-dark px-6 pb-7 pt-10 text-center text-white shadow-lift">
          <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-pill bg-primary/40" aria-hidden />
          <div className="pointer-events-none absolute -bottom-20 -left-12 h-36 w-36 rounded-pill bg-primary/30" aria-hidden />
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-card bg-white/15 text-white ring-1 ring-white/25" aria-hidden>
            <Icon name="lock" size={28} strokeWidth={1.8} />
          </div>
          <h1 className="relative mt-4 font-display text-3xl font-black text-white">
            Lock in with Lokkin
          </h1>
          <p className="relative mt-2 text-sm leading-relaxed text-white/80">
            Prove what you know. Commit. Compete. Improve.
          </p>
        </header>

        <section aria-labelledby="mode-heading">
          <div className="mb-3 flex items-end justify-between">
            <h2 id="mode-heading" className="text-lg text-ink">Choose your lane</h2>
            <span className="text-xs font-medium text-ink-muted">Then pick a name</span>
          </div>
          <div className="flex flex-col gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setLocalMode(m.id)}
                aria-pressed={mode === m.id}
                className={`flex min-h-20 items-start gap-3 rounded-card border-2 p-4 text-left transition-all duration-200 active:scale-[0.99] ${
                  mode === m.id
                    ? 'border-primary bg-primary-faint shadow-tap'
                    : 'border-line bg-white'
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-card ${mode === m.id ? 'bg-primary text-white' : 'bg-primary-faint text-primary-dark'}`} aria-hidden>
                  <Icon name={m.icon} size={20} />
                </span>
                <span>
                  <span className="block font-display text-base font-extrabold text-ink">
                    {m.title}
                  </span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-ink-soft">
                    {m.blurb}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="name-heading" className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-soft">
          <div>
            <h2 id="name-heading" className="text-lg text-ink">What should we call you?</h2>
          </div>
          <label htmlFor="displayName" className="text-sm font-medium text-ink-soft">
            Display name — this is how you'll appear on the leaderboard
          </label>
          <input
            id="displayName"
            type="text"
            value={name}
            maxLength={30}
            placeholder="e.g. Ada the Anatomist"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void enter()
            }}
            autoComplete="nickname"
            className="min-h-12 w-full rounded-card border-2 border-line bg-surface px-4 py-3.5 text-base font-medium text-ink placeholder:text-ink-muted focus:border-primary"
          />
          {error && (
            <p className="text-sm font-semibold text-danger" role="alert">
              {error}
            </p>
          )}
          <Button size="lg" onClick={() => void enter()} disabled={busy}>
            {busy ? 'Locking in…' : 'Enter Lokkin'}
          </Button>
        </section>

        <p className="text-center text-xs leading-relaxed text-ink-muted">
          Demo and Practice are free. Commitment mode uses real NIM via your Nimiq wallet —
          you can link one later from your profile.
        </p>
      </div>
    </AppShell>
  )
}
