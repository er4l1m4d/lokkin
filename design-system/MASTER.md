# Lokkin Design System

## Product Register

Lokkin is a mobile-first competitive study app. The interface should feel calm while users study, then become visibly more focused during commitment and play. The primary job is to make the next decision obvious: choose a mode, enter a quiz, commit, answer, or understand the result.

## Physical Scene

Students use Lokkin on a phone between lectures, in a library, or in a group chat. Ambient light is variable, attention is limited, and the interface must stay readable and trustworthy when money and rankings are involved.

## Visual Direction

- Soft blue canvas with white surfaces and blue action states.
- Restrained color strategy: blue carries action and navigation; coral/amber communicate urgency; green/red communicate outcomes.
- Calm, structured product UI rather than decorative gamification.
- Rounded surfaces are useful for grouping, but card radius stays compact at `16px`.
- Use elevation sparingly: one soft shadow for surfaces, one lift shadow for primary actions.
- Do not use emoji as structural icons. Use the shared `Icon` component and its single stroke language.

## Tokens

### Color

- `canvas`: page background
- `canvas-deep`: secondary neutral and skeleton background
- `surface`: primary white surface
- `surface-muted`: empty states and loading surfaces
- `primary-dark`: primary button and high-contrast action text
- `primary`: active accents and progress
- `primary-soft` / `primary-faint`: selection and informational surfaces
- `accent`: coral urgency accent
- `amber`: warning and timer accent
- `success` / `danger`: semantic outcome colors, always paired with text or an icon
- `ink`: primary text
- `ink-soft`: body copy
- `ink-muted`: secondary labels, kept contrast-safe
- `line`: dividers and input borders

### Typography

- Body: `Inter`, `16px` minimum for editable mobile fields.
- Headings: `Nunito`, used for hierarchy and personality, not every label.
- Body line-height: `1.5` or greater for prose.
- Headings use balanced wrapping and `-0.02em` tracking.
- Timers and numeric results use tabular figures.

### Shape and Elevation

- Card radius: `1rem`.
- Full pills are reserved for status, filters, compact values, and primary rounded actions.
- `shadow-soft`: resting surface elevation.
- `shadow-tap`: compact list elevation.
- `shadow-lift`: primary CTA / featured surface elevation.

## Layout

- Mobile-first content width: `max-w-2xl` inside the desktop shell.
- Desktop app frame: `max-w-6xl` with a readable centered content column.
- Use a `4 / 8px` spacing rhythm: `gap-2`, `gap-3`, `gap-4`, `gap-5`, `gap-6`.
- Fixed bottom navigation reserves content space through shell padding.
- All fixed controls respect safe-area insets.
- Deep routes keep the same shell and predictable back path.

## Interaction

- Interactive targets are at least `44px` high or wide.
- Every button has visible hover, focus-visible, active, disabled, and loading behavior where applicable.
- Primary screens expose one clear primary CTA.
- Async actions disable themselves and communicate progress.
- Modal dialogs provide a close control, Escape support, focus return, and a trapped Tab cycle.
- Route changes move focus to the main content region.
- Reduced-motion users receive instant or near-instant state changes.

## Components

- `Button`: primary, secondary, danger, and ghost hierarchy.
- `StatusPill`: state vocabulary for quiz lifecycle.
- `TimerPill`: urgency-aware time display with a clock icon.
- `OptionButton`: answer selection and reveal states; never relies on color alone.
- `QuizCard`: title, lifecycle, stake, duration, participant count, and affordance.
- `PodiumSlot`: results hierarchy with a consistent trophy icon.
- `ParticipantRow`: status text plus status dot.
- `EmptyState`: teaches the next action instead of showing a blank surface.
- `Icon`: the only structural icon primitive; keep stroke weight and sizing consistent.

## Accessibility and QA

- Maintain WCAG AA contrast for body copy and controls.
- Preserve visible `:focus-visible` rings; never use `focus:outline-none` without a replacement.
- Use labels for all form controls and `role="alert"` or `role="status"` for dynamic feedback.
- Do not communicate state with color alone; pair it with text, icon, rank, or copy.
- Test at 375px, 768px, and desktop widths, plus reduced-motion mode.
- Keep this file as the source of truth. Page-specific exceptions belong in `design-system/pages/` and must explain why they differ.
