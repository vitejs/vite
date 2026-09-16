import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { createServer } from '..'
import type { ViteDevServer } from '..'
import { normalizePath } from '../utils'
import { resolveChokidarOptions, type ServerWatchOptions } from '../watch'

const GITIGNORE = [
  'dist',
  'coverage',
  'logs/',
  '*.local',
  '*.log',
  '!keep.log',
].join('\n')

let root: string

function matcherFrom(options: ServerWatchOptions): (file: string) => boolean {
  const resolved = resolveChokidarOptions(
    options,
    new Set([path.join(root, 'dist')]),
    true,
    path.join(root, 'node_modules/.vite'),
    { root, protectedPaths: [path.join(root, '.env.local')] },
  )
  const ignored = resolved.ignored as (string | ((file: string) => boolean))[]
  const matcher = ignored.filter(
    (entry): entry is (file: string) => boolean => typeof entry === 'function',
  )[0]
  expect(matcher).toBeTypeOf('function')
  return matcher
}

describe('resolveChokidarOptions', () => {
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'vite-watch-'))
    fs.writeFileSync(path.join(root, '.gitignore'), GITIGNORE)
  })

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true })
  })

  test('keeps the default ignore list when the option is disabled', () => {
    const resolved = resolveChokidarOptions(
      { ignoredFromGitignore: false },
      new Set([path.join(root, 'dist')]),
      true,
      path.join(root, 'node_modules/.vite'),
      { root, protectedPaths: [] },
    )
    const ignored = resolved.ignored as unknown[]
    expect(ignored.some((entry) => typeof entry === 'function')).toBe(false)
    expect(ignored).toContain('**/.git/**')
    expect(ignored).toContain('**/test-results/**')
  })

  test('ignores paths matched by the root .gitignore', () => {
    const isIgnored = matcherFrom({ ignoredFromGitignore: true })

    expect(isIgnored(path.join(root, 'dist', 'index.js'))).toBe(true)
    expect(isIgnored(path.join(root, 'coverage', 'lcov.info'))).toBe(true)
    // directory-only pattern
    expect(isIgnored(path.join(root, 'logs', 'debug.txt'))).toBe(true)
    expect(isIgnored(path.join(root, 'debug.log'))).toBe(true)
    // nested matches for patterns without a slash
    expect(
      isIgnored(path.join(root, 'packages', 'app', 'dist', 'index.js')),
    ).toBe(true)

    expect(isIgnored(path.join(root, 'src', 'App.vue'))).toBe(false)
    expect(isIgnored(path.join(root, 'index.html'))).toBe(false)
  })

  test('supports negation patterns', () => {
    const isIgnored = matcherFrom({ ignoredFromGitignore: true })

    expect(isIgnored(path.join(root, 'keep.log'))).toBe(false)
  })

  test('never ignores protected paths, even when matched', () => {
    const isIgnored = matcherFrom({ ignoredFromGitignore: true })

    // matched by `*.local` but protected
    expect(isIgnored(path.join(root, '.env.local'))).toBe(false)
    expect(isIgnored(path.join(root, '.env.production.local'))).toBe(true)
  })

  test('never ignores paths outside of the root', () => {
    const isIgnored = matcherFrom({ ignoredFromGitignore: true })

    expect(isIgnored(path.join(os.tmpdir(), 'other', 'dist', 'index.js'))).toBe(
      false,
    )
  })

  test('is a no-op when no .gitignore exists', () => {
    fs.rmSync(path.join(root, '.gitignore'))
    const isIgnored = matcherFrom({ ignoredFromGitignore: true })

    expect(isIgnored(path.join(root, 'dist', 'index.js'))).toBe(false)
    expect(isIgnored(path.join(root, 'logs', 'debug.txt'))).toBe(false)
  })
})

describe('dev server watch.ignoredFromGitignore', () => {
  let server: ViteDevServer

  beforeEach(() => {
    // resolve the symlink so that the paths match what the watcher reports
    // (on macOS, os.tmpdir() is /var/folders/... but the real path is
    // /private/var/folders/...)
    root = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'vite-watch-server-')),
    )
    fs.writeFileSync(path.join(root, '.gitignore'), 'ignored-dir\n*.log\n')
    fs.mkdirSync(path.join(root, 'src'), { recursive: true })
    fs.mkdirSync(path.join(root, 'ignored-dir'), { recursive: true })
    fs.writeFileSync(path.join(root, 'src', 'main.js'), 'console.log(1)\n')
    fs.writeFileSync(path.join(root, 'ignored-dir', 'artifacts.json'), '{}\n')
    fs.writeFileSync(path.join(root, 'index.html'), '<html></html>\n')
  })

  afterEach(async () => {
    await server?.close()
    fs.rmSync(root, { recursive: true, force: true })
  })

  test('does not watch gitignored directories', async () => {
    server = await createServer({
      configFile: false,
      root,
      logLevel: 'silent',
      optimizeDeps: { noDiscovery: true },
      server: {
        middlewareMode: true,
        ws: false,
        watch: { ignoredFromGitignore: true },
      },
    })

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 5000)
      server.watcher.once('ready', () => {
        clearTimeout(timeout)
        resolve()
      })
    })

    const watchedDirs = Object.keys(server.watcher.getWatched()).map(
      normalizePath,
    )
    expect(watchedDirs).toContain(normalizePath(path.join(root, 'src')))
    expect(watchedDirs.filter((dir) => dir.includes('ignored-dir'))).toEqual([])
    expect(server.watcher.getWatched()[root]).not.toContain('ignored-dir')
  })

  test('emits no events for gitignored files, but keeps HMR working', async () => {
    server = await createServer({
      configFile: false,
      root,
      logLevel: 'silent',
      optimizeDeps: { noDiscovery: true },
      server: {
        middlewareMode: true,
        ws: false,
        watch: { ignoredFromGitignore: true },
      },
    })

    const events: string[] = []
    server.watcher.on('all', (_event, file) => {
      events.push(normalizePath(file))
    })

    fs.writeFileSync(path.join(root, 'ignored-dir', 'flooding.log'), 'noise')
    await new Promise((resolve) => setTimeout(resolve, 800))
    expect(events.filter((file) => file.includes('ignored-dir'))).toEqual([])

    fs.writeFileSync(path.join(root, 'src', 'main.js'), 'console.log(2)\n')
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('no change event received')),
        5000,
      )
      const interval = setInterval(() => {
        if (events.some((file) => file.includes('src/main.js'))) {
          clearTimeout(timeout)
          clearInterval(interval)
          resolve()
        }
      }, 100)
    })
  })
})
