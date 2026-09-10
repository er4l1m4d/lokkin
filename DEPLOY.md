# DEPLOY.md — Nivora Deployment Checklist

Solo-dev safety system. Every deployment follows this file. Every deploy maps to a git commit — rollback is always "redeploy the previous tag".

## Production topology (Phase 8.2)

```
Vercel (frontend SPA)  ──HTTPS──▶  Render (FastAPI, free plan)  ──▶  Neon (Postgres)
                                        │
                                        └──▶  Nimiq RPC node (tx verification, real mode only)
settlement sidecar (runs on the dev PC for now) ──▶ Render API
```

- **Neon** — free Postgres. Copy the **pooled** connection string, append `?sslmode=require`.
- **Render** — blueprint in `render.yaml` (auto-deploys `main` after every push; CI gates the push, Render doesn't wait for CI — only push green commits).
- **Vercel** — frontend, root directory `frontend/`, framework Vite, `vercel.json` handles SPA rewrites.
- **Backend origin must be in CORS:** `CORS_ORIGINS` env on Render = the Vercel URL(s), comma-separated. The backend blocks all other browser origins.

## First deploy runbook (execute top to bottom)

1. **Neon:** create project `lokkin` (region matches Render) → copy pooled `DATABASE_URL`.
2. **Render:** New → Blueprint → select the repo → it reads `render.yaml` → set `DATABASE_URL` (Neon) and `CORS_ORIGINS` (placeholder until Vercel URL exists) → create.
3. **Verify API:** `GET https://lokkin-api.onrender.com/health` → 200 (first boot can take ~1 min on the free plan; `init_db()` creates all tables — `sql/001_initial_schema.sql` is the reference schema, not a required migration).
4. **Vercel:** import repo → root directory `frontend/` → env `VITE_API_URL=https://lokkin-api.onrender.com`, `VITE_USE_MOCK=false` → deploy → note the production URL.
5. **Render:** update `CORS_ORIGINS` with the Vercel URL → service redeploys.
6. **Tag:** `git tag vX.Y.Z && git push origin vX.Y.Z` (matches the commit that's deployed).
7. **Smoke test** (section below) + seed the first quiz (8.5).
8. Point the Nimiq mini app / launch links at the Vercel URL.

## CI runner (self-hosted)

- **Where:** `C:\Users\hp\actions-runner`, registered to `er4l1m4d/lokkin` as `lokkin-pc` (labels: `self-hosted, lokkin-pc, Windows, X64`)
- **Why:** GitHub's hosted runners are blocked for this account (see ERROR.md E-013). The self-hosted runner is the CI gate until that lifts.
- **Auto-start:** NOT automatic yet (scheduled-task creation denied — no admin). Runner must be started per boot/session with the WMI detach (see E-018):
  ```powershell
  Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
    CommandLine = 'cmd /c cd /d C:\Users\hp\actions-runner && run.cmd >> runner-run.log 2>&1' }
  ```
- **Manual start (fallback, dies with the shell session):** run `C:\Users\hp\actions-runner\run.cmd`
- **Manual stop:** kill the Runner process in Task Manager
- **Logs:** `C:\Users\hp\actions-runner\runner-run.log` (listener + job results) + `_diag\` (detailed job logs)
- **If jobs sit queued:** check `gh api repos/er4l1m4d/lokkin/actions/runners --jq '.runners[].status'` — if `offline`, run the WMI start above. If `online` + `busy`, it's working — verify in `runner-run.log` (jobs run one at a time and can show `queued` in the API meanwhile).
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
- [ ] `CORS_ORIGINS` on Render includes the current Vercel URL (frontend → API calls fail without it)

## Deploy

- [ ] Deployment succeeds from `main` (Vercel + Render, auto on push)
- [ ] Tag the release: ` vX.Y.Z ` + note the commit SHA

## After deploy — production smoke test

- [ ] `GET https://lokkin-api.onrender.com/health` → 200, DB connected, app responding
- [ ] Vercel homepage loads (SPA routes deep-linkable, e.g. `/quiz/x` reloads fine)
- [ ] Session works (display name / wallet link)
- [ ] Core Nivora flow works (create → join → play → results)
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
