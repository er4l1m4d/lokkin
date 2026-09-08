import { Link } from 'react-router-dom'
import type { Quiz } from '@/api/types'
import { StatusPill } from './StatusPill'

interface QuizCardProps {
  quiz: Quiz
}

export function QuizCard({ quiz }: QuizCardProps) {
  return (
    <Link
      to={`/quiz/${quiz.id}`}
      className="block rounded-card bg-white p-5 shadow-soft transition-shadow hover:shadow-lift"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-base font-extrabold text-ink">{quiz.title}</h3>
        <StatusPill status={quiz.status} />
      </div>
      {quiz.description && (
        <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{quiz.description}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-semibold text-ink-soft">
        <span className="rounded-pill bg-primary-soft px-3 py-1 font-display font-extrabold text-primary-dark">
          {quiz.entryAmount} NIM
        </span>
        <span>
          {quiz.participantCount} player{quiz.participantCount === 1 ? '' : 's'}
        </span>
        <span>·</span>
        <span>
          {quiz.questionCount} question{quiz.questionCount === 1 ? '' : 's'}
        </span>
        <span className="ml-auto text-ink-muted">
          {Math.round(quiz.durationSeconds / 60)} min
        </span>
      </div>
    </Link>
  )
}
