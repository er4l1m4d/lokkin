# Lokkin Build Plan

**Deadline: Sep 18** · Stack: React+Vite+TS+Tailwind / FastAPI / Nimiq SDK · Payments: `mock` first, `real` later

---

## Process rules

1. **Phase by phase.** Never one-shot the project. One phase at a time → verify (lint, typecheck, build) → tick boxes → **commit & push** → post a phase summary (added / changed / improved).
2. **CI gate.** CI runs on the **self-hosted runner `lokkin-pc`** (the dev PC — GitHub-hosted runners are account-blocked, E-013; setup/ops in DEPLOY.md). Pushes to `main` trigger: frontend lint + typecheck + build, backend install + compile. **CI green as of Phase 0.5.** If the runner is offline, start it with `C:\Users\hp\actions-runner\run.cmd` — queued jobs pick up automatically. Local gates (lint + build before every commit) remain mandatory regardless.
3. **Error discipline.** Every error gets logged in `ERROR.md` with cause + fix. When a new error appears, **scan `ERROR.md` first** — similar signatures often repeat.
4. **Build in slices.** UI for a flow → backend for that flow → test → commit. Integration happens per-flow, not as a big bang at the end.
5. **Deploy via `DEPLOY.md`.** Checklist before/after every deploy; every deploy maps to a git commit (rollback = redeploy previous tag).
6. **Regression rule.** Any bug caught late (CI, deploy, manual test) becomes a test that reproduces it before it's fixed.

---

## Phase 0 — Setup & Scaffolding ✅
**Goal:** Running shell with tooling, before any features.

- [x] **0.1 Scaffold frontend** — Vite + React + TS template; `tailwindcss @tailwindcss/vite react-router-dom` installed; dev server verified on :5173.
- [x] **0.2 Design tokens** — Soft-blue theme in Tailwind v4 `@theme` (canvas `#F4F7FE`, primary `#4A7DFF`, coral/amber accents, green/red feedback, radius 16–24px, Nunito/Inter). Verified with a token test page.
- [x] **0.3 Project structure** — `src/{screens,components,hooks,api,lib,context}` + `@/` path alias (Vite + tsconfig).
- [x] **0.4 Lint + typecheck** — oxlint + `tsc -b` (via `npm run build`) pass clean. *(See E-010 in ERROR.md: bare `tsc --noEmit` is a no-op on solution-style tsconfig — the gate is `npm run build`.)*

## Phase 0.5 — Safety Net (Git + CI + logs)
**Goal:** The solo-dev safety system, day one: version control, CI, error log, deploy checklist.

- [x] **0.5.1 Git repo** — `git init -b main`, root `.gitignore` (deps, dist, env, logs, zip, private planning docs); `git status` clean of junk.- [x] **0.5.2 ERROR.md** — Every error hit so far logged with cause + fix (13 entries; see E-013 for the CI block diagnosis).
- [x] **0.5.3 CI workflow** — `.github/workflows/ci.yml`: frontend (npm ci → lint → build) + backend (pip install → compileall). **Blocked from going green by account-level Actions restriction (E-013) — fix = add payment method to GitHub account, then re-push. Local gates remain mandatory meanwhile.**
- [x] **0.5.4 DEPLOY.md** — Deploy checklist, production smoke tests, rollback procedure, critical-flow list.
- [x] **0.5.5 Commit & push** — Backend baseline + Phase 0 + Phase 0.5 committed and pushed to https://github.com/er4l1m4d/lokkin (public). CI green pending E-013 fix.

## Phase 1 — Foundation (API layer + shared components)
**Goal:** Everything screens are built from, so screen work is assembly only.

- [ ] **1.1 Types** — Mirror backend models in `api/types.ts`: Quiz, Participant, Question, Answer, status enums (`DRAFT…SETTLED`), matching `backend/app/schemas.py`.
- [ ] **1.2 API client** — Typed `api/client.ts` wrapping fetch: users, quizzes (create/list/get/publish/open), demo-start, start, state, answers, flags. Base URL from `VITE_API_URL`.
- [ ] **1.3 Mock mode** — `api/mock.ts` implementing the same interface with in-memory fixtures (quiz list, participants, payout math). Toggle via `VITE_USE_MOCK=true`. Every screen testable without backend.
- [ ] **1.4 Polling hook** — `hooks/usePolling.ts` (interval + pause when hidden) for quiz state since no WebSockets.
- [ ] **1.5 Core components** — `StatusPill`, `TimerPill`, `MeterBar`, `EmptyState`, `Modal`, `StepDots`, `Button` variants. Demo route to eyeball them.
- [ ] **1.6 Quiz components** — `QuizCard` (title, stake, players, countdown), `OptionButton` (idle/selected/correct/wrong states), `PodiumSlot`, `ParticipantRow`, `MemoCard` (code + copy).

## Phase 2 — App Shell & Navigation
**Goal:** Mobile-first frame all screens live in.

- [ ] **2.1 Router + shell** — Routes for all 11 screens; bottom tab bar (Home, Create, Profile) mobile-first; safe-area padding.
- [ ] **2.2 Session context** — `context/SessionContext.tsx`: display name, wallet (null until linked), mode (demo/practice/commitment); persists to localStorage.

## Phase 3 — Core MVP Screens (+ browse/detail/play slice)
**Goal:** The demo-critical path works end-to-end. Slice: browse → detail → play wired to the real backend wherever endpoints exist.

- [ ] **3.1 Welcome** — Logo, tagline "Prove what you know. Commit. Compete. Improve.", 3 mode cards (Demo/Practice/Commitment) with mode explanations, Enter CTA.
- [ ] **3.2 Home/Browse** — Greeting, status filter chips (Open/Live/Validating/Settled), QuizCard list, empty state, FAB → Create.
- [ ] **3.3 Quiz Detail** — Hero, description, source chip, stake, min-3 commitment meter, availability window, participant list, Join CTA → Commitment screen.
- [ ] **3.4 Quiz Play** — Question #N, personal TimerPill (server-synced countdown), progress bar, 4 OptionButtons, one-shot confirm (no going back), disconnect banner (60s window, incidents x/3), auto-advance.
- [ ] **3.5 Submitted/Waiting** — Locked score, "waiting for others" state, polling for quiz completion.
- [ ] **3.6 Backend: public quiz list** — `GET /api/quizzes` (status filter, joinable first, paged); wire Home to it. Test, then commit.

## Phase 4 — Creation & Commitment Flow (+ join slice)
**Goal:** Users can create quizzes and join with stakes (mock payments).

- [ ] **4.1 Create — Upload** — Paste text or PDF upload → send to backend draft endpoint; show parsing state.
- [ ] **4.2 Create — Generate** — AI generation progress screen; handle failure with retry.
- [ ] **4.3 Create — Review** — Editable question cards (edit text/options/answers, delete, reorder), settings (question count, duration, window), Publish CTA → quiz goes OPEN.
- [ ] **4.4 Commitment (mock)** — Amount selector (1–1000 NIM, presets), confirm → mock tx instantly CONFIRMED, memo code `LK-XXXX` card shown for real-mode later.
- [ ] **4.5 Lobby** — Countdown ring, participants grid, commitment meter, "auto-refund if <3 confirmed" warning, creator-blind note.
- [ ] **4.6 Backend: join endpoint** — `POST /api/quizzes/{id}/join` (user + amount → PENDING participant; mock mode auto-confirms tx); wire Commitment + Lobby to it. Test, then commit.

## Phase 5 — Results & Post-Quiz (+ results slice)
**Goal:** Full lifecycle visible: validate → finalize → payout.

- [ ] **5.1 Results** — Podium top 3 (50/30/10 + pool), full ranking rows, payout breakdown per rule (80% back, 20% pool; no-show 50%), tie badges (split allocations), status stepper VALIDATING→FINALIZED→SETTLED with polling.
- [ ] **5.2 Review** — Per-question cards: your answer vs correct, "Why this is missed" explainer (METHOD-style, cream card).
- [ ] **5.3 Profile** — Name, wallet chip, stats (quizzes, wins, NIM won), history list with progress rings + statuses.
- [ ] **5.4 Backend: results + payout plan** — `GET /api/quizzes/{id}/results` (competition ranking 1,1,3; ties split; payout math per locked rules); wire Results to it. Test, then commit.

## Phase 6 — Lifecycle & Timer Authority
**Goal:** Server owns the clock and the state machine; critical flows are regression-protected.

- [ ] **6.1 Full state machine** — ENDED → VALIDATING → FINALIZED → SETTLED transitions + auto-advance (window close, all submitted, dispute window expiry).
- [ ] **6.2 Timer authority** — Server-owned personal timers (start on join, pause on disconnect, 60s window, 3-strike forfeit) driven by `/state` polling.
- [ ] **6.3 Critical-flow e2e suite** — The 5 flows in `DEPLOY.md`, automated (Vitest + API tests); CI runs them on every push.
- [ ] **6.4 3-profile manual run** — create → 3 joins → play → validate → settle → payout math correct. Fix all bugs found.

## Phase 7 — Nimiq Integration (real mode)
**Goal:** Real NIM commitments + payouts for scoring points.

- [ ] **7.1 Mini App SDK** — Install `@nimiq/mini-app-sdk`, `init()`, wallet link, `requestDeviceIdentifier` (anti-cheat device id).
- [ ] **7.2 Real commitment flow** — Join → memo `LK-XXXX` → `sendBasicTransactionWithData(escrow, memo)` → verify tx on-chain → CONFIRMED state.
- [ ] **7.3 Settlement sidecar** — `/settlement` Node service: escrow wallet from env, payout plan executor (top-3 + bonus + refunds), SETTLED transition.
- [ ] **7.4 Feature flag** — `PAYMENTS_MODE=mock|real` end-to-end; both paths testable.

## Phase 8 — Polish & Competition Prep
**Goal:** Ship-ready submission.

- [ ] **8.1 UX polish pass** — Loading/empty/error states everywhere, transitions, copy doc tone ("Prove what you know"), accessibility check.
- [ ] **8.2 Deploy** — Neon → Render → Vercel per `DEPLOY.md` (CI-gated, tagged releases, post-deploy smoke test).
- [ ] **8.3 Repo requirements** — MIT LICENSE, repo public, README (setup + demo sequence), 250-word description.
- [ ] **8.4 Demo video** — Script + record full loop: create → commit → compete → payout.
- [ ] **8.5 Register + first users** — Competition dashboard registration; seed a quiz; WhatsApp push to university cohort for launch night.
