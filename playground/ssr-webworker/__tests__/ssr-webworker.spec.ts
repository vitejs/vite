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

test.runIf(isBuild)('inlineDynamicImports', () => {
  const dynamicJsContent = findAssetFile(/dynamic-[-\w]+\.js/, 'worker')
  expect(dynamicJsContent).toBe('')
})
