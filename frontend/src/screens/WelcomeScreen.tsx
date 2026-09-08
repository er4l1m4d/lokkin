import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/Button'
import { useSession } from '@/context/useSession'
import type { QuizMode } from '@/api/types'

const MODES: Array<{ id: QuizMode; emoji: string; title: string; blurb: string }> = [
  {
    id: 'demo',
    emoji: '🎮',
    title: 'Demo',
    blurb: 'Try the full flow with play money. No wallet needed.',
  },
  {
    id: 'practice',
    emoji: '📚',
    title: 'Practice',
    blurb: 'Study solo with AI-generated quizzes. Free, no stakes.',
  },
  {
    id: 'commitment',
    emoji: '🔥',
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
        <header className="pt-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-card bg-primary text-3xl shadow-lift" aria-hidden>
            🔒
          </div>
          <h1 className="mt-4 font-display text-3xl font-black text-ink">
            Lock in with Lokkin
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Prove what you know. Commit. Compete. Improve.
          </p>
        </header>

        <section aria-label="Choose your mode">
          <div className="flex flex-col gap-3">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setLocalMode(m.id)}
                aria-pressed={mode === m.id}
                className={`flex items-start gap-3 rounded-card border-2 p-4 text-left transition-all active:scale-[0.99] ${
                  mode === m.id
                    ? 'border-primary bg-primary-faint shadow-tap'
                    : 'border-line bg-white'
                }`}
              >
                <span className="text-2xl" aria-hidden>
                  {m.emoji}
                </span>
                <span>
                  <span className="block font-display text-base font-extrabold text-ink">
                    {m.title}
                  </span>
                  <span className="block text-xs leading-relaxed text-ink-soft">
                    {m.blurb}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section aria-label="Your details" className="flex flex-col gap-3">
          <label htmlFor="displayName" className="text-xs font-bold tracking-wide text-ink-muted uppercase">
            What should we call you?
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
            className="w-full rounded-card border-2 border-line bg-white px-4 py-3.5 font-medium text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
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

        <p className="text-center text-[11px] leading-relaxed text-ink-muted">
          Demo and Practice are free. Commitment mode uses real NIM via your Nimiq wallet —
          you can link one later from your profile.
        </p>
      </div>
    </AppShell>
  )
}
