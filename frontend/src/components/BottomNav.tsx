import { NavLink } from 'react-router-dom'
import { Icon, type IconName } from './Icon'

const TABS = [
  { to: '/home', label: 'Home', icon: 'home' as IconName },
  { to: '/create', label: 'Create', icon: 'plus' as IconName },
  { to: '/profile', label: 'Profile', icon: 'user' as IconName },
] as const

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-surface"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Main navigation"
    >
      <div className="mx-auto flex w-full max-w-md">
        {TABS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 font-display text-[11px] font-bold tracking-tight transition-colors ${
                isActive ? 'text-ink' : 'text-ink-muted hover:text-ink-soft'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-9 w-14 items-center justify-center rounded-pill border-2 transition-colors ${
                    isActive ? 'border-ink bg-volt text-ink' : 'border-transparent'
                  }`}
                  aria-hidden
                >
                  <Icon name={icon} size={19} weight={isActive ? 'fill' : 'regular'} />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
