// Seed the production/dev DB with a launch-night quiz that's OPEN for entries.
// Usage: node scripts/seed.mjs [baseUrl] [--min 3] [--entry 25] [--in-minutes 60]
// Safe to re-run: skips if an OPEN quiz with the same title already exists.
const BASE = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : process.env.SEED_URL ?? 'http://localhost:8000'
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name)
  return i > -1 ? process.argv[i + 1] : fallback
}
const MIN_PLAYERS = Number(arg('--min', 3))
const ENTRY = Number(arg('--entry', 25))
const IN_MINUTES = Number(arg('--in-minutes', 60))
const TITLE = 'Launch Night: General Knowledge Gauntlet'

const api = async (path, init) => {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${JSON.stringify(body)}`)
  return body
}
const log = (...a) => console.log('  ', ...a)

const QUESTIONS = [
  {
    q: 'The hardest natural substance on Earth is ____.',
    options: ['Quartz', 'Diamond', 'Titanium', 'Obsidian'],
    correct: 'B',
    explanation: 'Diamond scores 10 on the Mohs scale — no natural substance scratches it.',
  },
  {
    q: 'Which planet has the most moons confirmed as of 2025?',
    options: ['Jupiter', 'Saturn', 'Neptune', 'Mars'],
    correct: 'B',
    explanation: 'Saturn pulled ahead after the 2023 batch of newly confirmed moons (146+).',
  },
  {
    q: 'The currency of Japan is the ____.',
    options: ['Won', 'Yuan', 'Yen', 'Ringgit'],
    correct: 'C',
    explanation: 'The yen (¥, JPY) has been Japan\u2019s currency since 1871.',
  },
  {
    q: 'In web development, CSS stands for Cascading ____ Sheets.',
    options: ['Color', 'Computed', 'Content', 'Style'],
    correct: 'D',
    explanation: 'Cascading Style Sheets — the "cascade" is how conflicting rules resolve.',
  },
  {
    q: 'The largest organ of the human body is the ____.',
    options: ['Liver', 'Skin', 'Lungs', 'Brain'],
    correct: 'B',
    explanation: 'Skin is the largest organ by area and weight (~15% of body weight).',
  },
  {
    q: 'Which data structure works on First-In-First-Out (FIFO)?',
    options: ['Stack', 'Queue', 'Tree', 'Graph'],
    correct: 'B',
    explanation: 'A queue is FIFO; a stack is LIFO (Last-In-First-Out).',
  },
]

async function main() {
  console.log(`Seeding ${BASE}`)

  const health = await api('/health')
  if (!health.ok) throw new Error('health check failed')
  log('health ok')

  // idempotency: skip if already seeded
  const existing = await api('/api/quizzes')
  if (existing.some((q) => q.title === TITLE && (q.status === 'OPEN' || q.status === 'PUBLISHED'))) {
    log('launch quiz already seeded — nothing to do')
    return
  }

  const host = await api('/api/users', {
    method: 'POST',
    body: JSON.stringify({ displayName: 'Professor L' }),
  })
  log(`host created: ${host.displayName} (${host.id})`)

  const { quizId } = await api('/api/quizzes', {
    method: 'POST',
    body: JSON.stringify({
      creatorId: host.id,
      title: TITLE,
      description: 'Opening night warm-up — 6 quick general-knowledge questions. First room, first pot. Bring a friend.',
      currency: 'NIM',
      entryAmount: ENTRY,
      durationSeconds: 300,
      startsAt: new Date(Date.now() + IN_MINUTES * 60_000).toISOString(),
      minParticipants: MIN_PLAYERS,
    }),
  })
  log(`quiz created: ${quizId}`)

  for (let i = 0; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i]
    await api(`/api/quizzes/${quizId}/questions`, {
      method: 'POST',
      body: JSON.stringify({
        position: i + 1,
        questionText: q.q,
        optionA: q.options[0],
        optionB: q.options[1],
        optionC: q.options[2],
        optionD: q.options[3],
        correctOption: q.correct,
        explanation: q.explanation,
      }),
    })
  }
  log(`${QUESTIONS.length} questions added`)

  await api(`/api/quizzes/${quizId}/publish`, { method: 'POST' })
  await api(`/api/quizzes/${quizId}/open`, { method: 'POST' })
  log('quiz OPEN for entries')

  console.log(`\nSeeded ✔  ${TITLE}`)
  console.log(`Open quiz: ${BASE.replace(':8000', '')} → share the frontend URL with the cohort.`)
  console.log(`Starts in ${IN_MINUTES} min · needs ${MIN_PLAYERS} players · ${ENTRY} NIM entry.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
