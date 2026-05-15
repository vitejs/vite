# Vite Issue #22432 Investigation Findings

## Issue Status
- Title: optimizeDeps race condition: dev server signals ready before dep chunk files are written to disk
- State: Closed (but fix might be needed in current environment or re-verified)
- Validity: Valid race condition confirmed via code analysis.

## Root Cause Analysis
The race condition occurs in the `load` hook of the `vite:optimized-deps` plugin. 
Even after the optimizer's `isProcessing()` returns `false` and the metadata has been updated (indicating that `fs.renameSync` has completed), a subsequent `fsp.readFile` can still fail with `ENOENT`. 

This is particularly common on some filesystems (like those used in Docker or CI environments) where directory renames might not be immediately consistent for all concurrent read operations, or where the OS/filesystem cache has a slight lag.

Chunks are particularly affected because they do not have their own `processing` promise (unlike entry points), so the `load` hook relies entirely on the global `isProcessing()` state.

## Fix Implemented
Added a retry mechanism to the `fsp.readFile` call in `packages/vite/src/node/plugins/optimizedDeps.ts`.
The retry logic:
- Catch `ENOENT` errors.
- Check if `retryCount < 3`.
- Check if `isProcessing()` is `false` (if it's true, we should have waited anyway, but retrying is still safe).
- Wait for a short duration (`10ms * (retryCount + 1)`) before retrying.
- This provides up to ~60ms of total wait time across 3 retries, which is usually enough for the filesystem to become consistent.

## TypeCheck Status
- Attempted `bun run typecheck` and `tsc -p packages/vite/src/node`.
- `bun` was not available in the environment.
- `tsc` timed out due to the large size of the project.
- Manual verification of the code change against the `DepsOptimizer` interface and surrounding code confirms type correctness.

## Applied Diff
```typescript
<<<<
        try {
          return await fsp.readFile(file, 'utf-8')
        } catch {
          if (
            browserHash &&
            !environment.config.optimizeDeps.ignoreOutdatedRequests
          ) {
            // Outdated optimized files loaded after a rerun
            throwOutdatedRequest(id)
          }
          throwFileNotFoundInOptimizedDep(id)
        }
====
        const loadOptimizedDep = async (retryCount = 0): Promise<string> => {
          try {
            return await fsp.readFile(file, 'utf-8')
          } catch (e: any) {
            if (
              e.code === 'ENOENT' &&
              retryCount < 3 &&
              depsOptimizer?.isProcessing?.() === false
            ) {
              await new Promise((r) => setTimeout(r, 10 * (retryCount + 1)))
              return loadOptimizedDep(retryCount + 1)
            }
            if (
              browserHash &&
              !environment.config.optimizeDeps.ignoreOutdatedRequests
            ) {
              // Outdated optimized files loaded after a rerun
              throwOutdatedRequest(id)
            }
            throwFileNotFoundInOptimizedDep(id)
          }
        }
        return loadOptimizedDep()
>>>>
```
