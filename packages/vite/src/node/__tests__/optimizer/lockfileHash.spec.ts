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

test('hash changes when a patch file is edited in place', () => {
  const fixture = path.join(root, 'yarn-patches')
  const patchPath = path.join(fixture, 'patches/foo+1.0.0.patch')
  // the patches dir is only hashed when a lockfile whose format opts into
  // it (here: yarn 1's .yarn-integrity) exists
  fs.mkdirSync(path.join(fixture, 'node_modules'), { recursive: true })
  fs.writeFileSync(path.join(fixture, 'node_modules/.yarn-integrity'), '{}')
  const hashBefore = getLockfileHash(fixture)

  // overwriting an existing file does not change the directory's mtime
  fs.writeFileSync(patchPath, 'edited patch content\n')
  // bump the mtime explicitly so the test does not depend on the
  // filesystem's timestamp resolution
  const { atime, mtime } = fs.statSync(patchPath)
  fs.utimesSync(patchPath, atime, new Date(mtime.getTime() + 1000))

  expect(getLockfileHash(fixture)).not.toBe(hashBefore)
})
