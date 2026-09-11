import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { api } from '@/api'
import type { QuizMode, User } from '@/api/types'
import { SessionContext } from './session-context'

const STORAGE_KEY = 'qestia.session.v1'

interface StoredSession {
  user: User
  mode: QuizMode
}

function loadStored(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredSession
    if (!parsed.user?.id || !parsed.user?.displayName) return null
    return parsed
  } catch {
    return null
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  // localStorage is read once, lazily, at first render — no restore effect needed
  const [stored, setStored] = useState<StoredSession | null>(() => loadStored())

  const persist = useCallback((next: StoredSession | null) => {
    setStored(next)
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const signIn = useCallback(
    async (displayName: string, mode: QuizMode = 'demo') => {
      const user = await api.createUser({ displayName })
      persist({ user, mode })
    },
    [persist],
  )

  const setMode = useCallback(
    (mode: QuizMode) => {
      setStored((prev) => {
        if (!prev) return prev
        const next = { ...prev, mode }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })
    },
    [],
  )

  const signOut = useCallback(() => {
    persist(null)
  }, [persist])

  const value = useMemo(
    () => ({
      user: stored?.user ?? null,
      mode: stored?.mode ?? 'demo',
      signIn,
      setMode,
      signOut,
    }),
    [stored, signIn, setMode, signOut],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
