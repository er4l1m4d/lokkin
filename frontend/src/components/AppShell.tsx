import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

/** Standard screen frame: scrollable content + bottom nav + safe areas */
export function AppShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <main
        className={`flex-1 px-5 pt-6 ${hideNav ? 'pb-8' : 'pb-28'}`}
        style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
      >
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  )
}
