# Nivora Design System — v2 "Highlighter Arena"

## Product Register

Nivora is a commitment-based competitive study platform on Nimiq. Nivora is a realm where knowledge has no value until it is tested — you turn your notes into live Trials, stake NIM on your prep, face your Challengers, and the top 3 split the pot. The interface should feel like studying turned up to competition: ink on paper, a highlighter that marks what matters, and money moments that hit hard.

**Brand line**: Don't just know it. Prove it.
**Philosophy**: Knowledge is only potential until you put it to the test.

## Brand vocabulary

Nivora speaks a shared language across every surface — keep it consistent:

- **Trial** — a quiz challenge (user-facing copy; code identifiers keep `quiz`)
- **Challenger** — a player/participant
- **Standing** — the leaderboard / full ranking
- **Host** — the Trial's creator (code keeps `creator`)
- The lock is the commitment motif: stakes, sealed answers, locked-in states.

## The idea

The brand color *is* the highlighter you mark notes with. Warm paper canvas, near-black ink, one electric yellow spent only where money and moments are — primary actions, active state, key highlights. Type does the shouting; color stays quiet.

## Signature motifs

1. **Highlight swipe** — key words in headlines carry a marker-bar highlight (`.highlight` static, `.highlight-swipe` animated). Used on hero words and milestone moments only — never decoration.
2. **The lock** — Phosphor `lock-key` is the brand glyph. It appears at the wordmark, on commit CTAs, "locked in" confirmations, and sealed states. Commitment vocabulary is literal.
3. **Hard-press** — primary CTAs and cards sit on hard ink offset shadows (`shadow-press`, `shadow-press-sm`, `shadow-card`) and collapse onto your finger on press-in (`.press`).

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
