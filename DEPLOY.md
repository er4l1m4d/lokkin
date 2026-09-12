# DEPLOY.md — Qestia Deployment Checklist

Solo-dev safety system. Every deployment follows this file. Every deploy maps to a git commit — rollback is always "redeploy the previous tag".

## Production topology (Phase 8.2 — single Vercel project)

One Vercel project serves BOTH the Vite frontend and the FastAPI backend
(Python serverless function). Same origin → no CORS for the browser, one deploy.

```
Vercel (project root)                       Neon (Postgres)
  frontend/  → static SPA  (output: frontend/dist)
  api/index.py → Python serverless fn  ──▶  │
        │                                   └─ Nimiq RPC node (real mode only)
        └── /api/* routed to the function
settlement sidecar (runs on dev PC for now) ──▶ https://<project>.vercel.app/api/settlement/*
```

- **Neon** — free Postgres. Copy the **pooled** connection string (port `6543`, ends `-pooler.neon.tech`) and use it as `DATABASE_URL`. The pooled endpoint survives serverless connection churn and respects the free-tier connection limit. `db.py` already strips `?sslmode=` and disables asyncpg's prepared-statement cache (required for pgBouncer transaction pooling).
- **Vercel project** — import the repo, set **Root Directory = repository root**. `vercel.json` (repo root) sets the frontend build (`frontend/dist` output) and routes `/api/*` to `api/index.py` (a Mangum-wrapped FastAPI app), with `maxDuration: 10`. No `render.yaml` anymore.
- **Same-origin calls:** the frontend sets `VITE_API_URL` to empty/relative so it calls `/api/*` on its own domain — no CORS needed for browser traffic. `CORS_ORIGINS` is still configured (harmless) for any cross-origin tooling.
- **Serverless limits (Hobby):** 10s function timeout, 100K invocations/mo, 100 GB-hrs, 100 GB bandwidth. The `list_quizzes` `maybe_advance` loop was refactored to batch all participant loads into one query, so a cold `GET /api/quizzes` with many live quizzes stays well inside the timeout.

## First deploy runbook (execute top to bottom)

1. **Neon:** create project `qestia` (region e.g. `aws-eu-central-1` to match the cohort) → copy the **pooled** `DATABASE_URL`.
2. **Vercel:** New Project → import repo → **Root Directory: repository root** → deploy. Set env vars (dashboard, all required):
   - `DATABASE_URL` = Neon pooled connection string
   - `PYTHON_VERSION` = `3.12`
   - `PAYMENTS_MODE` = `mock` (flip to `real` only after the real-payments checklist)
   - `DISPUTE_WINDOW_SECONDS` = `300`
   - `CORS_ORIGINS` = `http://localhost:5173` (placeholder; same-origin in prod so rarely hit)
   - `ESCROW_ADDRESS`, `NIMIQ_RPC_URL` (real mode), `SETTLEMENT_TOKEN` (generate a random secret)
   - Frontend env: `VITE_API_URL=` (empty → same-origin `/api`), `VITE_USE_MOCK=false`
3. **Verify API:** `GET https://<project>.vercel.app/api/health` → 200 (cold start may take a few seconds while Neon wakes and `init_db()` creates tables — `sql/001_initial_schema.sql` is the reference schema, not a required migration).
4. **Verify frontend:** homepage loads; SPA routes deep-linkable (e.g. `/quiz/x` reloads).
5. **Tag:** `git tag vX.Y.Z && git push origin vX.Y.Z` (matches the commit that's deployed).
6. **Smoke test** (section below) + seed the first quiz (8.5).
7. Point the Nimiq mini app / launch links at the Vercel URL.

## CI runner (self-hosted)

- **Where:** `C:\Users\hp\actions-runner`, registered to `er4l1m4d/qestia` as `qestia-pc` (labels: `self-hosted, qestia-pc, Windows, X64`)
- **Why:** GitHub's hosted runners are blocked for this account (see ERROR.md E-013). The self-hosted runner is the CI gate until that lifts.
- **Auto-start:** NOT automatic yet (scheduled-task creation denied — no admin). Runner must be started per boot/session with the WMI detach (see E-018):
  ```powershell
  Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
    CommandLine = 'cmd /c cd /d C:\Users\hp\actions-runner && run.cmd >> runner-run.log 2>&1' }
  ```
- **Manual start (fallback, dies with the shell session):** run `C:\Users\hp\actions-runner\run.cmd`
- **Manual stop:** kill the Runner process in Task Manager
- **Logs:** `C:\Users\hp\actions-runner\runner-run.log` (listener + job results) + `_diag\` (detailed job logs)
- **If jobs sit queued:** check `gh api repos/er4l1m4d/qestia/actions/runners --jq '.runners[].status'` — if `offline`, run the WMI start above. If `online` + `busy`, it's working — verify in `runner-run.log` (jobs run one at a time and can show `queued` in the API meanwhile).
- **SECURITY (public repo):** the workflow must NEVER run on `pull_request` — fork PRs would execute untrusted code on this PC. Push to `main` and `workflow_dispatch` only. If the restriction (E-013) lifts and we move back to hosted runners, re-adding `pull_request` is safe.
- **Upgrading to hosted runners later:** change `runs-on:` back to `ubuntu-latest`, remove the runner (`.\config.cmd remove --token <token>`), delete the Startup .bat.

## Real-payments mode activation (Nimiq)

- [ ] `cd settlement && npm i && npm run new-key` — generated escrow keypair, private key stored securely
- [ ] Backend env: `PAYMENTS_MODE=real`, `ESCROW_ADDRESS`, `NIMIQ_RPC_URL` (Nimiq JSON-RPC node), `SETTLEMENT_TOKEN`
- [ ] Sidecar env: `ESCROW_PRIVATE_KEY`, `API_URL`, `SETTLEMENT_TOKEN`, `NIMIQ_RPC_URL`, `DRY_RUN=false`
- [ ] Escrow address funded with enough NIM for expected payouts
- [ ] Mini app served over HTTPS and reachable in Nimiq Pay (`nimiqpay://miniapp?url=...` or `https://nimpay.app/miniapps/open/...`)
- [ ] One real commitment verified end-to-end (memo visible in wallet tx, participant JOINED)
- [ ] One real payout received by a test wallet (sidecar log shows the tx hash)
- [ ] RPC method-name caveat checked: backend/sidecar try positional then named JSON-RPC params; if the node rejects, adjust `rpc()` in `settlement/index.mjs` and `RpcChainClient` in `backend/app/chain.py`
- [ ] Wallet link + device identifier tested from inside Nimiq Pay

## Workflow (per feature slice)

```
build feature → local checks → push → CI (lint/typecheck/test/build)
  → CI green → deploy → production smoke test → done
  → CI red or smoke fail → fix locally → regression test → redeploy
```

## Before deploy

- [ ] `npm run lint` passes (frontend)
- [ ] `npm run build` passes (= `tsc -b` typecheck + vite build)
- [ ] `npm run test` + `python -m pytest backend/tests -q` pass
- [ ] No debug code / console.log / dev-server.log accidentally left in
- [ ] DB changes reviewed (schema/migration checked against `sql/`)
- [ ] Frontend `VITE_API_URL` is empty (same-origin) or the correct API origin

## Deploy

- [ ] Deployment succeeds from `main` (single Vercel project, frontend + API, auto on push)
- [ ] Tag the release: ` vX.Y.Z ` + note the commit SHA

## After deploy — production smoke test

- [ ] `GET https://<project>.vercel.app/api/health` → 200, DB connected, app responding
- [ ] Vercel homepage loads (SPA routes deep-linkable, e.g. `/quiz/x` reloads fine)
- [ ] Session works (display name / wallet link)
- [ ] Core Qestia flow works (create → join → play → results)
- [ ] Data write + read round-trips (create a quiz, reload, still there)
- [ ] No CORS errors in the browser console
- [ ] No errors in logs (Render/Vercel dashboards)

## If anything fails

- [ ] Rollback: redeploy previous release tag
- [ ] Reproduce locally
- [ ] **Add a regression test** (bug → test that reproduces it → fix → redeploy)
- [ ] Log the error in `ERROR.md`

## Critical flows (regression suite — protect these)

1. User can create a session (display name)
2. User can create a quiz
3. User can join and play a quiz
4. Results / state are correctly recorded (ranking + payout math)
5. Important data persists after refresh
