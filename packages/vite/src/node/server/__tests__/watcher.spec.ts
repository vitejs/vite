import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { type ViteDevServer, createServer } from '../index'

const stubGetWatchedCode = /\(\)\s*\{\s*return this;\s*\}/

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
})

describe('resolveChokidarOptions warning for ignored project root', () => {
  it('warns when the project root matches a default ignore glob (#23523)', async () => {
    const { resolveChokidarOptions } = await import('../../watch')
    const warn = vi.fn()
    const logger = { warn } as any
    resolveChokidarOptions(
      { disableGlobbing: true },
      new Set(),
      false,
      '/tmp/cache',
      '/home/user/test-results/my-project',
      logger,
    )
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('test-results')
    expect(warn.mock.calls[0][0]).toContain('HMR will not work')
  })

  it('does not warn for a normal project root', async () => {
    const { resolveChokidarOptions } = await import('../../watch')
    const warn = vi.fn()
    const logger = { warn } as any
    resolveChokidarOptions(
      { disableGlobbing: true },
      new Set(),
      false,
      '/tmp/cache',
      '/home/user/my-project',
      logger,
    )
    expect(warn).not.toHaveBeenCalled()
  })

  it('does not warn when a user-supplied ignore matches the root, only defaults', async () => {
    const { resolveChokidarOptions } = await import('../../watch')
    const warn = vi.fn()
    const logger = { warn } as any
    resolveChokidarOptions(
      { disableGlobbing: true, ignored: ['**/staging/**'] },
      new Set(),
      false,
      '/tmp/cache',
      '/home/user/staging/my-project',
      logger,
    )
    expect(warn).not.toHaveBeenCalled()
  })
})
