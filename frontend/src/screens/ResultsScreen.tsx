import { useParams } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { PlaceholderScreen } from '@/components/PlaceholderScreen'

export function ResultsScreen() {
  const { quizId } = useParams()
  return (
    <AppShell>
      <PlaceholderScreen name={`Results — ${quizId ?? ''}`} />
    </AppShell>
  )
}
