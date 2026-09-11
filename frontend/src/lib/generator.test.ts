import { describe, expect, it } from 'vitest'
import { blankDraft, canGenerate, generateDraftQuestions, generateMemoCode } from './generator'

const MATERIAL = `
The mitochondrion is the site of ATP synthesis in eukaryotic cells.
During anaphase, sister chromatids are pulled toward opposite poles of the cell.
The Golgi apparatus packages proteins for secretion outside the cell.
Photosynthesis converts carbon dioxide and water into glucose using sunlight.
Osmosis is the movement of water across a semipermeable membrane.
Enzymes lower the activation energy of biochemical reactions.
`

describe('generator', () => {
  it('generates the requested number of questions from rich material', () => {
    const drafts = generateDraftQuestions(MATERIAL, 5)
    expect(drafts.length).toBe(5)
  })

  it('produces cloze questions with 4 unique options and a valid correct key', () => {
    const drafts = generateDraftQuestions(MATERIAL, 5)
    for (const d of drafts) {
      expect(d.questionText).toMatch(/______/)
      expect(d.options).toHaveLength(4)
      const texts = d.options.map((o) => o.text)
      expect(new Set(texts).size).toBe(4)
      const correct = d.options.find((o) => o.key === d.correctOption)
      expect(correct).toBeDefined()
      expect(correct!.text.length).toBeGreaterThanOrEqual(6)
      expect(d.explanation).toBeTruthy()
    }
  })

  it('never uses the same answer word twice', () => {
    const drafts = generateDraftQuestions(MATERIAL, 6)
    const answers = drafts.map((d) => d.options.find((o) => o.key === d.correctOption)!.text.toLowerCase())
    expect(new Set(answers).size).toBe(answers.length)
  })

  it('rejects thin material via canGenerate', () => {
    expect(canGenerate('too short')).toBe(false)
    expect(canGenerate(MATERIAL)).toBe(true)
  })

  it('blankDraft has empty fields and A as default correct', () => {
    const d = blankDraft()
    expect(d.questionText).toBe('')
    expect(d.options.map((o) => o.key)).toEqual(['A', 'B', 'C', 'D'])
    expect(d.correctOption).toBe('A')
  })

  it('memo codes match QS-XXXX', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateMemoCode()).toMatch(/^QS-[A-Z2-9]{4}$/)
    }
  })
})
