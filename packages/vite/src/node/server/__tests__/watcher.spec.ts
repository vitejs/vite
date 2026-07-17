import fsp from 'node:fs/promises'
import os from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { type ViteDevServer, createServer } from '../index'

const stubGetWatchedCode = /\(\)\s*\{\s*return this;\s*\}/

describe('watcher configuration', () => {
  let server: ViteDevServer | undefined
  let tempRoot: string | undefined

  afterEach(async () => {
    if (server) {
      await server.close()
      server = undefined
    }
    if (tempRoot) {
      await fsp.rm(tempRoot, { recursive: true, force: true })
      tempRoot = undefined
    }
  })

  it('when watcher is disabled, return noop watcher', async () => {
    server = await createServer({
      server: {
        watch: null,
      },
    })
    expect(server.watcher.add.toString()).toMatch(stubGetWatchedCode)
  })

  it('when watcher is not disabled, return chokidar watcher', async () => {
    server = await createServer({
      server: {
        watch: {},
      },
    })
    expect(server.watcher.add.toString()).not.toMatch(stubGetWatchedCode)
  })

  it('should watch the root directory, config file dependencies, dotenv files, and the public directory', async () => {
    const root = fileURLToPath(
      new URL('./fixtures/watcher/nested-root', import.meta.url),
    )
    server = await createServer({ root })
    await new Promise((resolve) => server!.watcher.once('ready', resolve))
    // Perform retries here as chokidar may still not be completely watching all directories
    // after the `ready` event
    await vi.waitFor(() => {
      const watchedDirs = Object.keys(server!.watcher.getWatched())
      expect(watchedDirs).toEqual(
        expect.arrayContaining([
          root,
          resolve(root, '../config-deps'),
          resolve(root, '../custom-env'),
          resolve(root, '../custom-public'),
        ]),
      )
    })
  })

  it('should keep watching the root when the configured publicDir does not exist', async () => {
    // watching a non-existent nested path breaks watching of the subtree
    // containing it (https://github.com/paulmillr/chokidar/issues/1470),
    // so a missing publicDir must not be passed to chokidar
    tempRoot = await fsp.realpath(
      await fsp.mkdtemp(join(os.tmpdir(), 'vite-watcher-test-')),
    )
    const entry = join(tempRoot, 'src', 'frontend', 'src', 'main.js')
    await fsp.mkdir(dirname(entry), { recursive: true })
    await fsp.writeFile(entry, 'export const foo = 1\n')

    server = await createServer({
      root: tempRoot,
      configFile: false,
      logLevel: 'silent',
      publicDir: join(tempRoot, 'src', 'frontend', 'public'),
      server: {
        // poll so the behavior is the same on every OS (the native macOS
        // backend is not affected by the chokidar bug, the others are)
        watch: { usePolling: true, interval: 100 },
      },
    })
    await new Promise((resolve) => server!.watcher.once('ready', resolve))

    let changed = false
    server!.watcher.on('change', (file) => {
      if (file === entry) changed = true
    })
    await vi.waitFor(
      async () => {
        // keep appending in case the first edit lands before polling starts
        await fsp.appendFile(entry, '// edited\n')
        expect(changed).toBe(true)
      },
      { timeout: 8000, interval: 200 },
    )
  })
})
