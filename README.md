# Lokkin Core MVP

Lokkin — commitment-based competitive study quizzes on Nimiq. Upload your study material, let AI draft the quiz, commit NIM, and compete: top 3 win from the pool, everyone else gets most of their stake back.

This is a monorepo: `frontend/` (React + Vite + TS + Tailwind) and `backend/` (FastAPI + SQLAlchemy async).

## Frontend (dev)

```bash
npm install          # from repo root — installs frontend deps
npm run dev          # vite dev server on http://localhost:5173
```

Set `frontend/.env` with `VITE_USE_MOCK=true` to develop without the backend (in-memory mock with seeded quizzes and the full payout engine). Defaults to the real API at `VITE_API_URL` (fallback `http://localhost:8000`).

Other commands (all from repo root): `npm run lint`, `npm run test`, `npm run build`, `npm run checks` (all three).

## Backend

1. Create PostgreSQL database `lokkin`.
2. Apply `sql/001_initial_schema.sql`.
3. Set `DATABASE_URL`, for example:

```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/lokkin
```

4. Install dependencies and run:

```bash
python -m venv .venv
. .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r backend/requirements.txt
npm run api           # uvicorn on http://localhost:8000
```

## What is included

- PostgreSQL schema covering users, quizzes, materials, questions, participants, answers, sessions, events, flags, disputes, transactions and payouts.
- FastAPI demo API for the first quiz loop.
- Strict quiz state transitions.
- Server-side answer validation.
- Immutable answer/event records at the application layer.
- Competition-ranking unit test.
- Frontend foundation: typed API client, mock layer with the locked payout economics (regression-tested), 12 shared UI components.

## Demo API sequence

```text
POST /api/users
POST /api/quizzes
POST /api/quizzes/{id}/questions   (repeat)
POST /api/quizzes/{id}/publish
POST /api/quizzes/{id}/open
POST /api/quizzes/{id}/demo-start?user_id={user}
POST /api/quizzes/{id}/start
GET  /api/quizzes/{id}/state
POST /api/quizzes/{id}/answers
```

## Important next hardening

- Replace query-string demo identity with proper auth.
- Add real join/commitment flow through Nimiq Pay.
- Add server-side deadline enforcement to `submit_answer`.
- Add reconnect/session endpoints and the 3-strike rule.
- Add score finalization, invalid-question recalculation and disputes.
- Add payout-plan generation and blockchain settlement with idempotency keys.
- Add migrations tooling (Alembic) around the SQL baseline.
