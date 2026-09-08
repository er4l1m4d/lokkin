# Lokkin Core MVP

This is a clean backend baseline for the first Lokkin vertical slice. It is intentionally framework-light and is not claimed to be a patch of an existing Lokkin repository.

## What is included

- PostgreSQL schema covering users, quizzes, materials, questions, participants, answers, sessions, events, flags, disputes, transactions and payouts.
- FastAPI demo API for the first quiz loop.
- Strict quiz state transitions.
- Server-side answer validation.
- Immutable answer/event records at the application layer.
- Competition-ranking unit test.

## Run

1. Create PostgreSQL database `lokkin`.
2. Apply `sql/001_initial_schema.sql`.
3. Set `DATABASE_URL`, for example:

```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/lokkin
```

4. Install dependencies:

```bash
python -m venv .venv
. .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r backend/requirements.txt
```

5. Run:

```bash
uvicorn backend.app.main:app --reload
```

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
