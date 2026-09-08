import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useSession } from '@/context/useSession'
import { DevGallery } from '@/screens/DevGallery'
import { CommitScreen } from '@/screens/CommitScreen'
import { CreateScreen } from '@/screens/CreateScreen'
import { HomeScreen } from '@/screens/HomeScreen'
import { LobbyScreen } from '@/screens/LobbyScreen'
import { ProfileScreen } from '@/screens/ProfileScreen'
import { QuizDetailScreen } from '@/screens/QuizDetailScreen'
import { QuizPlayScreen } from '@/screens/QuizPlayScreen'
import { ResultsScreen } from '@/screens/ResultsScreen'
import { ReviewScreen } from '@/screens/ReviewScreen'
import { SubmittedScreen } from '@/screens/SubmittedScreen'
import { WelcomeScreen } from '@/screens/WelcomeScreen'

/** Blocks a route until a session exists; remembers where the user was going */
function RequireSession({ children }: { children: ReactNode }) {
  const { user } = useSession()
  const location = useLocation()
  if (!user) return <Navigate to="/" replace state={{ from: location }} />
  return children
}

/** Welcome is only for users without a session */
function RedirectIfSession({ children }: { children: ReactNode }) {
  const { user } = useSession()
  if (user) return <Navigate to="/home" replace />
  return children
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <RedirectIfSession>
              <WelcomeScreen />
            </RedirectIfSession>
          }
        />
        <Route path="/dev/gallery" element={<DevGallery />} />
        <Route
          path="/home"
          element={
            <RequireSession>
              <HomeScreen />
            </RequireSession>
          }
        />
        <Route
          path="/create"
          element={
            <RequireSession>
              <CreateScreen />
            </RequireSession>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireSession>
              <ProfileScreen />
            </RequireSession>
          }
        />
        <Route
          path="/quiz/:quizId"
          element={
            <RequireSession>
              <QuizDetailScreen />
            </RequireSession>
          }
        />
        <Route
          path="/quiz/:quizId/commit"
          element={
            <RequireSession>
              <CommitScreen />
            </RequireSession>
          }
        />
        <Route
          path="/quiz/:quizId/lobby"
          element={
            <RequireSession>
              <LobbyScreen />
            </RequireSession>
          }
        />
        <Route
          path="/quiz/:quizId/play"
          element={
            <RequireSession>
              <QuizPlayScreen />
            </RequireSession>
          }
        />
        <Route
          path="/quiz/:quizId/submitted"
          element={
            <RequireSession>
              <SubmittedScreen />
            </RequireSession>
          }
        />
        <Route
          path="/quiz/:quizId/results"
          element={
            <RequireSession>
              <ResultsScreen />
            </RequireSession>
          }
        />
        <Route
          path="/quiz/:quizId/review"
          element={
            <RequireSession>
              <ReviewScreen />
            </RequireSession>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
