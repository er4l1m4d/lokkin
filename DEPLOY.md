# DEPLOY.md — Lokkin Deployment Checklist

Solo-dev safety system. Every deployment follows this file. Every deploy maps to a git commit — rollback is always "redeploy the previous tag".

## Workflow (per feature slice)

```
build feature → local checks → push → CI (lint/typecheck/test/build)
  → CI green → deploy → production smoke test → done
  → CI red or smoke fail → fix locally → regression test → redeploy
```

## Before deploy

- [ ] `npm run lint` passes (frontend)
- [ ] `npm run build` passes (= `tsc -b` typecheck + vite build)
- [ ] Critical-flow tests pass
- [ ] No debug code / console.log / dev-server.log accidentally left in
- [ ] DB changes reviewed (schema/migration checked against `sql/`)

## Deploy

- [ ] Deployment succeeds from `main` (Vercel/Render, auto on green CI)
- [ ] Tag the release: ` vX.Y.Z ` + note the commit SHA

## After deploy — production smoke test

- [ ] `GET /api/health` → 200, DB connected, app responding
- [ ] Homepage loads
- [ ] Session works (display name / wallet link)
- [ ] Core Lokkin flow works (create → join → play → results)
- [ ] Data write + read round-trips
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
