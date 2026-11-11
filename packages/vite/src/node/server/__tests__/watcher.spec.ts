import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import { promiseWithResolvers } from '../../../shared/utils'
import { createTestServer } from '../../__tests__/testUtils'
import type { ViteDevServer } from '../index'

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
  it('when watcher is disabled, return noop watcher', async () => {
    const server = await createTestServer({
      server: {
        watch: null,
      },
    })
    expect(server.watcher.add.toString()).toMatch(stubGetWatchedCode)
  })

  it('when watcher is not disabled, return chokidar watcher', async () => {
    const server = await createTestServer({
      server: {
        watch: {},
      },
    })
    expect(server.watcher.add.toString()).not.toMatch(stubGetWatchedCode)
  })

  it('keeps the watcher closed when add is called after server close', async () => {
    const server = await createTestServer()
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
    const server = await createTestServer({
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
    const server = await createTestServer({
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
    const server = await createTestServer({
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

    expect(addedFiles).toStrictEqual([
      resolve(root, '../custom-public/foo.txt'),
    ])
  })

  it('should watch the root directory, config file dependencies, dotenv files, and the public directory', async () => {
    const server = await createTestServer({ root })
    await new Promise((resolve) => server.watcher.once('ready', resolve))
    // Perform retries here as chokidar may still not be completely watching all directories
    // after the `ready` event
    await vi.waitFor(() => {
      const watchedDirs = Object.keys(server.watcher.getWatched())
      expect(watchedDirs).toStrictEqual(
        expect.arrayContaining([
          root,
          resolve(root, '../config-deps'),
          resolve(root, '../custom-env'),
          resolve(root, '../custom-public'),
        ]),
      )
    })
  })
})
