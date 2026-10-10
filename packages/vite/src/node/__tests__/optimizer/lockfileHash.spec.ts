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

test('bun: mixes patch file mtimes recorded in patchedDependencies into the hash', () => {
  // The patch lives in a custom `--patches-dir`, which the default `patches/`
  // directory lookup would never find.
  const fixture = path.join(root, 'bun-custom-patches-dir')
  const lockfileContent = fs.readFileSync(path.join(fixture, 'bun.lock'))
  const patchPath = path.join(fixture, 'my-patches/fake-dep@1.0.0.patch')
  const patchContent = fs.readFileSync(patchPath, 'utf-8')

  const before = getLockfileHash(fixture)
  expect(before).not.toBe(getHash(lockfileContent))

  try {
    fs.writeFileSync(patchPath, patchContent + '+extra\n')
    expect(getLockfileHash(fixture)).not.toBe(before)
  } finally {
    fs.writeFileSync(patchPath, patchContent)
  }
})

test('bun: hash equals bun.lock content hash without patchedDependencies', () => {
  const fixture = path.join(root, 'bun-no-patches')
  const content = fs.readFileSync(path.join(fixture, 'bun.lock'))

  expect(getLockfileHash(fixture)).toBe(getHash(content))
})
