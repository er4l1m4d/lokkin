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

## Phase 1 — Foundation (API layer + shared components) ✅
**Goal:** Everything screens are built from, so screen work is assembly only.

- [x] **1.1 Types** — `api/types.ts`: Quiz, Participant, Question, Answer, User, all status enums, request/response shapes, `LokkinApi` interface, `VALID_QUIZ_TRANSITIONS` mirroring `services.py`, `QUIZ_LIFECYCLE` for the status stepper.
- [x] **1.2 API client** — `api/client.ts`: typed fetch wrapper for all existing endpoints (users, quizzes CRUD, publish/open/start, demo-start, state, answers) + JSON→domain mappers; `ApiError`. Base URL from `VITE_API_URL`.
- [x] **1.3 Mock mode** — `api/mock.ts`: full in-memory implementation (seeded quizzes, state machine, one-answer enforcement, auto-lifecycle advance) + `computePayouts` implementing the locked economics (50/30/10, 80/20, no-show 50/50, 10% completion bonus, ties split, skipped allocations → bonus). Toggle: `VITE_USE_MOCK=true`.
- [x] **1.4 Polling hook** — `hooks/usePolling.ts`: interval + pause-when-hidden + error swallowing.
- [x] **1.5 Core components** — Button (4 variants × 3 sizes), StatusPill (11 statuses), TimerPill (countdown, warn state), MeterBar (target marker), EmptyState, Modal, StepDots. Component gallery route in App.tsx to eyeball them all.
- [x] **1.6 Quiz components** — QuizCard, OptionButton (idle/selected/correct/wrong/missed), PodiumSlot (2-1-3 order, medals, heights), ParticipantRow (status dots), MemoCard (code + escrow address, copy buttons).
- [x] **1.7 (added) Payout regression tests** — `payouts.test.ts` (vitest): 4 scenarios incl. tie competition ranking (1,1,3) and no-shows, every case asserts money conservation (E-017). `npm test` added to gates + CI.

## Phase 2 — App Shell & Navigation ✅
**Goal:** Mobile-first frame all screens live in.

- [x] **2.1 Router + shell** — BrowserRouter, all 11 routes + session gates (`RequireSession` / `RedirectIfSession`); `AppShell` (max-w-md, safe areas); `BottomNav` (Home/Create/Profile, active pill); `vercel.json` SPA rewrites; dev-only `/dev/gallery` for components.
- [x] **2.2 Session context** — `SessionProvider` with lazy localStorage init (no restore flicker), `signIn`/`setMode`/`signOut`, display name + mode persisted.

## Phase 3 — Core MVP Screens (+ browse/detail/play slice) ✅ (3.6 backend pending)
**Goal:** The demo-critical path works end-to-end. Slice: browse → detail → play wired to the real backend wherever endpoints exist.

- [x] **3.1 Welcome** — Logo, tagline, 3 mode cards (Demo/Practice/Commitment), display-name input, Enter CTA; session created via mock/real API.
- [x] **3.2 Home/Browse** — Greeting + mode banner, status filter chips (All/Open/Live/Validating/Settled), sorted QuizCard list (joinable first, soonest start), skeleton loading, empty + error states, polling 6s.
- [x] **3.3 Quiz Detail** — Hero card (stake/questions/duration stats), starts-in countdown, pot preview + min-3 MeterBar, player chips, creator-blind note, sticky CTA (Commit / Go to lobby / See results by status).
- [x] **3.4 Quiz Play** — Idempotent join → auto-start → questions one at a time; server-clock TimerPill, progress bar, OptionButtons with reveal states (correct/wrong/missed), one-shot lock-in with double-submit guard, auto-advance, finish screen; play session persisted in sessionStorage (survives refresh mid-quiz).
- [x] **3.5 Submitted/Waiting** — Sealed-answers state with room status polling; button to results when validation starts.
- [x] **3.7 (added) Mock flow integration tests** — `flow.test.ts`: 6 tests covering the DEPLOY.md critical flows on the mock layer (create → join x4 → idempotent join → hidden correct answers → one-answer enforcement → auto-VALIDATING → conserved payouts). 10/10 tests total.
- [ ] **3.6 Backend: public quiz list** — `GET /api/quizzes` (status filter, joinable first, paged); wire Home to it. Test, then commit.

## Phase 4 — Creation & Commitment Flow (+ join slice) ✅ (4.6 backend pending)
**Goal:** Users can create quizzes and join with stakes (mock payments).

- [x] **4.1 Create — Upload** — Title/description inputs, file upload (.txt/.md via FileReader; PDF politely deferred to the AI backend), paste area with char count, settings choosers (questions 5–20, duration 1–15 min, stake presets, start delay 15/30/60 min).
- [x] **4.2 Create — Generate** — Staged progress (Reading → Drafting → Polishing) with `lib/generator.ts`: cloze-style mock AI from pasted material (unique answer words, distractor pool, explanations). Real Gemini swaps in at Phase 6 behind the same interface. Failure path with retry.
- [x] **4.3 Create — Review** — Editable question cards (text, 4 options, correct-key selector, explanation), reorder/delete/add, blank-draft templates; publish = createQuiz → addQuestion×N → publish → open → navigate to detail.
- [x] **4.4 Commitment (mock)** — Stake summary + payout rules recap, confirming spinner, instant-CONFIRMED mock tx → join → MemoCard with `LK-XXXX` code + escrow address → lobby CTA.
- [x] **4.5 Lobby** — SVG countdown ring to `startsAt`, quorum MeterBar (min 3) with success/warning states, participants list (host badge, creator-plays-blind note), auto-detects LIVE → "Enter the quiz", closed rooms → results link.
- [x] **4.7 (added) Generator tests** — `generator.test.ts`: 6 tests (count, cloze shape, unique options/answers, thin-material rejection, blank draft, memo format).
- [ ] **4.6 Backend: join endpoint** — `POST /api/quizzes/{id}/join` (user + amount → PENDING participant; mock mode auto-confirms tx); wire Commitment + Lobby to it. Test, then commit.

## Phase 5 — Results & Post-Quiz (+ results slice) ✅ (5.4 backend pending)
**Goal:** Full lifecycle visible: validate → finalize → payout.

- [x] **5.1 Results** — Personal result banner (rank, score, NIM back/won/lost), podium top 3 with pool split note, full ranking rows (medals, correct counts, tie badges, payout + kind labels, "you" highlight), status stepper VALIDATING→FINALIZED→SETTLED with 5s polling; waiting state while LIVE. Mock auto-advances the lifecycle (~15s per stage) to demo the dispute window.
- [x] **5.2 Review** — Per-question cards: options with reveal states (correct ✓, your wrong pick ✗, missed dimmed), "You picked B — the answer was A" line, METHOD-style cream "Why" explanation card; sealed-until-validated gate; summary header with score + %.
- [x] **5.3 Profile** — Avatar + name + wallet chip, stat cards (quizzes / podiums / net NIM), mode switcher (demo/practice/commitment) with explanations, history list (title, score, medal/#rank, net NIM colored, status pill) linking to results, sign-out.
- [x] **5.5 (added) Review + history tests** — flow.test.ts extended to 8 tests: review reveals correct answers + player answers (with a missed-question case), history returns rank/payout/entry. API: `getReview` + `getMyHistory` in interface (mock real, client stubs until Phase 6).
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
