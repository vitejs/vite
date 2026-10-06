import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, expect, test } from 'vitest'
import type { ViteDevServer } from '../..'
import { createServer } from '../..'
import { getDepHash } from '../../optimizer'

let root: string
let server: ViteDevServer | undefined

beforeEach(() => {
  // outside the repo so the lockfile lookup does not find the repo's own lockfile
  root = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), 'vite-lockfile-hash-'),
  )
})

afterEach(async () => {
  await server?.close()
  server = undefined
  fs.rmSync(root, { recursive: true, force: true })
})

async function getLockfileHash() {
  server ??= await createServer({
    configFile: false,
    root,
    cacheDir: path.join(root, '.vite'),
    logLevel: 'silent',
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, ws: false },
  })
  return getDepHash(server.environments.client).lockfileHash
}

test('falls back to yarn.lock when no lockfile is found in node_modules', async () => {
  const withoutLockfile = await getLockfileHash()

  fs.writeFileSync(path.join(root, 'yarn.lock'), 'foo@1.0.0:\n')
  const first = await getLockfileHash()
  expect(first).not.toBe(withoutLockfile)

  fs.writeFileSync(path.join(root, 'yarn.lock'), 'foo@1.0.1:\n')
  expect(await getLockfileHash()).not.toBe(first)
})

test('prefers lockfiles in node_modules over yarn.lock', async () => {
  fs.mkdirSync(path.join(root, 'node_modules'))
  fs.writeFileSync(path.join(root, 'node_modules/.yarn-state.yml'), 'state\n')
  fs.writeFileSync(path.join(root, 'yarn.lock'), 'foo@1.0.0:\n')
  const first = await getLockfileHash()

  fs.writeFileSync(path.join(root, 'yarn.lock'), 'foo@1.0.1:\n')
  expect(await getLockfileHash()).toBe(first)

  fs.writeFileSync(path.join(root, 'node_modules/.yarn-state.yml'), 'other\n')
  expect(await getLockfileHash()).not.toBe(first)
})
