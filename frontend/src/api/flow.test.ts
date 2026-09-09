import { beforeAll, describe, expect, it } from 'vitest'
import { createMockApi } from './mock'

// Critical flow #1-4 (DEPLOY.md): session -> create quiz -> join -> play -> results correct
describe('mock API: full quiz flow', () => {
  const api = createMockApi()
  let creatorId = ''
  let quizId = ''
  let questionIds: string[] = []
  let participantIds: string[] = []
  let playerUserIds: string[] = []

  beforeAll(async () => {
    const creator = await api.createUser({ displayName: 'Ada' })
    creatorId = creator.id
    const { quizId: qid } = await api.createQuiz({
      creatorId,
      title: 'Pharma Basics',
      description: 'Test flow quiz',
      currency: 'NIM',
      entryAmount: 100,
      durationSeconds: 300,
    })
    quizId = qid
    for (let i = 1; i <= 3; i++) {
      const { questionId } = await api.addQuestion(quizId, {
        position: i,
        questionText: `Question ${i}?`,
        optionA: 'A',
        optionB: 'B',
        optionC: 'C',
        optionD: 'D',
        correctOption: i % 2 === 0 ? 'A' : 'C',
      })
      questionIds.push(questionId)
    }
    await api.publishQuiz(quizId)
    await api.openQuiz(quizId)
  })

  it('lists the quiz as OPEN with question count', async () => {
    const list = await api.listQuizzes()
    const quiz = list.find((q) => q.id === quizId)
    expect(quiz).toBeDefined()
    expect(quiz!.status).toBe('OPEN')
    expect(quiz!.questionCount).toBe(3)
  })

  it('three users join; participant counts reflect it', async () => {
    for (const name of ['Ada', 'Bode', 'Chidi']) {
      const u = await api.createUser({ displayName: name })
      playerUserIds.push(u.id)
      const { participantId } = await api.joinQuiz(quizId, u.id)
      participantIds.push(participantId)
    }
    const participants = await api.getParticipants(quizId)
    expect(participants).toHaveLength(3)
    const quiz = await api.getQuiz(quizId)
    expect(quiz.participantCount).toBe(3)
  })

  it('join is idempotent per user', async () => {
    const u = await api.createUser({ displayName: 'Ada-copy' })
    const first = await api.joinQuiz(quizId, u.id)
    const second = await api.joinQuiz(quizId, u.id)
    expect(first.participantId).toBe(second.participantId)
    participantIds.push(first.participantId)
    const participants = await api.getParticipants(quizId)
    expect(participants).toHaveLength(4)
  })

  it('player questions hide the correct answer', async () => {
    const questions = await api.getQuestions(quizId)
    expect(questions).toHaveLength(3)
    for (const q of questions) {
      expect(q.options).toHaveLength(4)
      expect(Object.keys(q)).not.toContain('correctOption')
    }
  })

  it('full play: answers submit once, scores compute, quiz validates', async () => {
    await api.startQuiz(quizId)
    // correct answers by position parity: C, A, C
    const correctByPos = ['C', 'A', 'C']
    const p1 = participantIds[0]
    for (const q of await api.getQuestions(quizId)) {
      const res = await api.submitAnswer(quizId, {
        participantId: p1,
        questionId: q.id,
        selectedOption: correctByPos[q.position - 1] as 'A' | 'C',
      })
      expect(res.correct).toBe(true)
    }
    // re-answering is rejected
    const qs = await api.getQuestions(quizId)
    await expect(
      api.submitAnswer(quizId, { participantId: p1, questionId: qs[0].id, selectedOption: 'A' }),
    ).rejects.toThrow()

    // remaining players: p2 gets 2 right, p3 gets 1 right, p4 none
    const plans: Array<{ idx: number; correctCount: number }> = [
      { idx: 1, correctCount: 2 },
      { idx: 2, correctCount: 1 },
      { idx: 3, correctCount: 0 },
    ]
    for (const plan of plans) {
      const pid = participantIds[plan.idx]
      for (const q of await api.getQuestions(quizId)) {
        const wantCorrect = q.position <= plan.correctCount
        const picked = wantCorrect
          ? correctByPos[q.position - 1]
          : correctByPos[q.position - 1] === 'A'
            ? 'B'
            : 'D'
        await api.submitAnswer(quizId, {
          participantId: pid,
          questionId: q.id,
          selectedOption: picked as 'A' | 'B' | 'C' | 'D',
        })
      }
    }

    const participants = await api.getParticipants(quizId)
    const me = participants.find((p) => p.id === p1)
    expect(me?.status).toBe('COMPLETED')
    expect(me?.correctAnswers).toBe(3)
    // everyone completed -> mock advances to VALIDATING
    const state = await api.getQuizState(quizId)
    expect(['VALIDATING', 'ENDED', 'FINALIZED', 'SETTLED']).toContain(state.status)
  })

  it('results return ranked rows with conserved payouts', async () => {
    const results = await api.getResults(quizId)
    expect(results.rows.length).toBeGreaterThan(0)
    const totalPaid = results.rows.reduce((s, r) => s + r.payout, 0)
    const totalStaked = 4 * 100 // 4 participants x 100 NIM
    expect(totalPaid).toBeCloseTo(totalStaked, 6)
  })

  it('review reveals correct answers + my answers once validated', async () => {
    const review = await api.getReview(quizId, playerUserIds[0])
    expect(review).toHaveLength(3)
    expect(review[0].myAnswer).toBe('C')
    expect(review[0].wasCorrect).toBe(true)
    expect(review[0].correctOption).toBe('C')
    expect(review[1].correctOption).toBe('A')

    // player 2 got one wrong: that question shows myAnswer != correctOption
    const p2Review = await api.getReview(quizId, playerUserIds[1])
    const missed = p2Review.find((q) => q.wasCorrect === false)
    expect(missed).toBeDefined()
    expect(missed!.myAnswer).not.toBe(missed!.correctOption)
  })

  it('history shows my entry with rank and payout', async () => {
    const history = await api.getMyHistory(playerUserIds[0])
    expect(history).toHaveLength(1)
    const entry = history[0]
    expect(entry.quizId).toBe(quizId)
    expect(entry.rank).toBe(1)
    expect(entry.payoutKind).toBe('winner')
    expect(entry.correctAnswers).toBe(3)
    expect(['VALIDATING', 'FINALIZED', 'SETTLED']).toContain(entry.status)
  })
})
