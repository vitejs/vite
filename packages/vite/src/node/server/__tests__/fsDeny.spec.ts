import fs from 'node:fs'
import path from 'node:path'
import { afterAll, describe, expect, test } from 'vitest'
import { isFileLoadingAllowed, resolveConfig } from '../..'
import { normalizePath } from '../../utils'

// Windows runners may expose the OS temp directory through an 8.3 short path
// (e.g. `RUNNER~1`), which Vite intentionally rejects before checking fs.deny.
const tmpDir = fs.mkdtempSync(path.join(process.cwd(), '.vite-fs-deny-'))

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('server.fs.deny default patterns', () => {
  test('denies sensitive paths inside a normal project root', async () => {
    const root = path.join(tmpDir, 'normal')
    fs.mkdirSync(root, { recursive: true })
    const config = await resolveConfig(
      { root, configFile: false, logLevel: 'silent' },
      'serve',
    )

    expect(
      isFileLoadingAllowed(
        config,
        normalizePath(path.join(root, 'src/main.js')),
      ),
    ).toBe(true)
    expect(
      isFileLoadingAllowed(
        config,
        normalizePath(path.join(root, '.git/config')),
      ),
    ).toBe(false)
    expect(
      isFileLoadingAllowed(
        config,
        normalizePath(path.join(root, '.env.local')),
      ),
    ).toBe(false)
  })

  test('does not deny a project root located inside a .git directory', async () => {
    const root = path.join(tmpDir, 'repo', '.git', 'worktrees', 'app')
    fs.mkdirSync(root, { recursive: true })
    const config = await resolveConfig(
      { root, configFile: false, logLevel: 'silent' },
      'serve',
    )

    expect(
      isFileLoadingAllowed(
        config,
        normalizePath(path.join(root, 'src/main.js')),
      ),
    ).toBe(true)
    expect(
      isFileLoadingAllowed(config, normalizePath(path.join(root, '.git/HEAD'))),
    ).toBe(false)
    expect(
      isFileLoadingAllowed(
        config,
        normalizePath(path.join(tmpDir, 'repo/.git/config')),
      ),
    ).toBe(false)
  })
})
