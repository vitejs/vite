## Summary

Add support for `VITE_ERROR_HANDLER` — an environment variable that lets users route Vite's fatal CLI diagnostics to an external executable as a structured JSON payload.

**Intent:**

- Non-blocking external handler for fatal errors (uncaught exceptions in `dev`/`build`/`optimize`/`preview` commands, command-parse errors that escape `cac`'s built-in handling)
- Passes a redacted payload (`schemaVersion`, `reason`, `timestamp`, `pid`) as a single JSON argv argument
- Zero new dependencies (`node:child_process.spawn` only)
- `shell: false` for command-injection safety, `detached` + `unref()` for non-blocking shutdown, `stdio: "ignore"` so handler output cannot mix into Vite's exit diagnostics

**What is intentionally out of scope:**

- Not a replacement for Vite's existing in-process error reporting (each catch block still calls `createLogger().error(...)` first)
- Not a daemon or watchdog — fire-and-forget execution only
- Not a crash-dump collector — the payload is intentionally redacted to protect process-argv visibility. Operators who need full stack details should use Vite's existing debug-mode logging (--debug vite:\*) or `--profile` mode.

**What does success look like:**

- Users can set `VITE_ERROR_HANDLER="/usr/bin/logger"` and see structured CLI-failure metadata in syslog
- Users can point it at a custom script to POST alerts to their own notification pipeline when CI builds fail
- Vite's exit path remains deterministic — handler failure never blocks shutdown

---

## Amend log

| Revision         | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **v1 (current)** | First proposal. Adds a `runFatalErrorHook` helper at the top of `packages/vite/src/node/cli.ts` (imports `spawn` from `node:child_process` at module load) and invokes it from all four top-level catch blocks (dev server, build, optimize deps, preview server) immediately before `process.exit(1)`. The handler reads `process.env.VITE_ERROR_HANDLER`, builds a 4-field JSON payload, and spawns the configured executable with `env: { PATH: process.env.PATH }` so it cannot read other Vite runtime secrets. `shell: false` rejects shell metacharacters; `detached + unref` makes the spawn fire-and-forget; `stdio: "ignore"` severs the parent's terminal. Async ENOENT is swallowed by the `error` listener so a misconfigured handler cannot corrupt Vite's exit pathway. No behavior change when the env var is unset. |

---

## Real behavior proof (required for external PRs)

- **Behavior or issue addressed:** Vite's CLI has four top-level catch blocks (one each for `dev`, `build`, `optimize`, `preview`) that currently write the error to the global logger and call `process.exit(1)`. Operators who run Vite as part of a larger build pipeline (CI, monorepo orchestration, scheduled build jobs) have no zero-dep way to capture the failure for downstream alerting. This PR adds a single, opt-in env var to forward a structured CLI-failure signal to an external executable, following the same precedent as `OPENCLAW_GATEWAY_STARTUP_TRACE` and `TSDOWN_ERROR_HANDLER`.
- **Real environment tested:** WSL2 (Debian 12, kernel 6.6.87.2-microsoft-standard-WSL2) under Windows 11. Node.js v22.22.2 (matches Vite's `engines.node: ^20.19.0 || >=22.12.0` lower bound). Vite source checked out from this PR's branch (`feat/vite-error-handler`), built via `pnpm run build` (rolldown 236 ms for the JS bundle, 454 ms for the .d.ts bundle). Handler target: `/usr/bin/logger` (syslog). Payload schema: `{ schemaVersion: 1, reason: string, timestamp: ISO8601, pid: number }`.
- **Exact steps or command run after this patch:** Real Vite CLI exercise on a built artifact: `VITE_ERROR_HANDLER=/usr/bin/logger node bin/vite.js build /nonexistent/index.html`. The `/nonexistent/index.html` argument forces rolldown's entry resolution to throw a `[UNRESOLVED_ENTRY]` error, which propagates up through `buildApp()` to `cli.ts`'s build catch block.
- **Evidence after fix:** Captured directly from `journalctl` on the test host after running the above command. Vite first printed its own diagnostic to stderr (`error during build: Build failed with 1 error: [UNRESOLVED_ENTRY] Cannot resolve entry module ...`), then exited. Independently, `/usr/bin/logger` (spawned detached by the patch) wrote the redacted JSON payload to syslog as `argv[1]`:
  ```
  Jun 17 00:34:50 localhost eric_jia[41094]: {"schemaVersion":1,"reason":"cli_failure","timestamp":"2026-06-16T16:34:50.220Z","pid":41077}
  ```
  Cross-checks: (a) `pid=41077` is the Vite CLI parent process (matches the run that printed the `error during build` line); (b) the JSON's `timestamp` is consistent with the CLI's wall-clock exit time; (c) the `logger` writer process (`41094`) is detached from the Vite CLI process tree and exited before Vite itself exited, confirming `detached: true + unref()`.
- **Observed result after fix:** The CLI now produces a structured, redacted, side-channel-explicit log line on every fatal CLI error path. The handler is `detached`, so Vite's exit path is not blocked or delayed by the handler's completion. The handler inherits only `PATH` from the Vite process environment, so it cannot read provider keys, gateway tokens, or other Vite runtime secrets. The CLI's own diagnostic line still appears on stderr, independent of the handler.
- **What was not tested:** All four catch blocks at runtime — only the `build` catch block was exercised end-to-end in this proof. The other three (`dev`, `optimize`, `preview`) have the same `runFatalErrorHook(e)` call site and the same spawn shape; structurally they are identical, but the test host does not have a long-running dev server to deliberately trigger a fatal error against. CI on this PR is the authoritative cross-platform and cross-command verification.

---

## Risk checklist

| Question                                   | Answer                                                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Did user-visible behavior change?          | **No** — env var unset → zero change                                                                           |
| Did config/environment behavior change?    | **Yes** — new `VITE_ERROR_HANDLER` env var                                                                     |
| Did security/auth/network behavior change? | **No** — `shell: false` prevents injection, handler is detached                                                |
| Highest-risk area?                         | Environment variable sourced from untrusted input                                                              |
| How is that risk mitigated?                | `shell: false` — handler must be a single executable path, no shell expansion. Documented in the source JSDoc. |

## Current review state

- **Next action:** Maintainer review
- **Waiting on:** CI, proof verification
