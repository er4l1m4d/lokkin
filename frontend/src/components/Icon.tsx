import type { ComponentType } from 'react'
import type { IconProps as PhosphorIconProps, IconWeight } from '@phosphor-icons/react'
import {
  ArrowClockwise,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  CaretDown,
  CaretLeft,
  CaretRight,
  ChartBar,
  Check,
  CheckCircle,
  Clock,
  Coins,
  Copy,
  Crown,
  Exam,
  Eye,
  FileText,
  Fire,
  GameController,
  HandCoins,
  Hourglass,
  House,
  Info,
  Lightning,
  ListChecks,
  LockKey,
  Medal,
  NotePencil,
  Percent,
  PencilSimple,
  Play,
  Plus,
  Question,
  Ranking,
  ShieldCheck,
  Sparkle,
  Star,
  Target,
  Timer,
  Trash,
  Trophy,
  User,
  Users,
  Vault,
  Wallet,
  Warning,
  X,
  XCircle,
} from '@phosphor-icons/react'

export type IconName =
  | 'alert'
  | 'arrow-down'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up'
  | 'book'
  | 'caret-down'
  | 'caret-left'
  | 'chart'
  | 'check'
  | 'check-circle'
  | 'chevron-right'
  | 'clock'
  | 'coins'
  | 'copy'
  | 'crown'
  | 'exam'
  | 'eye'
  | 'file'
  | 'flame'
  | 'gamepad'
  | 'hand-coins'
  | 'home'
  | 'hourglass'
  | 'info'
  | 'lightning'
  | 'list'
  | 'lock'
  | 'medal'
  | 'note'
  | 'percent'
  | 'pencil'
  | 'play'
  | 'plus'
  | 'podium'
  | 'question'
  | 'refresh'
  | 'shield'
  | 'spark'
  | 'star'
  | 'target'
  | 'timer'
  | 'trash'
  | 'trophy'
  | 'user'
  | 'users'
  | 'vault'
  | 'wallet'
  | 'x'
  | 'x-circle'

const ICONS: Record<IconName, ComponentType<PhosphorIconProps>> = {
  alert: Warning,
  'arrow-down': ArrowDown,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-up': ArrowUp,
  book: BookOpen,
  'caret-down': CaretDown,
  'caret-left': CaretLeft,
  chart: ChartBar,
  check: Check,
  'check-circle': CheckCircle,
  'chevron-right': CaretRight,
  clock: Clock,
  coins: Coins,
  copy: Copy,
  crown: Crown,
  exam: Exam,
  eye: Eye,
  file: FileText,
  flame: Fire,
  gamepad: GameController,
  'hand-coins': HandCoins,
  home: House,
  hourglass: Hourglass,
  info: Info,
  lightning: Lightning,
  list: ListChecks,
  lock: LockKey,
  medal: Medal,
  note: NotePencil,
  percent: Percent,
  pencil: PencilSimple,
  play: Play,
  plus: Plus,
  podium: Ranking,
  question: Question,
  refresh: ArrowClockwise,
  shield: ShieldCheck,
  spark: Sparkle,
  star: Star,
  target: Target,
  timer: Timer,
  trash: Trash,
  trophy: Trophy,
  user: User,
  users: Users,
  vault: Vault,
  wallet: Wallet,
  x: X,
  'x-circle': XCircle,
}

interface IconProps extends Omit<PhosphorIconProps, 'icon'> {
  name: IconName
  size?: number
  /** legacy compat: values ≥ 2.2 map to the bold weight */
  strokeWidth?: number
}

export function Icon({ name, size = 20, weight, strokeWidth, ...props }: IconProps) {
  const Component = ICONS[name]
  const resolvedWeight: IconWeight = weight ?? (strokeWidth !== undefined && strokeWidth >= 2.2 ? 'bold' : 'regular')
  return <Component aria-hidden size={size} weight={resolvedWeight} {...props} />
}
