import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, expect, test } from 'vitest'
import type { ViteDevServer } from '../..'
import { createLogger, createServer } from '../..'

const servers = new Set<ViteDevServer>()
let root: string | undefined

afterEach(async () => {
  await Promise.allSettled([...servers].map((server) => server.close()))
  servers.clear()
  if (root) fs.rmSync(root, { recursive: true, force: true })
  root = undefined
})

// regression test for https://github.com/vitejs/vite/issues/23757
test('optimizer handles deconflicted and duplicate entry chunk file names', async () => {
  root = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), 'vite-dup-entry-chunk-'),
  )
  const depDir = path.join(root, 'node_modules', 'test-dup-entry')
  fs.mkdirSync(path.join(depDir, 'dist'), { recursive: true })
  fs.writeFileSync(
    path.join(depDir, 'package.json'),
    JSON.stringify({
      name: 'test-dup-entry',
      version: '1.0.0',
      type: 'module',
      exports: {
        './Entry': './dist/entry-one.js',
        './entry': './dist/entry-two.js',
      },
    }),
  )
  fs.writeFileSync(
    path.join(depDir, 'dist', 'entry-one.js'),
    'export const entryOne = "one"\n',
  )
  fs.writeFileSync(
    path.join(depDir, 'dist', 'entry-two.js'),
    'import { entryOne } from "./entry-one.js"\nexport const entryTwo = "two " + entryOne\n',
  )
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ name: 'test-dup-entry-chunk', type: 'module' }),
  )

  const errors: string[] = []
  const logger = createLogger('error')
  logger.error = (msg) => {
    errors.push(typeof msg === 'string' ? msg : String(msg))
  }

  const server = await createServer({
    configFile: false,
    customLogger: logger,
    root,
    cacheDir: path.join(root, 'node_modules', '.vite'),
    optimizeDeps: {
      force: true,
      noDiscovery: true,
      include: ['test-dup-entry/Entry', 'test-dup-entry/entry'],
    },
    server: {
      middlewareMode: true,
      ws: false,
    },
  })
  servers.add(server)

  const client = server.environments.client
  await client.init()
  const entryProcessing =
    client.depsOptimizer?.metadata.discovered?.['test-dup-entry/Entry']
      ?.processing ??
    client.depsOptimizer?.metadata.discovered?.['test-dup-entry/entry']
      ?.processing
  if (entryProcessing) {
    await entryProcessing
  }
  expect(errors).toStrictEqual([])

  const metadata = client.depsOptimizer?.metadata
  const entryOne = metadata?.optimized['test-dup-entry/Entry']
  const entryTwo = metadata?.optimized['test-dup-entry/entry']

  expect(entryOne).toBeDefined()
  expect(entryTwo).toBeDefined()
  expect(fs.existsSync(entryOne!.file)).toBe(true)
  expect(fs.existsSync(entryTwo!.file)).toBe(true)
  expect(entryOne!.fileHash).toBeDefined()
  expect(entryTwo!.fileHash).toBeDefined()
})
