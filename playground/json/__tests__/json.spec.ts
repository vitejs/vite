import { readFileSync } from 'fs'
import testJson from '../test.json'
import { isBuild, page } from '~utils'

const deepJson = require('vue/package.json')
const stringified = JSON.stringify(testJson)
const deepStringified = JSON.stringify(deepJson)

test('default import', async () => {
  expect(await page.textContent('.full')).toBe(stringified)
})

test('named import', async () => {
  expect(await page.textContent('.named')).toBe(testJson.hello)
})

test('deep import', async () => {
  expect(await page.textContent('.deep-full')).toBe(deepStringified)
})

test('named deep import', async () => {
  expect(await page.textContent('.deep-named')).toBe(deepJson.name)
})

test('dynamic import', async () => {
  expect(await page.textContent('.dynamic')).toBe(stringified)
})

test('dynamic import, named', async () => {
  expect(await page.textContent('.dynamic-named')).toBe(testJson.hello)
})

test('fetch', async () => {
  expect(await page.textContent('.fetch')).toBe(stringified)
})

test('?url', async () => {
  expect(await page.textContent('.url')).toMatch(
    isBuild ? 'data:application/json' : '/test.json'
  )
})

test('?raw', async () => {
  expect(await page.textContent('.raw')).toBe(
    readFileSync(require.resolve('../test.json'), 'utf-8')
  )
})
