import { expect, test } from 'vitest'
import { isBuild, page, readDepOptimizationMetadata } from '~utils'

test('optimized dep', async () => {
  expect(await page.textContent('.optimized-dep')).toBe('[success]')
})

test('vue + vuex', async () => {
  expect(await page.textContent('.vue')).toMatch(`[success]`)
})

test.runIf(!isBuild)('metadata', async () => {
  const meta = readDepOptimizationMetadata()
  expect(Object.keys(meta.optimized)).toContain('@vitejs/test-dep-no-discovery')
  expect(Object.keys(meta.optimized)).not.toContain('vue')
  expect(Object.keys(meta.optimized)).not.toContain('vuex')
})
