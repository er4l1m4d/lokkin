import type { OptionKey } from '@/api/types'

interface OptionButtonProps {
  optionKey: OptionKey
  text: string
  /** currently selected by the player (pre-confirm) */
  selected: boolean
  /** reveal state after confirm */
  reveal?: 'correct' | 'wrong' | 'missed'
  disabled?: boolean
  onSelect: (key: OptionKey) => void
}

const KEY_LETTERS: Record<OptionKey, string> = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
}

export function OptionButton({
  optionKey,
  text,
  selected,
  reveal,
  disabled = false,
  onSelect,
}: OptionButtonProps) {
  const base =
    'flex w-full items-center gap-3 rounded-card border-2 bg-white p-4 text-left transition-all duration-150'

  const state = (() => {
    if (reveal === 'correct') return 'border-success bg-success-soft'
    if (reveal === 'wrong') return 'border-danger bg-danger-soft'
    if (reveal === 'missed') return 'border-line bg-canvas-deep opacity-70'
    if (selected) return 'border-primary bg-primary-faint shadow-tap'
    return 'border-line hover:border-primary-soft active:scale-[0.99]'
  })()

  const keyBadge = (() => {
    if (reveal === 'correct') return 'bg-success text-white'
    if (reveal === 'wrong') return 'bg-danger text-white'
    if (selected) return 'bg-primary text-white'
    return 'bg-canvas-deep text-ink-soft'
  })()

  const icon = (() => {
    if (reveal === 'correct') return '✓'
    if (reveal === 'wrong') return '✗'
    return KEY_LETTERS[optionKey]
  })()

  return (
    <button
      type="button"
      className={`${base} ${state} ${disabled ? 'cursor-default' : ''}`}
      disabled={disabled}
      onClick={() => onSelect(optionKey)}
      aria-pressed={selected}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-pill font-display text-sm font-extrabold ${keyBadge}`}
      >
        {icon}
      </span>
      <span className="text-sm font-medium text-ink">{text}</span>
    </button>
  )
}
