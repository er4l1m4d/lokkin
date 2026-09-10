import { Icon } from './Icon'

interface StepDotsProps {
  steps: readonly string[]
  current: number
}

export function StepDots({ steps, current }: StepDotsProps) {
  return (
    <ol className="flex items-center justify-center gap-2" aria-label="Progress">
      {steps.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'todo'
        return (
          <li key={label} className="flex items-center gap-2" aria-current={state === 'active' ? 'step' : undefined}>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-pill border-2 font-display text-xs font-extrabold transition-colors ${
                state === 'done'
                  ? 'border-ink bg-ink text-paper'
                  : state === 'active'
                    ? 'border-ink bg-volt text-ink'
                    : 'border-line bg-surface text-ink-muted'
              }`}
            >
              {state === 'done' ? <Icon name="check" size={14} weight="bold" /> : i + 1}
            </span>
            <span
              className={`text-xs font-semibold ${
                state === 'active' ? 'text-ink' : 'text-ink-muted'
              } hidden sm:inline`}
            >
              {label}
            </span>
            {i < steps.length - 1 && <span className="h-0.5 w-4 rounded-full bg-line" aria-hidden />}
          </li>
        )
      })}
    </ol>
  )
}
