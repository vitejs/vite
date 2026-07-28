import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveConfig } from '../../config'
import { type ViteDevServer, createServer, getServerWatchPaths } from '../index'

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

  it('does not watch a missing public directory explicitly', async () => {
    const root = fileURLToPath(
      new URL('./fixtures/watcher/nested-root', import.meta.url),
    )
    const missingPublicDir = resolve(root, '../missing-public')
    const config = await resolveConfig(
      {
        root,
        publicDir: missingPublicDir,
      },
      'serve',
    )

    expect(getServerWatchPaths(config)).not.toContain(missingPublicDir)
  })
})
