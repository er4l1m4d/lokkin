# ERROR.md — Error Log

Running log of every error hit while building Lokkin, with cause and fix.
**Before debugging any new error, scan this file first** — similar signatures often repeat (especially PowerShell and npm quirks on this machine).

When you hit a new error: fix it, then append an entry (phase, error, cause, fix).

---

## Shell & PowerShell (Windows 5.1)

### E-001 — `&&` chaining fails
- **When:** Pre-work (env var checks); recurs often
- **Error:** `The token '&&' is not a valid statement separator`
- **Cause:** PowerShell 5.1 predates `&&` / `||` (added in PowerShell 7).
- **Fix:** Use `;` for unconditional sequence, `cmd1; if ($?) { cmd2 }` for dependent chains.

### E-002 — `head` not recognized
- **Error:** `head : The term 'head' is not recognized`
- **Cause:** Unix command; doesn't exist in PowerShell.
- **Fix:** `Select-Object -First N`, or do text/JSON processing in Node instead.

### E-003 — `curl -H "Header: value"` binding error
- **Error:** `Cannot bind parameter 'Headers'. Cannot convert the "Authorization: ..." value ... to System.Collections.IDictionary`
- **Cause:** In PowerShell 5.1, `curl` is an alias for `Invoke-WebRequest`; `-H` is not its syntax.
- **Fix:** `Invoke-RestMethod -Headers @{ "Authorization" = "Bearer ..." }` — or better, see E-004.

### E-004 — Invoke-RestMethod throws System.Web assembly error
- **Error:** `Could not load file or assembly 'System.Web, Version=4.0.0.0'`
- **Cause:** PS 5.1's Invoke-RestMethod hits a broken .NET Framework dependency on this machine.
- **Fix:** Use Node for all HTTP calls: `node -e "fetch(url, {headers}).then(r=>r.json()).then(console.log)"`.

## Node & npm

### E-005 — npm install times out
- **Error:** Shell tool killed `npm install` after 300s; `node_modules` never created.
- **Cause:** Fresh scaffold install on Windows is slow; default timeout too small.
- **Fix:** Retry with larger tool timeout (840000 ms) and `--no-audit --no-fund --loglevel=error`. Retry succeeded in ~1 min.

### E-006 — `Unexpected end of JSON input` from parallel fetches
- **Error:** `SyntaxError: Unexpected end of JSON input` in a Node one-liner firing ~28 parallel requests.
- **Cause:** Too many concurrent requests; some responses returned empty/aborted.
- **Fix:** Run requests sequentially in a `for` loop instead of `Promise.all` with large batches.

## Vite / TypeScript / Build

### E-007 — `__dirname` warning in vite.config.ts
- **Error:** `Your Vite config uses features that are unsupported by configLoader: 'native' — __dirname`
- **Cause:** ESM config file cannot use CommonJS `__dirname`.
- **Fix:** Use `import.meta.dirname` (Node ≥ 20.11).

### E-010 — `baseUrl` deprecated in TypeScript 6; `tsc --noEmit` was a silent no-op
- **When:** Phase 0.4 verification gap, caught when first running `npm run build`
- **Error:** `tsconfig.app.json(4,5): error TS5101: Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0`
- **Cause:** Two-part trap:
  1. TS 6 deprecates `baseUrl`. 
  2. Root `tsconfig.json` is solution-style (only `references`), so plain `tsc --noEmit` typechecks **nothing** — Phase 0.4 "passed" while `tsc -b` (what `npm run build` runs) correctly failed.
- **Fix:** Removed `baseUrl` (paths resolve relative to the tsconfig without it). **Rule: the typecheck gate is `tsc -b` / `npm run build`, never bare `tsc --noEmit` on a solution-style config.**

## Process / environment

### E-015 — vitest suite fails to parse: `Duplicated export 'computePayouts'`
- **When:** Phase 1, first payout test run
- **Error:** `RolldownError: Parse failure: Duplicated export 'computePayouts'` at mock.ts bottom
- **Cause:** Function was declared `export function computePayouts` at the top **and** re-exported via `export { computePayouts }` at the bottom.
- **Fix:** Remove the bottom re-export; keep one export site. **Rule: single export site per symbol.**

### E-016 — `TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled`
- **When:** Phase 1, first `tsc -b` after writing client.ts
- **Error:** Parameter properties in constructors (`constructor(public status: number, ...)`) rejected.
- **Cause:** Vite's react-ts template enables `erasableSyntaxOnly` (TS must stay erasable to plain JS) — constructor parameter properties are TS-only syntax.
- **Fix:** Declare class fields explicitly and assign in the constructor body. **Rule: on this codebase, never use TS-only runtime syntax (parameter properties, enums) — only type-level annotations.**

### E-019 — `npm run dev` from repo root: `Missing script: "dev"`
- **When:** Phase 1, user running the app locally
- **Error:** `npm error Missing script: "dev"` at `C:\...\lokkin`
- **Cause:** Only `frontend/package.json` had scripts; the repo root had no package.json (backend-first repo origin).
- **Fix:** Root `package.json` added with proxy scripts (`dev`, `build`, `lint`, `test`, `checks`, `api`) using `npm --prefix frontend run <script>`. **Rule: all dev commands run from the repo root — documented in README.**

### E-019 — `npm run dev` from repo root: `Missing script: "dev"`
- **When:** Phase 1, user running the app locally
- **Error:** `npm error Missing script: "dev"` at repo root
- **Cause:** Monorepo — the `dev` script lives in `frontend/package.json`; the repo root had no `package.json` at all.
- **Fix:** Added a root `package.json` proxying all commands via `npm --prefix frontend run ...` (`dev`, `build`, `lint`, `test`, `checks`) plus `api` for uvicorn. **Rule: all documented commands run from the repo root — never require the user to cd into `frontend/`.**

### E-020 — UI/UX Pro Max search command references missing `search.py`
- **When:** UI/UX polish phase, design-system discovery
- **Error:** `python ...ui-ux-pro-max/scripts/search.py ...` failed with `can't open file ... search.py: [Errno 2] No such file or directory`.
- **Cause:** The installed skill directory contains the UI/UX guide and data references but not the optional searchable CLI script described by the supplied instructions.
- **Fix:** Continued with the available inspiration screenshots, the persisted `design-system/MASTER.md`, the installed Impeccable product/polish references, and direct source audits. **Rule: missing optional design tooling must not block a scoped UI refinement; record the limitation and use the available design evidence.**

### E-021 — Final UI commit command used unsupported PowerShell `&&`
- **When:** UI/UX polish phase, final commit/push
- **Error:** `The token '&&' is not a valid statement separator in this version.`
- **Cause:** The terminal uses Windows PowerShell 5.1; `&&` is a PowerShell 7 operator.
- **Fix:** Re-run sequential commands with `;` or dependent `if ($?) { ... }`. Related to E-001; no code impact.

### E-018 — Self-hosted runner died silently (child of the shell session)
- **When:** Phase 1, after the tool session that started it ended
- **Error:** Jobs stuck `queued` forever; API showed runner `status: offline`, no Runner process on the machine.
- **Cause:** `Start-Process cmd /c run.cmd` created the runner as a descendant of the shell session; the session teardown killed the process tree. The Startup-folder .bat only helps after a manual logon.
- **Attempts:** (1) `svc.cmd install` — file doesn't exist in runner v2.337.0 Windows zip. (2) `schtasks /create` — `Access is denied` (needs admin on this machine).
- **Fix (works, no admin):** start via WMI so the process is owned by WmiPrvSE and survives the session: `Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = 'cmd /c cd /d C:\Users\hp\actions-runner && run.cmd >> runner-run.log 2>&1' }`. **Rule: if CI jobs sit queued, check runner status first — `gh api repos/er4l1m4d/lokkin/actions/runners --jq '.runners[].status'`; if offline, re-run the WMI command.** Also note: jobs show `queued` with empty runner name while the runner works through them one at a time — check `runner-run.log` tail for truth.

### E-017 — Payout math double-scaled the pool (logic bug, caught by conservation tests)
- **When:** Phase 1, writing payout tests for mock.ts
- **Symptom:** First implementation took `bonus = pool * 0.1`, then `pool *= 0.9`, then computed winner shares (50/30/10) **on the reduced pool** — allocations + bonus did not sum to the pool; 3 of 4 tests failed with a shortfall. Second pass also let skipped tie allocations vanish instead of flowing to the completion bonus.
- **Cause:** Applying the 10% bonus extraction before the 50/30/10 split double-discounts; per locked rules, allocations are fractions of the **full** pool (0.5+0.3+0.1 = 0.9 to winners, 0.1 to bonus, skipped ranks → bonus).
- **Fix:** Compute winner allocations from the full pool; skipped-rank allocations add to the bonus; every test asserts total distributed == total staked (conservation). Two of the initial failing tests were then my own expectation arithmetic (misclassifying rank-3 winners as losers) — implementation was conserving money correctly. **Lesson: write the conservation assertion first, then per-player expectations; a wrong expectation set is as revealing as a wrong implementation.**

### E-014 — CI backend job failed: pip `getaddrinfo failed` (transient DNS)
- **When:** Phase 0.5, first self-hosted CI run
- **Error:** `WARNING: Retrying ... connection broken by 'NewConnectionError': Failed to establish a new connection: [Errno 11001] getaddrinfo failed': /simple/fastapi/` → `ERROR: No matching distribution found for fastapi==0.116.1`
- **Cause:** Machine-wide network blip during the job — DNS resolution failed for pypi.org. Evidence: npm + git + checkout worked fine in the same run; `gh run watch` stream dropped at the same moment; a plain `pip download` outside CI hit the same failure; rerun passed with zero changes.
- **Fix:** `gh run rerun <id> --failed`. **Rule: single `getaddrinfo failed` / network retry warnings in CI = rerun first, debug second.** If it recurs often, consider a pip cache or vendored wheels.

### E-013 — GitHub Actions runs fail instantly, no runner assigned (account-level restriction)
- **When:** Phase 0.5, first CI runs on the new repo
- **Error:** Every run: `startup_failure` (private) / `failure` after 3s (public) · jobs created but `runner_id: 0`, `runner_name: ""`, zero steps, no logs, "This workflow run cannot be retried".
- **Diagnosis path (ruled out in order):** workflow YAML invalid? — valid (js-yaml + GitHub content API, no BOM, LF) · file encoding? — clean · invalid triggers/actions? — even a minimal `echo` hello-world workflow failed identically · repo visibility? — made repo public, same failure · repo Actions permissions? — enabled, `allowed_actions: all` · platform outage? — status page all operational.
- **Cause (refined):** Account-level Actions restriction. On public repos minutes are free even without a payment method, so this is most likely **anti-abuse flagging** (fresh repo created via CLI + rapid pushes + workflow files = classic spam signature). Known remedies: contact GitHub Support to unflag, and/or "establish" the account (2FA, verified email, payment method).
- **Status:** RESOLVED via workaround. User's card has issues — payment method path unavailable. A **self-hosted runner** (`lokkin-pc`, installed at `C:\Users\hp\actions-runner`) now executes CI on this PC; workflow moved to `runs-on: [self-hosted, lokkin-pc]` and the `pull_request` trigger was removed (public repo + self-hosted runner = fork PRs must never run on it). Full details in DEPLOY.md "CI runner" section. If a payment method is ever added / the flag lifts, hosted runners can be restored.
- **Related:** E-011 (needed `workflow` scope first, solved), E-012 (refspec form for partial push).

### E-011 — GitHub push rejected: OAuth token missing `workflow` scope
- **When:** Phase 0.5, first push containing `.github/workflows/ci.yml`
- **Error:** `! [remote rejected] HEAD -> main (refusing to allow an OAuth App to create or update workflow '.github/workflows/ci.yml' without 'workflow' scope)`
- **Cause:** gh CLI token had scopes `gist, read:org, repo` — pushing workflow files requires the `workflow` scope.
- **Fix:** `gh auth refresh -h github.com -s workflow` (device-code flow in browser). Meanwhile, pushed workflow-free commits with `git push origin <sha>:refs/heads/main` so progress wasn't blocked.

### E-012 — Git push refspec error on partial push
- **Error:** `The destination you provided is not a full refname (i.e., starting with "refs/")`
- **Cause:** Pushing a raw commit SHA to a remote branch needs a fully-qualified refspec; `sha:main` is ambiguous when the remote branch doesn't exist yet.
- **Fix:** Use the full refspec: `git push origin <sha>:refs/heads/main`.

### E-008 — Start-Process "npm" didn't launch dev server
- **Error:** No node process / nothing listening on :5173 after `Start-Process -FilePath "npm" -ArgumentList "run","dev"`.
- **Cause:** On Windows `npm` is `npm.cmd`; Start-Process with the bare name fails silently.
- **Fix:** `Start-Process cmd.exe -ArgumentList "/c","npm run dev > dev-server.log 2>&1"` then poll `http://localhost:5173`.

### E-009 — B.AI "Deposit required to unlock premium models"
- **Error:** `{"code":"access_denied","message":"Access restricted. Deposit required to unlock premium models."}` on most models.
- **Cause:** Account has zero balance; most B.AI models are paid.
- **Fix:** Free models identified by probing every model: `mimo-v2.5`, `hy3`, `glm-5.3-flash`, `qwen3.8-flash`. Opencode config defaults to a free model; paid models stay listed for post-top-up use.
