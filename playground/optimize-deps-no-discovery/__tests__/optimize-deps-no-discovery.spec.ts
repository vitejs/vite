import { expect, test } from 'vitest'
import { isBuild, page, readFile } from '~utils'

test('optimized dep', async () => {
  expect(await page.textContent('.optimized-dep')).toBe('[success]')
})

test('vue + vuex', async () => {
  expect(await page.textContent('.vue')).toMatch(`[success]`)
})

test.runIf(!isBuild)('metadata', async () => {
  const meta = await readFile('node_modules/.vite/deps/_metadata.json')
  expect(meta).toMatch(`"@vitejs/test-dep-no-discovery"`)
  expect(meta).not.toMatch(`"vue"`)
  expect(meta).not.toMatch(`"vuex"`)
})
