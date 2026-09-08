import { useParams } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { PlaceholderScreen } from '@/components/PlaceholderScreen'

export function CommitScreen() {
  const { quizId } = useParams()
  return (
    <AppShell>
      <PlaceholderScreen name={`Commitment — ${quizId ?? ''}`} />
    </AppShell>
  )
}
