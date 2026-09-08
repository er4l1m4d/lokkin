# DEPLOY.md — Lokkin Deployment Checklist

Solo-dev safety system. Every deployment follows this file. Every deploy maps to a git commit — rollback is always "redeploy the previous tag".

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
