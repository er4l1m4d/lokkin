import { describe, expect, it } from 'vitest'
import type { Participant } from './types'
import { computePayouts } from './mock'

function player(
  name: string,
  status: Participant['status'],
  correct: number,
  entry: number,
): Participant {
  return {
    id: `${name}-id`,
    quizId: 'quiz-1',
    userId: `${name}-user`,
    displayName: name,
    status,
    disconnectCount: 0,
    correctAnswers: correct,
    scorePercentage: null,
    rank: null,
    entryAmount: entry,
  }
}

describe('computePayouts', () => {
  it('plain top-3: winners take 50/30/10 of pool, losers 80% back, 10% bonus to completers', () => {
    const players = [
      player('A', 'COMPLETED', 3, 100),
      player('B', 'COMPLETED', 2, 100),
      player('C', 'COMPLETED', 1, 100),
      player('D', 'COMPLETED', 0, 100),
    ]
    const { rows, prizePool } = computePayouts(players, 3)

    // ranks 1,2,3,4
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3, 4])

    // pool = 20% of D's 100 = 20; bonus = 2; allocations of full pool: 10 / 6 / 2
    expect(prizePool).toBeCloseTo(18, 6)
    const a = rows.find((r) => r.displayName === 'A')!
    const b = rows.find((r) => r.displayName === 'B')!
    const c = rows.find((r) => r.displayName === 'C')!
    const d = rows.find((r) => r.displayName === 'D')!

    expect(a.payoutKind).toBe('winner')
    expect(b.payoutKind).toBe('winner')
    expect(c.payoutKind).toBe('winner')
    expect(d.payoutKind).toBe('consolation')

    // bonus 2 / 4 completers = 0.5 each
    expect(a.payout).toBeCloseTo(100 + 10 + 0.5, 6)
    expect(b.payout).toBeCloseTo(100 + 6 + 0.5, 6)
    expect(c.payout).toBeCloseTo(100 + 2 + 0.5, 6)
    expect(d.payout).toBeCloseTo(80 + 0.5, 6)

    // conservation: every NIM staked is paid back out
    const total = rows.reduce((sum, r) => sum + r.payout, 0)
    expect(total).toBeCloseTo(400, 6)
  })

  it('tie at rank 1: competition ranking 1,1,3 and skipped rank-2 allocation flows to bonus', () => {
    const players = [
      player('A', 'COMPLETED', 3, 50),
      player('B', 'COMPLETED', 3, 50),
      player('C', 'COMPLETED', 2, 50),
      player('D', 'COMPLETED', 0, 50),
    ]
    const { rows } = computePayouts(players, 3)

    expect(rows.map((r) => r.rank)).toEqual([1, 1, 3, 4])

    // only D is a loser: pool = 20% of 50 = 10; bonus = 1 + skipped rank2 (3) = 4
    // rank1: A,B split 5 (2.5 each); rank3: C gets 1
    const a = rows.find((r) => r.displayName === 'A')!
    const b = rows.find((r) => r.displayName === 'B')!
    const c = rows.find((r) => r.displayName === 'C')!
    const d = rows.find((r) => r.displayName === 'D')!

    expect(a.payout).toBeCloseTo(50 + 2.5 + 1, 6) // 4 bonus / 4 completers
    expect(b.payout).toBeCloseTo(50 + 2.5 + 1, 6)
    expect(c.payout).toBeCloseTo(50 + 1 + 1, 6)
    expect(d.payout).toBeCloseTo(40 + 1, 6)

    const total = rows.reduce((sum, r) => sum + r.payout, 0)
    expect(total).toBeCloseTo(200, 6)
  })

  it('no-shows get 50% back and contribute 50% to the pool', () => {
    const players = [
      player('A', 'COMPLETED', 2, 100),
      player('B', 'COMPLETED', 1, 100),
      player('C', 'COMPLETED', 0, 100),
      player('NoShow', 'JOINED', 0, 100),
    ]
    const { rows } = computePayouts(players, 2)

    // all three finishers are winners (ranks 1,2,3); only NoShow funds the pool:
    // pool = 50% of 100 = 50; bonus = 5; allocations: A 25, B 15, C 5
    const a = rows.find((r) => r.displayName === 'A')!
    const noShow = rows.find((r) => r.displayName === 'NoShow')!

    expect(a.payout).toBeCloseTo(100 + 25 + 5 / 3, 6)
    expect(noShow.payoutKind).toBe('refund')
    expect(noShow.payout).toBeCloseTo(50, 6) // no bonus: never completed

    const total = rows.reduce((sum, r) => sum + r.payout, 0)
    expect(total).toBeCloseTo(400, 6)
  })

  it('fewer than three finishers: skipped allocations flow to the bonus', () => {
    const players = [
      player('A', 'COMPLETED', 2, 100),
      player('B', 'TIMED_OUT', 0, 100),
    ]
    const { rows } = computePayouts(players, 2)

    // pool = 20% of B = 20; bonus = 2 + rank2 6 + rank3 2 = 10
    // A: rank 1 -> 100 + 10 + 10 (only completer gets full bonus)
    const a = rows.find((r) => r.displayName === 'A')!
    const b = rows.find((r) => r.displayName === 'B')!

    expect(a.payout).toBeCloseTo(120, 6)
    expect(b.payout).toBeCloseTo(80, 6)
    expect(rows.reduce((s, r) => s + r.payout, 0)).toBeCloseTo(200, 6)
  })
})
