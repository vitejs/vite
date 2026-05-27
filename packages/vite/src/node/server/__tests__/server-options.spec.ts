import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { createLogger } from '../../logger'
import { normalizePath, safeRealpathSync } from '../../utils'
import { createServer, resolveServerOptions } from '../index'

describe('resolveServerOptions', () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { force: true, recursive: true })
    }
  })

  test('allows the symlink target for the project root', async () => {
    const realRoot = makeTempDir()
    const symlinkParent = makeTempDir()
    const symlinkRoot = path.join(symlinkParent, 'linked-root')
    fs.symlinkSync(realRoot, symlinkRoot, 'junction')

    const server = await resolveServerOptions(
      symlinkRoot,
      undefined,
      createLogger('silent'),
    )

    expect(server.fs.allow).toContain(realpath(realRoot))
  })

  test('loads modules resolved through a symlinked project root', async () => {
    const realRoot = makeTempDir()
    fs.mkdirSync(path.join(realRoot, 'src'))
    fs.writeFileSync(
      path.join(realRoot, 'index.html'),
      '<script type="module" src="/src/main.ts"></script>',
    )
    fs.writeFileSync(path.join(realRoot, 'src/main.ts'), 'export const msg = 1')

    const symlinkParent = makeTempDir()
    const symlinkRoot = path.join(symlinkParent, 'linked-root')
    fs.symlinkSync(realRoot, symlinkRoot, 'junction')

    const server = await createServer({
      root: symlinkRoot,
      logLevel: 'silent',
      server: {
        middlewareMode: true,
      },
    })

    try {
      const result =
        await server.environments.client.transformRequest('/src/main.ts')

      expect(result?.code).toContain('const msg = 1')
    } finally {
      await server.close()
    }
  })

  test('allows symlink targets from explicit fs.allow entries', async () => {
    const root = makeTempDir()
    const realAllowedDir = makeTempDir()
    const symlinkParent = makeTempDir()
    const symlinkAllowedDir = path.join(symlinkParent, 'allowed')
    fs.symlinkSync(realAllowedDir, symlinkAllowedDir, 'junction')

    const server = await resolveServerOptions(
      root,
      {
        fs: {
          allow: [symlinkAllowedDir],
        },
      },
      createLogger('silent'),
    )

    expect(server.fs.allow).toContain(realpath(realAllowedDir))
  })

  function makeTempDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vite-fs-allow-'))
    tempDirs.push(dir)
    return dir
  }

  function realpath(dir: string): string {
    return normalizePath(safeRealpathSync(dir))
  }
})
