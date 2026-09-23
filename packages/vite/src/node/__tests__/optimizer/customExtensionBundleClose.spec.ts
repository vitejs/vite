import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, expect, test } from 'vitest'
import type { ViteDevServer } from '../..'
import { createServer } from '../..'

const servers = new Set<ViteDevServer>()
let root: string | undefined

afterEach(async () => {
  await Promise.allSettled([...servers].map((server) => server.close()))
  servers.clear()
  if (root) fs.rmSync(root, { recursive: true, force: true })
  root = undefined
})

test('closes temporary Rolldown bundles used to analyze custom optimizeDeps extensions', async () => {
  root = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), 'vite-optimizer-extension-close-'),
  )
  const cacheDir = path.join(root, '.vite')
  const depDir = path.join(root, 'node_modules', 'custom-extension-dep')
  fs.mkdirSync(depDir, { recursive: true })
  fs.writeFileSync(
    path.join(depDir, 'package.json'),
    JSON.stringify({
      name: 'custom-extension-dep',
      version: '1.0.0',
      type: 'module',
      main: 'index.notjs',
    }),
  )
  fs.writeFileSync(
    path.join(depDir, 'index.notjs'),
    '<notjs>export const marker = "custom-extension"</notjs>\n',
  )

  let bundleStarts = 0
  let bundleCloses = 0
  const optimizerPlugin = {
    name: 'test:custom-extension-bundle-lifecycle',
    buildStart() {
      bundleStarts++
    },
    closeBundle() {
      bundleCloses++
    },
    load: {
      filter: { id: /\.notjs$/ },
      handler(id: string) {
        return fs
          .readFileSync(id, 'utf8')
          .replace('<notjs>', '')
          .replace('</notjs>', '')
      },
    },
  }

  const server = await createServer({
    configFile: false,
    root,
    cacheDir,
    logLevel: 'silent',
    optimizeDeps: {
      force: true,
      noDiscovery: true,
      include: ['custom-extension-dep'],
      extensions: ['.notjs'],
      rolldownOptions: {
        plugins: [optimizerPlugin],
      },
    },
    server: {
      middlewareMode: true,
      ws: false,
    },
  })
  servers.add(server)

  // One bundle analyzes exports for the custom extension and another performs
  // the dependency prebundle. Every Rolldown JavaScript-API bundle should be
  // closed after generation so optimizer-only closeBundle hooks and native
  // resources are settled.
  expect(bundleStarts).toBeGreaterThan(1)
  expect(bundleCloses).toBe(bundleStarts)
})
