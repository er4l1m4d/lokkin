import { NavLink } from 'react-router-dom'
import { Icon, type IconName } from './Icon'

const TABS = [
  { to: '/home', label: 'Home', icon: 'home' as IconName },
  { to: '/create', label: 'Create', icon: 'spark' as IconName },
  { to: '/profile', label: 'Profile', icon: 'user' as IconName },
] as const

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/90 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-2xl">
        {TABS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold transition-colors ${
                isActive ? 'text-primary-dark' : 'text-ink-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-10 w-12 items-center justify-center rounded-pill transition-colors ${
                    isActive ? 'bg-primary-soft' : ''
                  }`}
                  aria-hidden
                >
                  <Icon name={icon} size={20} strokeWidth={isActive ? 2.2 : 1.8} />
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
