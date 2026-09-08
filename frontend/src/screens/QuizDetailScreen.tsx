import { useParams } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { PlaceholderScreen } from '@/components/PlaceholderScreen'

export function QuizDetailScreen() {
  const { quizId } = useParams()
  return (
    <AppShell>
      <PlaceholderScreen name={`Quiz Detail — ${quizId ?? ''}`} />
    </AppShell>
  )
}
