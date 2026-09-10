import { useEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'

/** Standard screen frame: phone-width column + bottom nav + safe areas */
export function AppShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    mainRef.current?.focus()
  }, [location.pathname])

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-paper sm:border-x sm:border-line">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-20 rounded-pill bg-ink px-4 py-2 text-sm font-bold text-paper transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <main
        ref={mainRef}
        id="main-content"
        tabIndex={-1}
        className={`mx-auto w-full flex-1 animate-screen-enter px-5 pt-6 ${hideNav ? 'pb-10' : 'pb-28'}`}
        style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
      >
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  )
}
