import { Link } from 'react-router-dom'
import type { Quiz } from '@/api/types'
import { StatusPill } from './StatusPill'
import { Icon } from './Icon'

interface QuizCardProps {
  quiz: Quiz
}

export function QuizCard({ quiz }: QuizCardProps) {
  return (
    <Link
      to={`/quiz/${quiz.id}`}
      className="group block rounded-card bg-surface p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-base font-extrabold text-ink group-hover:text-primary-dark">{quiz.title}</h3>
        <StatusPill status={quiz.status} />
      </div>
      {quiz.description && (
        <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{quiz.description}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-semibold text-ink-soft">
        <span className="rounded-pill bg-primary-soft px-3 py-1 font-semibold text-primary-dark">
          {quiz.entryAmount} NIM
        </span>
        <span>
          {quiz.participantCount} player{quiz.participantCount === 1 ? '' : 's'}
        </span>
        <span>·</span>
        <span>
          {quiz.questionCount} question{quiz.questionCount === 1 ? '' : 's'}
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-ink-muted">
          <Icon name="clock" size={13} />
          {Math.round(quiz.durationSeconds / 60)} min
        </span>
        <Icon name="chevron-right" size={16} className="text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary-dark" />
      </div>
    </Link>
  )
}
