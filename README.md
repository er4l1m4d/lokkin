# Qestia

**Know it. Prove it.**

Qestia is a commitment-based competitive study platform on [Nimiq](https://nimiq.com) — where knowing becomes proving. Upload your study material, let AI draft the Qestia, put NIM on the line, and compete live against your classmates. Top 3 split the pot (50/30/10), everyone else gets 80% back — so showing up and finishing is almost always better than not. If the room doesn't fill, everyone is auto-refunded in full.

This is a monorepo:

- `frontend/` — React + Vite + TypeScript + Tailwind v4 (mobile-first, Nimiq Mini App SDK)
- `backend/` — FastAPI + SQLAlchemy async (SQLite dev / Postgres prod), owns the clock and the state machine
- `settlement/` — Node sidecar that pays out from the escrow wallet via `@nimiq/core`
- `sql/` — production Postgres schema baseline

## How it works

1. **Create** — paste study notes; the generator drafts cloze-style questions (AI upgrade path behind the same interface). Review, set stake/duration/start time, publish.
2. **Commit** — Challengers lock in the stake in NIM. Mock mode instant-confirms; real mode issues a unique `QS-XXXX` memo, the Nimiq Pay wallet sends a feeless escrow transaction with the memo, and the backend verifies it on-chain (recipient, value, memo, sender).
3. **Compete** — when quorum (min 3) is met the Qestia goes LIVE at start time. One answer per question, server-clock deadline, sealed answers until validation.
4. **Payout** — after a dispute window the quiz finalizes: competition ranking (ties share a rank's cut), 10% completion bonus, no-shows forfeit 50% to the pool. The settlement sidecar pays the escrow out on-chain and settles.

## Quickstart (frontend, mock mode — no backend needed)

```bash
npm install          # from repo root — installs frontend deps
npm run dev          # vite dev server on http://localhost:5173
```

Set `frontend/.env`:

```
VITE_USE_MOCK=true
```

The mock layer is a full in-memory implementation: seeded quizzes, the real state machine, and the locked payout economics (regression-tested for money conservation).

## Quickstart (backend)

```bash
python -m venv .venv
.venv\Scripts\activate            # Windows (bash: source .venv/bin/activate)
pip install -r backend/requirements.txt -r backend/requirements-dev.txt
npm run api                       # uvicorn on http://localhost:8000
```

Dev runs on zero-setup SQLite (`./qestia.db` at the repo root); production sets `DATABASE_URL` to Postgres and applies `sql/001_initial_schema.sql`.

Frontend against the real backend — set `frontend/.env`:

```
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:8000
```

Backend env knobs:

| Variable | Default | Purpose |
|---|---|---|
| `PAYMENTS_MODE` | `mock` | `mock` instant-confirms commitments; `real` verifies on-chain |
| `DISPUTE_WINDOW_SECONDS` | `300` | VALIDATING window before finalize (lower it for demos) |
| `ESCROW_ADDRESS` | — | escrow wallet address (real mode) |
| `NIMIQ_RPC_URL` | — | Nimiq JSON-RPC node for tx verification (real mode) |
| `SETTLEMENT_TOKEN` | — | shared secret between backend and settlement sidecar |

## Demo sequence (judges / smoke test)

```bash
# terminal 1
npm run api
# terminal 2
npm run dev
# terminal 3 — end-to-end smoke: 3 users create, commit, play, settle
node scripts/e2e-smoke.mjs
```

UI walkthrough (mock mode): Welcome → pick Demo → Home → **Create Qestia** → paste any text → Generate → Publish → open a second browser window, join as another challenger ×2 → quorum met → Qestia goes LIVE → answer questions → submitted screen → results (podium, Standing, status stepper) → review with explanations → profile history. The whole loop also runs headless: `python -m pytest backend/tests -q` (14 tests incl. real-mode with a fake chain) and `npm run test` (18 frontend tests).

## Real payments mode (Nimiq)

```bash
# 1. escrow wallet (once)
cd settlement && npm install && npm run new-key   # prints address + private key

# 2. backend env
PAYMENTS_MODE=real
ESCROW_ADDRESS=NQ.. (from step 1)
NIMIQ_RPC_URL=https://your-nimiq-node/rpc
SETTLEMENT_TOKEN=<shared secret>

# 3. settlement sidecar env
ESCROW_PRIVATE_KEY=<from step 1>
API_URL=http://localhost:8000
SETTLEMENT_TOKEN=<same as backend>
NIMIQ_RPC_URL=<same as backend>
DRY_RUN=false

# 4. fund the escrow address with NIM, then
cd settlement && npm start
```

`DRY_RUN=true` exercises the full settle loop without a node or funds. Mock mode remains the default and needs none of this. Mini-app wiring: the frontend uses `@nimiq/mini-app-sdk` (wallet link, feeless `sendBasicTransactionWithData`, device identifier for anti-cheat).

## Commands (all from repo root)

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server (:5173) |
| `npm run api` | Uvicorn API (:8000) |
| `npm run lint` | oxlint (frontend) |
| `npm run test` | vitest (frontend) |
| `npm run build` | `tsc -b` typecheck + production build |
| `npm run checks` | all three frontend gates |

## Architecture notes

- **Server owns the clock and the lifecycle**: `DRAFT → PUBLISHED → OPEN → LIVE → ENDED → VALIDATING → FINALIZED → SETTLED` (auto-cancel → refund path under quorum). One transition per poll so status steppers walk visibly.
- **Money conservation is asserted in tests** — mock payouts, backend payouts, and the e2e smoke all verify total distributed == total staked.
- **Sealed answers**: correct answers never reach the client before validation (`/questions` masks them; review endpoint is 409-gated until the dispute window).
- Deployment, CI (self-hosted runner), and rollback live in [`DEPLOY.md`](DEPLOY.md); the build history in [`BUILD_PLAN.md`](BUILD_PLAN.md); every debugging scar in [`ERROR.md`](ERROR.md).

## License

[MIT](LICENSE)
