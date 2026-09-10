import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/Button'
import { Icon, type IconName } from '@/components/Icon'
import { StepDots } from '@/components/StepDots'
import { useSession } from '@/context/useSession'
import type { QuizMode } from '@/api/types'

const STEPS = ['Intro', 'Lane', 'You'] as const

const MODES: Array<{ id: QuizMode; icon: IconName; title: string; blurb: string }> = [
  {
    id: 'demo',
    icon: 'gamepad',
    title: 'Demo',
    blurb: 'The full flow with play money. No wallet needed.',
  },
  {
    id: 'practice',
    icon: 'book',
    title: 'Practice',
    blurb: 'Study solo with AI-drafted Trials. Free, no stakes.',
  },
  {
    id: 'commitment',
    icon: 'flame',
    title: 'Commitment',
    blurb: 'Lock in NIM, compete live. Top 3 take the pool.',
  },
]

const SUBJECTS = [
  'Anatomy', 'Biology', 'Chemistry', 'Physics', 'Mathematics', 'Economics',
  'Law', 'Medicine', 'Computer Science', 'History', 'Languages', 'Other',
] as const

export function WelcomeScreen() {
  const navigate = useNavigate()
  const { signIn } = useSession()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [mode, setMode] = useState<QuizMode>('demo')
  const [subjects, setSubjects] = useState<string[]>([])
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
      if (subjects.length) {
        try { localStorage.setItem('nivora.subjects', JSON.stringify(subjects)) } catch { /* non-essential */ }
      }
      await signIn(trimmed, mode)
      navigate('/home', { replace: true })
    } catch {
      setError('Could not start your session. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell hideNav>
      <div className="flex min-h-[calc(100dvh-6rem)] flex-col">
        <header className="relative flex items-center justify-center">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="absolute left-0 flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-pill border-2 border-ink bg-surface text-ink transition-colors hover:bg-paper-deep"
              aria-label="Previous step"
            >
              <Icon name="caret-left" size={18} weight="bold" />
            </button>
          )}
          <StepDots steps={STEPS} current={step} />
        </header>

        <div key={step} className="flex flex-1 flex-col animate-screen-enter">
          {step === 0 && <StepIntro onNext={() => setStep(1)} />}
          {step === 1 && <StepLane mode={mode} onMode={setMode} onNext={() => setStep(2)} />}
          {step === 2 && (
            <StepYou
              name={name}
              onName={setName}
              subjects={subjects}
              onToggleSubject={(s) =>
                setSubjects((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
              }
              error={error}
              busy={busy}
              onEnter={() => void enter()}
            />
          )}
        </div>
      </div>
    </AppShell>
  )
}

/* ── Step 1 · Value proposition ─────────────────────────────────────── */

function StepIntro({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-8 flex items-center gap-2" aria-hidden>
        <span className="flex h-9 w-9 items-center justify-center rounded-card border-2 border-ink bg-ink text-volt">
          <Icon name="lock" size={20} weight="fill" />
        </span>
        <span className="font-display text-xl font-extrabold tracking-tight">Nivora</span>
      </div>

      <h1 className="mt-10 font-display text-[2.75rem] font-extrabold leading-[1.04] tracking-tight text-ink">
        Don't just know it. <span className="highlight-swipe">Prove it.</span>
      </h1>
      <p className="mt-4 max-w-[32ch] text-[15px] leading-relaxed text-ink-soft">
        Turn your notes into live Trials. Stake NIM on yourself, go head-to-head with your
        class, and take the pot.
      </p>

      {/* Mini quiz-card still life — the product in one glance */}
      <div className="mt-8 rounded-card border-2 border-ink bg-ink p-4 shadow-press" aria-hidden>
        <div className="rounded-card border-2 border-ink bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="rounded-pill bg-volt px-2.5 py-1 font-display text-[11px] font-extrabold text-ink">
              50 NIM · LIVE
            </span>
            <span className="font-display text-sm font-extrabold text-ink-muted tabular-nums">2:41</span>
          </div>
          <p className="mt-3 font-display text-base font-extrabold leading-snug text-ink">
            Which structure anchors the heart?
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <span className="flex items-center gap-2 rounded-pill border-2 border-ink bg-volt px-3 py-2 text-xs font-bold text-ink">
              <span className="flex h-5 w-5 items-center justify-center rounded-pill border-2 border-ink bg-ink text-[9px] text-volt">A</span>
              Pericardium
              <Icon name="check" size={13} weight="bold" className="ml-auto" />
            </span>
            <span className="flex items-center gap-2 rounded-pill border-2 border-line px-3 py-2 text-xs font-semibold text-ink-soft">
              <span className="flex h-5 w-5 items-center justify-center rounded-pill border-2 border-line text-[9px]">B</span>
              Septum
            </span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between px-1">
          <span className="font-display text-[11px] font-bold tracking-wide text-paper/70 uppercase">
            4 challengers locked in
          </span>
          <Icon name="lightning" size={14} weight="fill" className="text-volt" />
        </div>
      </div>

      <div className="mt-auto pt-8">
        <Button size="lg" block onClick={onNext}>
          Prove it <Icon name="arrow-right" size={18} weight="bold" />
        </Button>
      </div>
    </div>
  )
}

/* ── Step 2 · Choose your lane ──────────────────────────────────────── */

function StepLane({
  mode,
  onMode,
  onNext,
}: {
  mode: QuizMode
  onMode: (m: QuizMode) => void
  onNext: () => void
}) {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="mt-8 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-ink">
        Pick your <span className="highlight">lane</span>
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
        Three ways in. You can switch any time from your profile.
      </p>

      <div className="mt-6 flex flex-col gap-3" role="radiogroup" aria-label="Mode">
        {MODES.map((m) => {
          const active = mode === m.id
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onMode(m.id)}
              className={`press flex min-h-20 items-center gap-3 rounded-card border-2 p-4 text-left transition-colors ${
                active ? 'border-ink bg-volt shadow-press-sm' : 'border-line bg-surface hover:border-ink'
              }`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-card border-2 ${
                  active ? 'border-ink bg-ink text-volt' : 'border-ink bg-surface text-ink'
                }`}
                aria-hidden
              >
                <Icon name={m.icon} size={22} weight={active ? 'fill' : 'regular'} />
              </span>
              <span>
                <span className="block font-display text-lg font-extrabold tracking-tight text-ink">
                  {m.title}
                </span>
                <span className="mt-0.5 block text-sm leading-snug text-ink-soft">{m.blurb}</span>
              </span>
              {active && (
                <Icon name="check-circle" size={22} weight="fill" className="ml-auto shrink-0 text-ink" />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-auto pt-8">
        <Button size="lg" block onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  )
}

/* ── Step 3 · Subject + name ────────────────────────────────────────── */

function StepYou({
  name,
  onName,
  subjects,
  onToggleSubject,
  error,
  busy,
  onEnter,
}: {
  name: string
  onName: (v: string) => void
  subjects: string[]
  onToggleSubject: (s: string) => void
  error: string | null
  busy: boolean
  onEnter: () => void
}) {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="mt-8 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-ink">
        What are you <span className="highlight">studying</span>?
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
        Pick a few so your home feed starts close to home. Skip if you'd rather browse.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {SUBJECTS.map((s) => {
          const active = subjects.includes(s)
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              onClick={() => onToggleSubject(s)}
              className={`min-h-10 cursor-pointer rounded-pill border-2 px-4 text-sm font-semibold transition-colors ${
                active ? 'border-ink bg-volt text-ink' : 'border-line bg-surface text-ink-soft hover:border-ink'
              }`}
            >
              {s}
            </button>
          )
        })}
      </div>

      <div className="mt-7">
        <label htmlFor="displayName" className="font-display text-base font-extrabold tracking-tight text-ink">
          And who's competing?
        </label>
        <input
          id="displayName"
          type="text"
          value={name}
          maxLength={30}
          placeholder="e.g. Ada the Anatomist"
          onChange={(e) => onName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEnter()
          }}
          autoComplete="nickname"
          className="mt-2 min-h-13 w-full rounded-card border-2 border-ink bg-surface px-4 text-base font-medium text-ink placeholder:text-ink-muted/70 focus:bg-volt-faint"
        />
        {error && (
          <p className="mt-2 text-sm font-semibold text-danger" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="mt-auto pt-8">
        <Button size="lg" block onClick={onEnter} disabled={busy}>
          {busy ? 'Locking in…' : 'Enter Nivora'}
          {!busy && <Icon name="lock" size={18} weight="fill" />}
        </Button>
        <p className="mt-3 text-center text-xs leading-relaxed text-ink-muted">
          Demo and Practice are free. Commitment mode uses real NIM via your Nimiq wallet — link
          one later from your profile.
        </p>
      </div>
    </div>
  )
}
