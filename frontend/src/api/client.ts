import type {
  AnswerRequest,
  CreateQuestionRequest,
  CreateQuizRequest,
  CreateUserRequest,
  HistoryEntry,
  LokkinApi,
  Participant,
  ParticipantStatus,
  PlayerQuestion,
  Question,
  Quiz,
  QuizListFilters,
  QuizResults,
  QuizState,
  QuizStatus,
  ReviewQuestion,
} from './types'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const detail = typeof body.detail === 'string' ? body.detail : res.statusText
    throw new ApiError(res.status, detail)
  }
  return res.json() as Promise<T>
}

function questionToPlayer(q: Question): PlayerQuestion {
  return {
    id: q.id,
    position: q.position,
    questionText: q.questionText,
    options: [
      { key: 'A' as const, text: q.optionA },
      { key: 'B' as const, text: q.optionB },
      { key: 'C' as const, text: q.optionC },
      { key: 'D' as const, text: q.optionD },
    ],
  }
}

export function createRealApi(): LokkinApi {
  return {
    async createUser(req: CreateUserRequest) {
      return request<UserJson>('/api/users', {
        method: 'POST',
        body: JSON.stringify(req),
      }).then(toUser)
    },

    async createQuiz(req: CreateQuizRequest) {
      return request<{ quizId: string; status: QuizStatus }>('/api/quizzes', {
        method: 'POST',
        body: JSON.stringify(req),
      })
    },

    async addQuestion(quizId: string, req: CreateQuestionRequest) {
      return request<{ questionId: string; position: number }>(`/api/quizzes/${quizId}/questions`, {
        method: 'POST',
        body: JSON.stringify({
          position: req.position,
          questionText: req.questionText,
          optionA: req.optionA,
          optionB: req.optionB,
          optionC: req.optionC,
          optionD: req.optionD,
          correctOption: req.correctOption,
          // backend ignores extra fields until the Phase 6 slice adds it
          explanation: req.explanation ?? null,
        }),
      })
    },

    async getQuiz(quizId: string) {
      return request<QuizJson>(`/api/quizzes/${quizId}`).then(toQuiz)
    },

    async listQuizzes(filters?: QuizListFilters) {
      const params = filters?.status && filters.status !== 'ALL' ? `?status=${filters.status}` : ''
      const quizzes = await request<QuizJson[]>(`/api/quizzes${params}`)
      return quizzes.map(toQuiz)
    },

    async publishQuiz(quizId: string) {
      return request<{ quizId: string; status: QuizStatus }>(`/api/quizzes/${quizId}/publish`, {
        method: 'POST',
      })
    },

    async openQuiz(quizId: string) {
      return request<{ quizId: string; status: QuizStatus }>(`/api/quizzes/${quizId}/open`, {
        method: 'POST',
      })
    },

    async startQuiz(quizId: string) {
      return request<{ quizId: string; status: QuizStatus; startedAt: string | null }>(
        `/api/quizzes/${quizId}/start`,
        { method: 'POST' },
      )
    },

    async joinQuiz(quizId: string, userId: string) {
      const res = await request<{ participantId: string; status: ParticipantStatus }>(
        `/api/quizzes/${quizId}/demo-start?user_id=${encodeURIComponent(userId)}`,
        { method: 'POST' },
      )
      return res
    },

    async getParticipants(_quizId: string) {
      // Backend endpoint arrives in Phase 3.6 (public quiz list + participants)
      return [] as Participant[]
    },

    async getQuizState(quizId: string) {
      return request<QuizState>(`/api/quizzes/${quizId}/state`)
    },

    async getQuestions(quizId: string) {
      const questions = await request<QuestionJson[]>(`/api/quizzes/${quizId}/questions`)
      return questions.map(toQuestion).map(questionToPlayer)
    },

    async submitAnswer(quizId: string, req: AnswerRequest) {
      return request<{ accepted: boolean; correct: boolean }>(`/api/quizzes/${quizId}/answers`, {
        method: 'POST',
        body: JSON.stringify(req),
      })
    },

    async getResults(quizId: string) {
      return request<QuizResults>(`/api/quizzes/${quizId}/results`)
    },

    async getReview(_quizId: string, _userId: string) {
      // Backend endpoints land in the Phase 6 slices (results + review)
      return [] as ReviewQuestion[]
    },

    async getMyHistory(_userId: string) {
      // Backend endpoint lands in the Phase 6 slice (user history)
      return [] as HistoryEntry[]
    },
  }
}

// ---------- JSON shapes as returned by the backend (camelCase) ----------

interface UserJson {
  id: string
  displayName: string
  walletAddress?: string | null
}

interface QuizJson {
  id: string
  title: string
  description: string | null
  status: QuizStatus
  currency: string
  entryAmount: string
  durationSeconds: number
  questionCount: number
  participantCount: number
  startsAt: string | null
  creatorId?: string
}

interface QuestionJson {
  id: string
  quizId: string
  position: number
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOption: string
  explanation?: string | null
  status: string
}

// ---------- mappers (JSON -> domain) ----------

function toUser(u: UserJson) {
  return { id: u.id, displayName: u.displayName, walletAddress: u.walletAddress ?? null }
}

function toQuiz(q: QuizJson): Quiz {
  return {
    id: q.id,
    title: q.title,
    description: q.description,
    status: q.status,
    currency: 'NIM' as const,
    entryAmount: Number(q.entryAmount),
    durationSeconds: q.durationSeconds,
    questionCount: q.questionCount,
    participantCount: q.participantCount,
    startsAt: q.startsAt,
    creatorId: q.creatorId ?? '',
  }
}

function toQuestion(q: QuestionJson): Question {
  return {
    id: q.id,
    quizId: q.quizId,
    position: q.position,
    questionText: q.questionText,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    correctOption: q.correctOption as Question['correctOption'],
    explanation: q.explanation ?? null,
    status: q.status as Question['status'],
  }
}
