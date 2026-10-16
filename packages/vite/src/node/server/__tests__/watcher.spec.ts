import fs from 'node:fs'
import os from 'node:os'
import path, { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { promiseWithResolvers } from '../../../shared/utils'
import { normalizePath } from '../../utils'
import { type ViteDevServer, createServer } from '../index'

const stubGetWatchedCode = /\(\)\s*\{\s*return this;\s*\}/
const root = fileURLToPath(
  new URL('./fixtures/watcher/nested-root', import.meta.url),
)
const watchedFile = fileURLToPath(import.meta.url)

function expectWatcherToBeClosed(watcher: ViteDevServer['watcher']) {
  // Chokidar updates its private `closed` property synchronously in `add()`,
  // while `getWatched()` is populated asynchronously. Rely on the private
  // property here to keep these regression tests deterministic.
  expect(watcher).toHaveProperty('closed', true)
}

describe('watcher configuration', () => {
  let server: ViteDevServer | undefined

  afterEach(async () => {
    if (server) {
      await server.close()
      server = undefined
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

  it('keeps the watcher closed when add is called after server close', async () => {
    server = await createServer()
    await server.close()

    try {
      expect(server.watcher.add(watchedFile)).toBe(server.watcher)
      expectWatcherToBeClosed(server.watcher)
    } finally {
      await server.watcher.close()
    }
  })

  it('keeps the watcher closed when add is called while server close is pending', async () => {
    const closeStarted = promiseWithResolvers<void>()
    const finishClose = promiseWithResolvers<void>()
    server = await createServer({
      plugins: [
        {
          name: 'delay-close',
          async buildEnd() {
            closeStarted.resolve()
            await finishClose.promise
          },
        },
      ],
    })

    const closePromise = server.close()
    await closeStarted.promise

    try {
      server.watcher.add(watchedFile)
      expectWatcherToBeClosed(server.watcher)
    } finally {
      finishClose.resolve()
      await closePromise
      await server.watcher.close()
    }
  })

  it('keeps the watcher closed when addWatchFile captured during buildStart is called while closing', async () => {
    const closeStarted = promiseWithResolvers<void>()
    const finishClose = promiseWithResolvers<void>()
    let addWatch!: (id: string) => void
    server = await createServer({
      root,
      plugins: [
        {
          name: 'capture-add-watch-file',
          buildStart() {
            addWatch = (id: string) => this.addWatchFile(id)
          },
          async buildEnd() {
            closeStarted.resolve()
            await finishClose.promise
          },
        },
      ],
    })

    await server.environments.client.pluginContainer.buildStart()
    const closePromise = server.close()
    await closeStarted.promise

    try {
      addWatch(watchedFile)
      expectWatcherToBeClosed(server.watcher)
    } finally {
      finishClose.resolve()
      await closePromise
      await server.watcher.close()
    }
  })

  it('should not re-add files inside the root when addWatchFile is called with native paths', async () => {
    const addedFiles: string[] = []
    let addWatchFile!: (id: string) => void
    server = await createServer({
      root,
      plugins: [
        {
          name: 'capture-add-watch-file',
          buildStart() {
            addWatchFile = (id: string) => this.addWatchFile(id)
          },
        },
      ],
    })

    await server.environments.client.pluginContainer.buildStart()

    const originalAdd = server.watcher.add.bind(server.watcher)
    server.watcher.add = (file: string | string[]) => {
      addedFiles.push(...(Array.isArray(file) ? file : [file]))
      return originalAdd(file)
    }

    // a file inside the root, with native separators (backslashes on Windows)
    addWatchFile(join(root, 'vite.config.js'))
    // a file outside the root must still be added to the watcher
    addWatchFile(join(resolve(root, '../custom-public'), 'foo.txt'))

    expect(addedFiles).toEqual([resolve(root, '../custom-public/foo.txt')])
  })

  it('should watch the root directory, config file dependencies, dotenv files, and the public directory', async () => {
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

  it('should emit a trailing change event when a file is saved twice in rapid succession', async () => {
    const tempDir = fs.realpathSync.native(
      fs.mkdtempSync(
        path.join(fs.realpathSync.native(os.tmpdir()), 'vite-watcher-test-'),
      ),
    )
    const testFile = join(tempDir, 'test.js')
    fs.writeFileSync(testFile, 'export default "initial"\n')

    try {
      server = await createServer({
        root: tempDir,
        configFile: false,
        server: {
          middlewareMode: true,
          ws: false,
        },
      })
      if (!(server.watcher as any)._readyEmitted) {
        await new Promise<void>((resolve) =>
          server!.watcher.once('ready', resolve),
        )
      }
      // Allow the OS file watcher to settle before triggering test writes
      await new Promise((r) => setTimeout(r, 300))

      const isTestFile = (file: string) =>
        normalizePath(resolve(file)).toLowerCase() ===
        normalizePath(resolve(testFile)).toLowerCase()

      let lastSeen = ''
      server.watcher.on('change', (file) => {
        if (isTestFile(file)) {
          lastSeen = fs.readFileSync(file, 'utf-8')
        }
      })

      fs.writeFileSync(testFile, 'export default "first"\n')
      await new Promise((r) => setTimeout(r, 10))
      fs.writeFileSync(testFile, 'export default "second"\n')

      await vi.waitFor(
        () => {
          expect(lastSeen).toBe('export default "second"\n')
        },
        { timeout: 5000 },
      )
    } finally {
      if (server) {
        await server.close()
        server = undefined
      }
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('should not emit a change event after unlink when rapid changes were throttled', async () => {
    const tempDir = fs.realpathSync.native(
      fs.mkdtempSync(
        path.join(fs.realpathSync.native(os.tmpdir()), 'vite-watcher-test-'),
      ),
    )
    const testFile = join(tempDir, 'test.js')
    fs.writeFileSync(testFile, 'export default "initial"\n')

    try {
      server = await createServer({
        root: tempDir,
        configFile: false,
        server: {
          middlewareMode: true,
          ws: false,
        },
      })
      if (!(server.watcher as any)._readyEmitted) {
        await new Promise<void>((resolve) =>
          server!.watcher.once('ready', resolve),
        )
      }
      await new Promise((r) => setTimeout(r, 300))

      const isTestFile = (file: string) =>
        normalizePath(resolve(file)).toLowerCase() ===
        normalizePath(resolve(testFile)).toLowerCase()

      const events: string[] = []
      server.watcher.on('all', (event, file) => {
        if (isTestFile(file)) {
          events.push(event)
        }
      })

      fs.writeFileSync(testFile, 'export default "first"\n')
      await new Promise((r) => setTimeout(r, 10))
      fs.writeFileSync(testFile, 'export default "second"\n')
      await new Promise((r) => setTimeout(r, 10))
      fs.unlinkSync(testFile)

      await vi.waitFor(
        () => {
          expect(events).toContain('unlink')
        },
        { timeout: 5000 },
      )

      // Wait past the 50ms throttle window to ensure no late change event is emitted after unlink
      await new Promise((r) => setTimeout(r, 150))
      const lastEvent = events.at(-1)
      expect(lastEvent).toBe('unlink')
    } finally {
      if (server) {
        await server.close()
        server = undefined
      }
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })
})
