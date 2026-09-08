import { useParams } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { PlaceholderScreen } from '@/components/PlaceholderScreen'

export function QuizPlayScreen() {
  const { quizId } = useParams()
  return (
    <AppShell hideNav>
      <PlaceholderScreen name={`Quiz Play — ${quizId ?? ''}`} />
    </AppShell>
  )
}
