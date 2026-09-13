import { useState } from 'react'
import type { Participant, Quiz, ResultRow } from '@/api/types'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { MemoCard } from '@/components/MemoCard'
import { MeterBar } from '@/components/MeterBar'
import { Modal } from '@/components/Modal'
import { OptionButton } from '@/components/OptionButton'
import { ParticipantRow } from '@/components/ParticipantRow'
import { PodiumSlot } from '@/components/PodiumSlot'
import { QuizCard } from '@/components/QuizCard'
import { StatusPill } from '@/components/StatusPill'
import { StepDots } from '@/components/StepDots'
import { TimerPill } from '@/components/TimerPill'

const demoQuiz: Quiz = {
  id: 'demo',
  title: 'Cell Biology Final',
  description: 'Mitosis, membranes, and everything your lecturer warned you about.',
  status: 'OPEN',
  currency: 'NIM',
  entryAmount: 50,
  durationSeconds: 300,
  questionCount: 10,
  minParticipants: 3,
  participantCount: 4,
  startsAt: null,
  creatorId: 'creator',
}

const demoParticipants: Participant[] = [
  {
    id: 'p1',
    quizId: 'demo',
    userId: 'u1',
    displayName: 'Ada',
    status: 'COMPLETED',
    disconnectCount: 0,
    correctAnswers: 9,
    scorePercentage: 90,
    rank: 1,
    entryAmount: 50,
  },
  {
    id: 'p2',
    quizId: 'demo',
    userId: 'u2',
    displayName: 'Zainab',
    status: 'ACTIVE',
    disconnectCount: 1,
    correctAnswers: 4,
    scorePercentage: null,
    rank: null,
    entryAmount: 50,
  },
]

const podiumRows: ResultRow[] = [
  {
    participantId: 'p1',
    displayName: 'Ada',
    correctAnswers: 9,
    totalQuestions: 10,
    scorePercentage: 90,
    rank: 1,
    entryAmount: 50,
    payout: 77.5,
    payoutKind: 'winner',
  },
  {
    participantId: 'p2',
    displayName: 'Zainab',
    correctAnswers: 7,
    totalQuestions: 10,
    scorePercentage: 70,
    rank: 2,
    entryAmount: 50,
    payout: 59.5,
    payoutKind: 'winner',
  },
  {
    participantId: 'p3',
    displayName: 'Kofi',
    correctAnswers: 6,
    totalQuestions: 10,
    scorePercentage: 60,
    rank: 3,
    entryAmount: 50,
    payout: 53.5,
    payoutKind: 'winner',
  },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border-2 border-ink bg-surface p-5 shadow-card">
      <h2 className="mb-4 font-display text-base font-extrabold tracking-tight text-ink">{title}</h2>
      {children}
    </section>
  )
}

export function DevGallery() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<'A' | 'B' | 'C' | 'D'>('B')
  const [demoUntil] = useState(() => new Date(Date.now() + 90_000))

  return (
    <main className="mx-auto flex h-dvh max-w-md flex-col gap-4 overflow-y-auto border-line px-5 py-8 sm:border-x">
      <header className="text-center">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
          Component <span className="highlight">Gallery</span>
        </h1>
        <p className="mt-1 text-sm text-ink-soft">Dev-only route — every shared component in one place</p>
      </header>

      <Section title="StatusPill">
        <div className="flex flex-wrap gap-2">
          {(['OPEN', 'LIVE', 'ENDED', 'VALIDATING', 'FINALIZED', 'SETTLED', 'CANCELLED'] as const).map(
            (s) => (
              <StatusPill key={s} status={s} />
            ),
          )}
        </div>
      </Section>

      <Section title="TimerPill + MeterBar">
        <div className="flex items-center gap-3">
          <TimerPill seconds={195} />
          <TimerPill seconds={22} />
          <TimerPill until={demoUntil} />
        </div>
        <div className="mt-4">
          <MeterBar value={2} target={3} max={8} label="Confirmed commitments" />
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-col gap-2">
          <Button size="lg">Enter a Qest</Button>
          <Button variant="secondary" size="lg">
            Practice free
          </Button>
          <div className="flex gap-2">
            <Button size="sm">Join</Button>
            <Button size="sm" variant="danger">
              Leave
            </Button>
            <Button size="sm" variant="ghost">
              Details
            </Button>
            <Button size="sm" disabled>
              Locked
            </Button>
          </div>
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Open modal
          </Button>
        </div>
      </Section>

      <Section title="StepDots">
        <StepDots steps={['Upload', 'Generate', 'Review']} current={1} />
      </Section>

      <Section title="QuizCard">
        <QuizCard quiz={demoQuiz} />
      </Section>

      <Section title="OptionButton">
        <div className="flex flex-col gap-2">
          <OptionButton
            optionKey="A"
            text="Prophase"
            selected={selected === 'A'}
            onSelect={setSelected}
          />
          <OptionButton
            optionKey="B"
            text="Anaphase"
            selected={selected === 'B'}
            reveal="correct"
            disabled
            onSelect={() => {}}
          />
          <OptionButton
            optionKey="C"
            text="Interphase"
            selected={selected === 'C'}
            reveal="wrong"
            disabled
            onSelect={() => {}}
          />
          <OptionButton
            optionKey="D"
            text="Cytokinesis"
            selected={selected === 'D'}
            reveal="missed"
            disabled
            onSelect={() => {}}
          />
        </div>
      </Section>

      <Section title="Podium">
        <div className="flex items-end gap-2">
          <PodiumSlot place={2} row={podiumRows[1]} />
          <PodiumSlot place={1} row={podiumRows[0]} />
          <PodiumSlot place={3} row={podiumRows[2]} />
        </div>
      </Section>

      <Section title="Participants">
        <ul className="flex flex-col gap-2">
          <ParticipantRow participant={demoParticipants[0]} isCreator />
          <ParticipantRow participant={demoParticipants[1]} />
        </ul>
      </Section>

      <Section title="MemoCard">
        <MemoCard code="QS-7F3K" address="NQ02 4RCH AXQ1 P50Y 2LJV F9RN 0FCX 4VKM YYQ0" />
      </Section>

      <Section title="EmptyState">
        <EmptyState
          icon={<Icon name="podium" size={28} weight="duotone" />}
          title="No Qests yet"
          description="Be the first — create a Qest from your study material and challenge your group."
          action={<Button size="sm">Create a Qest</Button>}
        />
      </Section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Confirm commitment">
        <p className="text-sm text-ink-soft">
          You're committing 50 NIM to this Qest. Top 3 split the pool.
        </p>
        <div className="mt-4 flex gap-2">
          <Button block onClick={() => setModalOpen(false)}>
            Confirm
          </Button>
          <Button variant="secondary" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </main>
  )
}
