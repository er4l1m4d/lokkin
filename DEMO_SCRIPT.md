# Qestia — Demo Video Script

**Length:** ~2:30 · **Format:** screen recording (OBS/Windows Game Bar), phone-width viewport, mic voiceover
**Setup before recording:**
- `npm run api` + `npm run dev` with `VITE_USE_MOCK=true` (instant confirms, no wallet prompts)
- Browser devtools → mobile viewport (390×844), 100% zoom
- Two browser windows side-by-side for the multiplayer moment (Window A = host, Window B = player)
- `DISPUTE_WINDOW_SECONDS=15` on the API for a fast VALIDATING→SETTLED walk
- Fresh `backend/qestia.db` (delete file, restart API) — seeded state only
- Close Slack/notifications; do one dry run

---

## Shot list

### 0:00–0:15 — Hook (Welcome screen, Window A)
**VO:** "Studying for an exam shouldn't end with a quiz nobody finishes. Qestia puts skin in the game."
- Show welcome screen: "Qestia — Know it. Prove it."
- Type name "Ada", select **Commitment** mode, press Enter.

### 0:15–0:45 — Create (host)
**VO:** "Paste your study notes. Qestia drafts the Qest — you never see the questions, so you play blind like everyone else."
- Home → **Create a Qest** → paste a chunk of notes (have them ready on clipboard)
- Settings: 5 questions · 3 min · 10 NIM · starts now
- **Generate questions** → progress stages → review screen, tap through one question to show editing
- **Publish** → lands on quiz detail

### 0:45–1:10 — Commit (both windows)
**VO:** "Now the commitment. Each player locks in the stake — in demo mode it's instant, in production it's a real feeless NIM transaction to escrow, verified on-chain with a personal memo code."
- Window A: quiz detail → **Commit 10 NIM** → "You're in" → **Go to the lobby**
- Window B (new identity, same quiz): commit → lobby
- **Lobby shot:** countdown ring, quorum meter filling, both players in the room
- Bring in player 3 the same way (third window or pre-seeded)

### 1:10–1:35 — Compete (Window A, then B briefly)
**VO:** "Quorum met — the room goes live. One answer per question. The clock is the server's, not yours. Wrong answers and no-shows feed the pool; finishing pays a bonus."
- Lobby auto-detects LIVE → **Enter Qest**
- Answer 2–3 questions fast; show a correct reveal and a wrong reveal
- Let the timer visibly run; finish

### 1:35–2:00 — Results (Window A)
**VO:** "When everyone's done, answers unseal. Ties share a rank's cut, and every payout is money-conserving — the pot always adds up."
- Submitted screen → results appear (polling walks the stepper VALIDATING → FINALIZED → SETTLED)
- **Podium shot**, personal result card ("You finished 1st — 12.50 NIM back"), full ranking with tie badges

### 2:00–2:20 — Review + real-mode note (Window A)
**VO:** "Every question gets a review with explanations — that's the studying part. And this isn't a simulation: in real mode the escrow wallet pays winners on-chain, automatically."
- Open review: reveal states + the cream "Why" card
- Profile: history rows with net NIM
- (Optional cutaway: CommitScreen memo code + escrow address, or the sidecar log showing a payout hash)

### 2:20–2:30 — Outro (Welcome screen)
**VO:** "Qestia. Know it. Prove it."
- Logo + tagline card. End.

---

## Recording checklist
- [ ] Mic level checked, quiet room
- [ ] Phone viewport + browser chrome hidden
- [ ] Fresh DB, dispute window short, clipboard has study notes
- [ ] One smooth dry run before the real take
- [ ] 1080p export, normalize audio, upload + add captions

## Fallback if live walk stalls
- If quorum is slow, seed extra players via `scripts/e2e-smoke.mjs` before recording that shot
- If a poll takes long, edit a hard cut — polling gaps read worse than cuts
