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

### E-008 — Start-Process "npm" didn't launch dev server
- **Error:** No node process / nothing listening on :5173 after `Start-Process -FilePath "npm" -ArgumentList "run","dev"`.
- **Cause:** On Windows `npm` is `npm.cmd`; Start-Process with the bare name fails silently.
- **Fix:** `Start-Process cmd.exe -ArgumentList "/c","npm run dev > dev-server.log 2>&1"` then poll `http://localhost:5173`.

### E-009 — B.AI "Deposit required to unlock premium models"
- **Error:** `{"code":"access_denied","message":"Access restricted. Deposit required to unlock premium models."}` on most models.
- **Cause:** Account has zero balance; most B.AI models are paid.
- **Fix:** Free models identified by probing every model: `mimo-v2.5`, `hy3`, `glm-5.3-flash`, `qwen3.8-flash`. Opencode config defaults to a free model; paid models stay listed for post-top-up use.
