import fs from 'node:fs'
import os from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { promiseWithResolvers } from '../../../shared/utils'
import { checkLoadingAccess } from '../middlewares/static'
import { resolveChokidarOptions } from '../../watch'
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

  it('resolveChokidarOptions scopes .git pattern when root contains .git directory', () => {
    const gitWorktreeRoot = '/path/to/repo/.git/worktrees/my-branch'
    const options = resolveChokidarOptions(
      {},
      new Set(),
      false,
      '/cache',
      gitWorktreeRoot,
    )
    const ignored = Array.isArray(options.ignored) ? options.ignored : []
    expect(ignored).toContain(`${gitWorktreeRoot}/**/.git/**`)
    expect(ignored).not.toContain('**/.git/**')
  })

  it('resolveChokidarOptions retains **/.git/** when root does not contain .git', () => {
    const normalRoot = '/path/to/repo'
    const options = resolveChokidarOptions(
      {},
      new Set(),
      false,
      '/cache',
      normalRoot,
    )
    const ignored = Array.isArray(options.ignored) ? options.ignored : []
    expect(ignored).toContain('**/.git/**')
  })

  it('serves files and watches root when project root is within ancestor .git directory (fix #23626)', async () => {
    const tempDir = fs.mkdtempSync(join(os.tmpdir(), 'vite-git-ancestor-'))
    const appRoot = join(tempDir, '.git', 'worktrees', 'app')
    const appFile = join(appRoot, 'index.html')
    const gitInternalFile = join(tempDir, '.git', 'config')

    try {
      fs.mkdirSync(appRoot, { recursive: true })
      fs.writeFileSync(appFile, '<h1>Hello</h1>')
      fs.writeFileSync(gitInternalFile, '[core]\n')

      server = await createServer({
        root: appRoot,
        logLevel: 'silent',
      })

      // Verify that serving app files inside root is allowed and does not return 403
      expect(checkLoadingAccess(server.config, appFile)).toBe('allowed')

      // Verify that accessing sibling .git internals outside the root is denied
      expect(checkLoadingAccess(server.config, gitInternalFile)).toBe('denied')

      // Verify that chokidar watcher can watch the root inside ancestor .git
      await new Promise((resolve) => server!.watcher.once('ready', resolve))
      await vi.waitFor(() => {
        const watchedDirs = Object.keys(server!.watcher.getWatched())
        expect(watchedDirs).toContain(appRoot)
      })
    } finally {
      if (server) {
        await server.close()
        server = undefined
      }
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })
})
