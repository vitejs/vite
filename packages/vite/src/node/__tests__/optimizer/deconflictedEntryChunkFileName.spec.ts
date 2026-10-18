import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, expect, test } from 'vitest'
import type { ViteDevServer } from '../..'
import { createLogger, createServer } from '../..'

let server: ViteDevServer | undefined
let root: string | undefined

afterEach(async () => {
  await server?.close()
  server = undefined
  if (root) fs.rmSync(root, { recursive: true, force: true })
  root = undefined
})

// regression test for https://github.com/vitejs/vite/issues/23757
// Rolldown deconflicts entry chunk file names case-insensitively, so when two
// optimized deps flatten to names that differ only in case (e.g. `effect/Schema`
// and `effect/schema` become `effect_Schema` and `effect_schema`), the second
// entry chunk is emitted with a suffixed file name (`effect_schema2.js`). The
// optimizer used to look the dep up by chunk file name only and crashed while
// destructuring `undefined`. The chunk name (`[name]` in
// `entryFileNames: '[name].js'`) is the dep's flattened id, so it is used as the
// fallback lookup key, and the dep points at the file that was actually emitted.
test('optimizer handles rolldown-deconflicted entry chunk file names', async () => {
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
    'export const entryTwo = "two"\n',
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

  server = await createServer({
    configFile: false,
    customLogger: logger,
    root,
    // keep the optimizer cache inside the temp root so this spec never shares
    // (and wipes) the dep cache of specs running in parallel
    cacheDir: path.join(root, 'node_modules', '.vite'),
    optimizeDeps: {
      force: true,
      noDiscovery: true,
      include: ['test-dup-entry/Entry', 'test-dup-entry/entry'],
    },
  })

  await server.listen()
  await server.environments.client.waitForRequestsIdle()
  expect(errors).toStrictEqual([])

  const metadata = server.environments.client.depsOptimizer?.metadata
  const entryOne = metadata?.optimized['test-dup-entry/Entry']
  const entryTwo = metadata?.optimized['test-dup-entry/entry']
  expect(entryOne).toBeDefined()
  expect(entryTwo).toBeDefined()
  // the second entry chunk is emitted under a deconflicted file name and each
  // dep must point at the file that was actually written
  expect(entryOne!.file).toMatch(/test-dup-entry_Entry\.js$/)
  expect(entryTwo!.file).toMatch(/test-dup-entry_entry2\.js$/)
  expect(fs.existsSync(entryOne!.file)).toBe(true)
  expect(fs.existsSync(entryTwo!.file)).toBe(true)
})
