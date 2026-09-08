import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { PlaceholderScreen } from '@/components/PlaceholderScreen'

export function WelcomeScreen() {
  const navigate = useNavigate()
  return (
    <AppShell hideNav>
      {/* Phase 3 replaces this with the real welcome flow */}
      <PlaceholderScreen name="Welcome" />
      <button type="button" onClick={() => navigate('/home')} className="mx-auto block text-sm font-semibold text-primary-dark">
        Skip to Home
      </button>
    </AppShell>
  )
}
