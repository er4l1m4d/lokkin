import type { Participant, ParticipantStatus } from '@/api/types'

const STATUS_DOTS: Record<ParticipantStatus, string> = {
  JOINED: 'bg-ink-muted',
  ACTIVE: 'bg-danger',
  COMPLETED: 'bg-success',
  TIMED_OUT: 'bg-amber',
  FORFEITED: 'bg-ink-muted',
  DISQUALIFIED: 'bg-ink-muted',
}

interface ParticipantRowProps {
  participant: Participant
  isCreator?: boolean
}

export function ParticipantRow({ participant, isCreator }: ParticipantRowProps) {
  return (
    <li className="flex items-center gap-3 rounded-card bg-white px-4 py-3 shadow-tap">
      <span
        className={`h-2.5 w-2.5 rounded-pill ${STATUS_DOTS[participant.status]}`}
        title={participant.status}
        aria-hidden
      />
      <span className="truncate font-display text-sm font-bold text-ink">
        {participant.displayName}
      </span>
      {isCreator && (
        <span className="rounded-pill bg-primary-faint px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary-dark uppercase">
          Host
        </span>
      )}
      {participant.rank && (
        <span className="ml-auto text-xs font-bold text-ink-soft">#{participant.rank}</span>
      )}
    </li>
  )
}
