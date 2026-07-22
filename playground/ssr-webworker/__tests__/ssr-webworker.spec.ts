import { expect, test } from 'vitest'
import { port } from './serve'
import { findAssetFile, isBuild, page } from '~utils'

const url = `http://localhost:${port}`

test('/', async () => {
  await page.goto(url + '/')
  expect(await page.textContent('h1')).toMatch('hello from webworker')
  expect(await page.textContent('.linked')).toMatch('dep from upper directory')
  expect(await page.textContent('.external')).toMatch('object')
})

test('supports resolve.conditions', async () => {
  await page.goto(url)
  expect(await page.textContent('.worker-exports')).toMatch('[success] worker')
})

test('respects browser export', async () => {
  await page.goto(url)
  expect(await page.textContent('.browser-exports')).toMatch(
    '[success] browser',
  )
})

test('supports nodejs_compat', async () => {
  await page.goto(url)
  expect(await page.textContent('.nodejs-compat')).toMatch(
    '[success] nodejs compat',
  )
})

test('converts require() of node builtins in bundled CJS deps', async () => {
  await page.goto(url)
  expect(await page.textContent('.cjs-node-builtin')).toMatch(
    '[success] cjs node builtin require',
  )
})

test.runIf(isBuild)('build output does not contain createRequire', async () => {
  const workerContent = findAssetFile(/entry-worker/, 'worker', '')
  expect(workerContent).toBeDefined()
  expect(workerContent).not.toContain('createRequire')
})

test.runIf(isBuild)(
  'converts bundled CJS require() of node builtins to ESM imports',
  async () => {
    const workerContent = findAssetFile(/entry-worker/, 'worker', '')
    expect(workerContent).toBeDefined()
    // `require("node:util")` nested in a bundled CJS module must become an ESM
    // import, not Rolldown's throwing `__require` stub (fix for empty `external`)
    expect(workerContent).not.toContain('__require("node:util")')
    expect(workerContent).toContain('node:util')
  },
)

test.runIf(isBuild)('codeSplitting: false', () => {
  const dynamicJsContent = findAssetFile(/dynamic-[-\w]+\.js/, 'worker')
  expect(dynamicJsContent).toBeUndefined()
})
