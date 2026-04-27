import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { ChildProcess } from 'node:child_process'
import { describe, expect, test } from 'vitest'
import { createServer } from '../../index'

const getActiveHandles = (): unknown[] => (process as any)._getActiveHandles()

const runningSassWorkers = (): ChildProcess[] =>
  getActiveHandles().filter((h): h is ChildProcess => {
    if (!h || (h as object).constructor?.name !== 'ChildProcess') return false
    const cp = h as ChildProcess & { spawnfile?: string }
    return (
      cp.exitCode == null &&
      typeof cp.spawnfile === 'string' &&
      cp.spawnfile.includes('sass')
    )
  })

describe('css preprocessor worker teardown', () => {
  test('awaits sass-embedded worker disposal on server.close()', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vite-sass-teardown-'))
    const scssPath = path.join(root, 'a.scss')
    fs.writeFileSync(scssPath, '$c: red;\nbody { color: $c; }\n')

    const server = await createServer({
      root,
      logLevel: 'silent',
      configFile: false,
      server: { ws: false },
    })
    await server.listen()

    try {
      await server.pluginContainer.transform(
        fs.readFileSync(scssPath, 'utf8'),
        scssPath,
      )
    } catch {
      // the optimizer can throw ERR_OUTDATED_OPTIMIZED_DEP post-transform;
      // not relevant here — we only need the scss processor to have run.
    }

    expect(runningSassWorkers().length).toBeGreaterThan(0)

    await server.close()

    expect(runningSassWorkers().length).toBe(0)
  }, 30_000)
})
