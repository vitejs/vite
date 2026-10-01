import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { promiseWithResolvers } from '../../../shared/utils'
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
})
