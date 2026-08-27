import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, expect, test } from 'vitest'
import { findNearestMainPackageData } from '../packages'

let tempDir: string | undefined

afterEach(() => {
  if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true })
  tempDir = undefined
})

function createFixtures(files: Record<string, object | string>): string {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vite-packages-'))
  for (const [file, content] of Object.entries(files)) {
    const target = path.join(tempDir, file)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(
      target,
      typeof content === 'string' ? content : JSON.stringify(content),
    )
  }
  return tempDir
}

const projectManifest = { name: 'project' }

// paths after realpath resolution under pnpm:
// `<root>/node_modules/.pnpm/dep@1.0.0/node_modules/dep/...`
test('resolves the package root for the pnpm store layout', () => {
  const root = createFixtures({
    'package.json': projectManifest,
    'node_modules/.pnpm/dep@1.0.0/node_modules/dep/package.json': {
      name: 'dep',
      version: '1.0.0',
      license: 'MIT',
    },
    // nested type-marker manifest with a `name` but no `version`
    'node_modules/.pnpm/dep@1.0.0/node_modules/dep/build/esm/package.json': {
      name: 'dep',
      type: 'module',
    },
  })
  const pkg = findNearestMainPackageData(
    path.join(root, 'node_modules/.pnpm/dep@1.0.0/node_modules/dep/build/esm'),
  )
  expect(pkg?.data).toMatchObject({ name: 'dep', version: '1.0.0' })
})

// packages hoisted by pnpm to `node_modules/.pnpm/node_modules/<pkg>`
test('resolves the package root for packages hoisted by pnpm', () => {
  const root = createFixtures({
    'package.json': projectManifest,
    'node_modules/.pnpm/node_modules/hoisted/package.json': {
      name: 'hoisted',
      version: '1.0.0',
    },
    'node_modules/.pnpm/node_modules/hoisted/build/esm/package.json': {
      name: 'hoisted',
      type: 'module',
    },
  })
  const pkg = findNearestMainPackageData(
    path.join(root, 'node_modules/.pnpm/node_modules/hoisted/build/esm'),
  )
  expect(pkg?.data).toMatchObject({ name: 'hoisted', version: '1.0.0' })
})

test('resolves the package root for scoped packages', () => {
  const root = createFixtures({
    'package.json': projectManifest,
    'node_modules/@scope/dep/package.json': {
      name: '@scope/dep',
      version: '2.0.0',
    },
    'node_modules/@scope/dep/dist/esm/package.json': {
      name: '@scope/dep',
      type: 'module',
    },
  })
  const pkg = findNearestMainPackageData(
    path.join(root, 'node_modules/@scope/dep/dist/esm'),
  )
  expect(pkg?.data).toMatchObject({ name: '@scope/dep', version: '2.0.0' })
})
