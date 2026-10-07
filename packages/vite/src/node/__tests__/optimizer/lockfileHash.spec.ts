import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { beforeAll, expect, test } from 'vitest'
import { getLockfileHash } from '../../optimizer'
import { getHash } from '../../utils'

const fixturesDir = path.join(import.meta.dirname, 'fixtures/lockfile-hash')
let root: string

beforeAll(() => {
  // Copy outside the repo so lookup does not find the repo's own lockfile.
  root = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), 'vite-lockfile-hash-'),
  )
  fs.cpSync(fixturesDir, root, { recursive: true })
  return () => {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('falls back to yarn.lock when no lockfile is found in node_modules', () => {
  const fixture = path.join(root, 'yarn-lock')
  const content = fs.readFileSync(path.join(fixture, 'yarn.lock'))

  expect(getLockfileHash(fixture)).toBe(getHash(content))
})

test('prefers lockfiles in node_modules over yarn.lock', () => {
  const fixture = path.join(root, 'yarn-state')
  const content = fs.readFileSync(
    path.join(fixture, 'node_modules/.yarn-state.yml'),
  )

  expect(getLockfileHash(fixture)).toBe(getHash(content))
})
