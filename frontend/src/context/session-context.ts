import { createContext } from 'react'
import type { QuizMode, User } from '@/api/types'

export interface SessionContextValue {
  user: User | null
  mode: QuizMode
  /** create a session with a display name (and optional mode pick) */
  signIn: (displayName: string, mode?: QuizMode) => Promise<void>
  setMode: (mode: QuizMode) => void
  signOut: () => void
}

export const SessionContext = createContext<SessionContextValue | null>(null)
