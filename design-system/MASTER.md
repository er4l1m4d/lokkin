# Qestia Design System — v2 "Highlighter Arena"

## Product Register

Qestia is a commitment-based competitive study platform on Nimiq — **where knowing becomes proving**. Qestia is the Threshold between knowledge and proof: you prepare, you stake NIM on your prep, and the moment you enter, the clock applies pressure and the result tells the truth. Top 3 split the pot; showing up still pays. The interface should feel like studying turned up to competition: ink on paper, a highlighter that marks what matters, and money moments that hit hard.

**Brand line**: Qestia — Know it. Prove it.
**Philosophy**: Where knowing becomes proving.
**Product loop**: Learn. Prepare. Challenge. Prove. Rise.

## Brand vocabulary

Qestia speaks a shared language across every surface — keep it consistent:

- **Qestia** — a challenge itself ("Create a Qestia", "Enter Qestia"); code identifiers keep `quiz`
- **Challenger** — a player/participant
- **Standing** — the leaderboard / full ranking
- **Host** — the Qestia's creator in UI ("Keeper" is reserved for lore)
- **The Threshold** — the moment of entry: commitment confirmed, clock started. Reserve "crossing" language for that exact moment (commit confirm, Enter Qestia button)
- The lock stays the commitment motif (stakes, sealed answers, locked-in states); the **Q-portal mark** (volt ring + tail on ink) is the brand symbol

## The idea

The brand color *is* the highlighter you mark notes with. Warm paper canvas, near-black ink, one electric yellow spent only where money and moments are — primary actions, active state, key highlights. Type does the shouting; color stays quiet.

## Signature motifs

1. **Highlight swipe** — key words in headlines carry a marker-bar highlight (`.highlight` static, `.highlight-swipe` animated). Used on hero words and milestone moments only — never decoration.
2. **The Q-portal mark** — a volt ring + tail on ink (the Q as a circular threshold). It is the brand symbol: favicon, wordmark glyph. 
3. **The lock** — Phosphor `lock-key` carries commitment: commit CTAs, "locked in" confirmations, sealed states. Commitment vocabulary is literal, but the lock serves the mechanic, not the wordmark.
4. **Hard-press** — primary CTAs and cards sit on hard ink offset shadows (`shadow-press`, `shadow-press-sm`, `shadow-card`) and collapse onto your finger on press-in (`.press`).

## Tokens

### Color (light-first)

- `paper` — canvas; `paper-deep` — pressed/empty surfaces
- `surface` — white cards
- `ink` / `ink-soft` / `ink-muted` — near-black warm text ramp; `line` — hairlines
- `volt` / `volt-deep` / `volt-faint` — THE accent (actions, active states, money). Text on volt is always `ink`.
- `success` / `danger` — reveal and payout outcomes, always paired with an icon or text
- `amber` — urgency and notes only (timers, host warnings)

Never introduce a second accent hue. If something feels like it needs another color, it needs more `ink` contrast instead.

### Typography

- Display: `Bricolage Grotesque` (variable, optical sizing on) — headlines, buttons, stat numbers, the wordmark. Weights above 800 clamp; size and the volt highlight do the hierarchy work.
- Body: `Onest` — prose, inputs, secondary labels.
- Headings: `-0.02em` tracking, `text-wrap: balance`. Display sizes run large (24–44px mobile) — the type is the loudest tool in the kit.
- Timers, stakes, scores: tabular figures (`tabular-nums`).

### Shape and elevation

- Shape lock: cards `rounded-card` (14px), actions/chips/pills full round. No other radii.
- Cards: `border-2 border-ink bg-surface shadow-card` (interactive/primary) or `border border-line bg-surface` (quiet).
- Inputs: `border-2 border-ink`, `focus:bg-volt-faint`.
- Elevation is hard ink offsets, never blur: `shadow-press` (4px, primary CTA), `shadow-press-sm` (3px), `shadow-card` (2px).

## Layout

- Phone-width column: `max-w-md` centered, `px-5`; desktop shows the same column with hairline frame borders (`sm:border-x`). Desktop-expansion is a later project.
- `4 / 8px` spacing rhythm. Bottom nav is fixed with a 2px ink top border; safe-area insets respected everywhere.
- Milestone motion only: `animate-screen-enter` (route changes), `animate-pop-in` (small elements), `animate-rise` (podium, staged), `animate-swipe` (the marker). All ≤500ms, all killed by `prefers-reduced-motion`.

## Interaction

- Buttons: `font-display` bold, pills; primary is volt with the hard press. One primary CTA per view.
- Answer options flip volt on select, green/red on reveal — never color alone (letter badge + icon).
- Focus: 3px ink outline, offset 3px. Targets ≥44px. Status never communicated by color alone.

## Components

`Button` (primary/secondary/danger/ghost) · `StatusPill` (LIVE = ink on volt-inverse) · `TimerPill` · `OptionButton` · `QuizCard` · `PodiumSlot` (1st volt, 2nd ink, 3rd paper-deep; staggered rise) · `ParticipantRow` · `MeterBar` (ink-bordered volt fill) · `EmptyState` (volt icon box) · `Modal` (ink border, press shadow) · `MemoCard` (ink card, volt code) · `StepDots` · `Icon` (Phosphor — one family, no mixing).

## Accessibility and QA

- WCAG AA contrast for body copy and controls; volt is a background, never body text on paper.
- Preserve `:focus-visible` rings; never `outline-none` without a replacement.
- Reduced motion collapses swipe/rise to instant states.
- Test at 375px minimum; the app is phone-first.
- Keep this file as the source of truth. Page-specific exceptions must explain why they differ.
